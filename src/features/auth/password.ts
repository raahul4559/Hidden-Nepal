import "server-only";

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Password hashing with scrypt from Node's standard library: a memory-hard KDF
 * recommended by OWASP. No custom cryptography; this module only chooses
 * parameters and a self-describing storage format:
 *
 *   scrypt$<N>$<r>$<p>$<salt base64>$<key base64>
 *
 * Parameters are stored with each hash so they can be raised later without
 * breaking existing accounts (`needsRehash`).
 */

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/** OWASP Password Storage Cheat Sheet: N=2^17, r=8, p=1. */
const PARAMS = { N: 2 ** 17, r: 8, p: 1 } as const;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

function maxmemFor(N: number, r: number) {
  // scrypt needs ~128·N·r bytes; leave headroom.
  return 256 * N * r;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const { N, r, p } = PARAMS;
  const key = await scryptAsync(password.normalize("NFKC"), salt, KEY_LENGTH, {
    N,
    r,
    p,
    maxmem: maxmemFor(N, r),
  });
  return ["scrypt", N, r, p, salt.toString("base64"), key.toString("base64")].join("$");
}

type ParsedHash = { N: number; r: number; p: number; salt: Buffer; key: Buffer };

function parseHash(stored: string): ParsedHash | null {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return null;
  const [N, r, p] = parts.slice(1, 4).map(Number);
  // Refuse absurd parameters from a tampered row rather than exhausting memory.
  if (![N, r, p].every(Number.isSafeInteger) || N < 2 ** 14 || N > 2 ** 20 || r < 1 || r > 32 || p < 1 || p > 16) {
    return null;
  }
  const salt = Buffer.from(parts[4], "base64");
  const key = Buffer.from(parts[5], "base64");
  if (salt.length < SALT_LENGTH || key.length !== KEY_LENGTH) return null;
  return { N, r, p, salt, key };
}

/** Constant-time comparison. Malformed hashes never verify. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parsed = parseHash(stored);
  if (!parsed) return false;
  const { N, r, p, salt, key } = parsed;
  const candidate = await scryptAsync(password.normalize("NFKC"), salt, key.length, {
    N,
    r,
    p,
    maxmem: maxmemFor(N, r),
  });
  return timingSafeEqual(candidate, key);
}

export function needsRehash(stored: string): boolean {
  const parsed = parseHash(stored);
  return !parsed || parsed.N < PARAMS.N || parsed.r !== PARAMS.r || parsed.p !== PARAMS.p;
}

let dummyHash: Promise<string> | undefined;

/**
 * Burns the same time as a real check when the email is unknown, so response
 * timing does not reveal which emails have accounts.
 */
export async function verifyAgainstDummy(password: string): Promise<false> {
  dummyHash ??= hashPassword("dummy-password-for-timing");
  await verifyPassword(password, await dummyHash);
  return false;
}
