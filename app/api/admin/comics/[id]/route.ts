import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { ctWallTimeToUTC } from "@/lib/timezone";
import { storeComicImage } from "@/lib/storage";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB

// ---------------------------------------------------------------------
// PATCH /api/admin/comics/[id] — edit a not-yet-released comic.
// Same fields as POST /api/admin/comics; images are only replaced if a
// new file is provided, otherwise the existing one is kept. Only comics
// that haven't gone live yet can be edited — once a comic is live, real
// captions/votes are attached to it, so changing its image or timing out
// from under players would be actively harmful, not just confusing.
// ---------------------------------------------------------------------
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const existing = await prisma.comic.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Comic not found" }, { status: 404 });
  }
  if (existing.releaseAt <= new Date()) {
    return NextResponse.json(
      { error: "This comic has already gone live and can no longer be edited." },
      { status: 403 }
    );
  }

  const form = await req.formData();
  const image = form.get("image");
  const colorImage = form.get("colorImage");
  const artistName = (form.get("artistName") as string | null)?.trim() || null;
  const releaseDate = form.get("releaseDate") as string | null;
  const releaseTime = form.get("releaseTime") as string | null;
  const freezeDate = form.get("freezeDate") as string | null;
  const freezeTime = form.get("freezeTime") as string | null;

  const hasNewImage = image instanceof File && image.size > 0;
  if (hasNewImage) {
    if (!(image as File).type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }
    if ((image as File).size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image must be under 8MB" }, { status: 400 });
    }
  }

  const hasNewColorImage = colorImage instanceof File && colorImage.size > 0;
  if (hasNewColorImage) {
    if (!(colorImage as File).type.startsWith("image/")) {
      return NextResponse.json({ error: "Color image file must be an image" }, { status: 400 });
    }
    if ((colorImage as File).size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Color image must be under 8MB" }, { status: 400 });
    }
  }

  if (!releaseDate || !releaseTime || !freezeDate || !freezeTime) {
    return NextResponse.json(
      { error: "releaseDate, releaseTime, freezeDate, and freezeTime are all required" },
      { status: 400 }
    );
  }

  const releaseAt = ctWallTimeToUTC(releaseDate, releaseTime);
  const freezeAt = ctWallTimeToUTC(freezeDate, freezeTime);
  if (freezeAt <= releaseAt) {
    return NextResponse.json({ error: "Freeze time must be after release time" }, { status: 400 });
  }

  const imageUrl = hasNewImage ? await storeComicImage(image as File) : existing.imageUrl;
  const colorImageUrl = hasNewColorImage
    ? await storeComicImage(colorImage as File)
    : existing.colorImageUrl;

  const comic = await prisma.comic.update({
    where: { id: params.id },
    data: { imageUrl, colorImageUrl, artistName, releaseAt, freezeAt },
  });

  return NextResponse.json({ comic });
}
