import "server-only";

import { createHash } from "node:crypto";

import {
  matchesImageSignature,
  validateImageMeta,
} from "./validation";

export type UploadResult = {
  provider: "cloudinary";
  url: string;
  publicId: string;
  width: number | null;
  height: number | null;
  format: string | null;
  bytes: number | null;
};

export type StorageProvider = {
  name: "cloudinary";
  configured: true;
  upload(file: File): Promise<UploadResult>;
  destroy(publicId: string): Promise<void>;
};

type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder: string;
};

function readConfig(): CloudinaryConfig | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) return null;
  return {
    cloudName,
    apiKey,
    apiSecret,
    folder: process.env.CLOUDINARY_FOLDER?.trim() || "hidden-nepal/destinations",
  };
}

function sign(params: Record<string, string>, secret: string) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(`${payload}${secret}`).digest("hex");
}

/** Returns a provider only when all server-side credentials are present. */
export function getStorageProvider(): StorageProvider | null {
  const config = readConfig();
  if (!config) return null;

  return {
    name: "cloudinary",
    configured: true,
    async upload(file) {
      const metaError = validateImageMeta(file.type, file.size);
      if (metaError) throw new Error(metaError);

      const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
      if (!matchesImageSignature(header, file.type)) {
        throw new Error("That file does not look like a valid image.");
      }

      const timestamp = String(Math.floor(Date.now() / 1000));
      const signed = { folder: config.folder, timestamp };
      const form = new FormData();
      form.set("file", file);
      form.set("api_key", config.apiKey);
      form.set("timestamp", timestamp);
      form.set("folder", config.folder);
      form.set("signature", sign(signed, config.apiSecret));

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
        { method: "POST", body: form },
      );
      if (!response.ok) {
        console.error("[uploads] Cloudinary rejected an upload", response.status);
        throw new Error("The storage provider rejected the upload. Please try again.");
      }

      const json = (await response.json()) as {
        secure_url?: string;
        public_id?: string;
        width?: number;
        height?: number;
        format?: string;
        bytes?: number;
      };
      if (!json.secure_url || !json.public_id) {
        throw new Error("The storage provider returned an incomplete response.");
      }

      return {
        provider: "cloudinary",
        url: json.secure_url,
        publicId: json.public_id,
        width: json.width ?? null,
        height: json.height ?? null,
        format: json.format ?? null,
        bytes: json.bytes ?? null,
      };
    },
    async destroy(publicId) {
      const timestamp = String(Math.floor(Date.now() / 1000));
      const signed = { public_id: publicId, timestamp };
      const form = new FormData();
      form.set("public_id", publicId);
      form.set("api_key", config.apiKey);
      form.set("timestamp", timestamp);
      form.set("signature", sign(signed, config.apiSecret));

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`,
        { method: "POST", body: form },
      );
      if (!response.ok) {
        console.error("[uploads] Cloudinary cleanup failed", response.status);
      }
    },
  };
}

export function isStorageConfigured() {
  return readConfig() !== null;
}
