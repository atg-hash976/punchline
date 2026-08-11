import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { ctWallTimeToUTC } from "@/lib/timezone";
import { storeComicImage } from "@/lib/storage";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB

// ---------------------------------------------------------------------
// GET /api/admin/comics — list, most recently released first.
// ---------------------------------------------------------------------
export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const comics = await prisma.comic.findMany({
    orderBy: { releaseAt: "desc" },
    take: 30,
  });

  return NextResponse.json({ comics });
}

// ---------------------------------------------------------------------
// POST /api/admin/comics — upload an image and schedule a comic.
// multipart/form-data: image, artistName?, releaseDate, releaseTime,
// freezeDate, freezeTime (all times are CT wall-clock).
// ---------------------------------------------------------------------
export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const form = await req.formData();
  const image = form.get("image");
  const colorImage = form.get("colorImage");
  const artistName = (form.get("artistName") as string | null)?.trim() || null;
  const releaseDate = form.get("releaseDate") as string | null;
  const releaseTime = form.get("releaseTime") as string | null;
  const freezeDate = form.get("freezeDate") as string | null;
  const freezeTime = form.get("freezeTime") as string | null;

  if (!(image instanceof File)) {
    return NextResponse.json({ error: "Comic image is required" }, { status: 400 });
  }
  if (!image.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }
  if (image.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image must be under 8MB" }, { status: 400 });
  }
  const hasColorImage = colorImage instanceof File && colorImage.size > 0;
  if (hasColorImage) {
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

  const imageUrl = await storeComicImage(image);
  const colorImageUrl = hasColorImage ? await storeComicImage(colorImage as File) : null;

  const comic = await prisma.comic.create({
    data: {
      imageUrl,
      colorImageUrl,
      artistName,
      releaseAt,
      freezeAt,
    },
  });

  return NextResponse.json({ comic });
}
