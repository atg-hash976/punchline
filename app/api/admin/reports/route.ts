import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

// ---------------------------------------------------------------------
// GET /api/admin/reports — captions with at least one report, grouped and
// counted, most-reported first. The moderation queue.
// ---------------------------------------------------------------------
export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const grouped = await prisma.report.groupBy({
    by: ["captionId"],
    _count: { captionId: true },
    orderBy: { _count: { captionId: "desc" } },
  });

  const captions = await prisma.caption.findMany({
    where: { id: { in: grouped.map((g) => g.captionId) } },
    include: { comic: true },
  });

  const reports = grouped
    .map((g) => {
      const caption = captions.find((c) => c.id === g.captionId);
      if (!caption) return null;
      return {
        captionId: g.captionId,
        count: g._count.captionId,
        username: caption.username,
        city: caption.city,
        text: caption.text,
        comicImageUrl: caption.comic.imageUrl,
        comicReleaseAt: caption.comic.releaseAt,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  return NextResponse.json({ reports });
}
