import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { put } from "@vercel/blob";

const COMICS_DIR = path.join(process.cwd(), "public", "comics");

function extensionFor(filename: string): string {
  return (filename.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Stores a comic image and returns its public URL. Picks the backend from
 * environment, not a runtime flag, so there's nothing to misconfigure per call:
 *
 *   - BLOB_READ_WRITE_TOKEN set  -> Vercel Blob (survives serverless deploys)
 *   - not set                    -> local disk under public/comics/ (dev only —
 *                                    an ephemeral serverless filesystem loses
 *                                    these on the next deploy/cold start)
 *
 * Get a token by creating a Blob store in your Vercel project's Storage tab;
 * Vercel sets BLOB_READ_WRITE_TOKEN automatically for deployments linked to
 * that store. No local emulator exists for Blob, so this fallback is also how
 * comic upload stays testable without a Vercel account.
 */
export async function storeComicImage(image: File): Promise<string> {
  const ext = extensionFor(image.name);
  const filename = `${uuidv4()}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`comics/${filename}`, image, { access: "public" });
    return blob.url;
  }

  await mkdir(COMICS_DIR, { recursive: true });
  const bytes = Buffer.from(await image.arrayBuffer());
  await writeFile(path.join(COMICS_DIR, filename), bytes);
  return `/comics/${filename}`;
}
