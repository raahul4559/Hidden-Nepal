import type {
  InstagramRightsStatus,
  InstagramSourceMethod,
} from "@/generated/prisma/enums";

/** A normalized Instagram reference ready for validation and import. */
export type InstagramCandidate = {
  destinationSlug: string;
  shortcode: string;
  url: string;
  creatorUsername?: string;
  caption?: string;
  locationTag?: string;
  /** Metadata only. Instagram CDN URLs expire and are never rehosted. */
  imageUrl?: string;
  sourceMethod: InstagramSourceMethod;
  rightsStatus: InstagramRightsStatus;
  rightsNote?: string;
  collectedAt: Date;
};

export type RejectedRecord = {
  kind: "post" | "place";
  source: string;
  postUrl?: string;
  destinationSlug?: string;
  reason: string;
};
