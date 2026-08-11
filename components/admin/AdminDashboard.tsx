"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ComicUploadForm from "./ComicUploadForm";

type Comic = {
  id: string;
  imageUrl: string;
  colorImageUrl: string | null;
  artistName: string | null;
  releaseAt: string;
  freezeAt: string;
};

type Report = {
  captionId: string;
  count: number;
  username: string;
  city: string | null;
  text: string;
  comicImageUrl: string;
  comicReleaseAt: string;
};

function formatCT(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/Chicago",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusOf(comic: Comic, now: number): { label: string; className: string } {
  const releaseAt = new Date(comic.releaseAt).getTime();
  const freezeAt = new Date(comic.freezeAt).getTime();
  if (now < releaseAt) return { label: "Upcoming", className: "bg-blue-100 text-blue-700" };
  if (now < freezeAt) return { label: "Live", className: "bg-green-100 text-green-700" };
  return { label: "Frozen", className: "bg-neutral-200 text-neutral-600" };
}

export default function AdminDashboard() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportError, setReportError] = useState<string | null>(null);
  const router = useRouter();

  const loadComics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/comics");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setComics(data.comics ?? []);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const res = await fetch("/api/admin/reports");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setReports(data.reports ?? []);
    } finally {
      setReportsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadComics();
    loadReports();
  }, [loadComics, loadReports]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  async function handleDismiss(captionId: string) {
    setReportError(null);
    await fetch("/api/admin/reports/dismiss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ captionId }),
    });
    loadReports();
  }

  async function handleRemoveCaption(captionId: string) {
    setReportError(null);
    const res = await fetch("/api/admin/reports/remove-caption", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ captionId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setReportError(data.error ?? "Couldn't remove that caption.");
      return;
    }
    loadReports();
  }

  const now = Date.now();

  return (
    <main className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Comic Admin</h1>
        <button onClick={handleLogout} className="text-sm text-neutral-500 hover:underline">
          Log out
        </button>
      </div>

      <ComicUploadForm onCreated={loadComics} />

      <div>
        <h2 className="font-semibold text-lg mb-2">Scheduled comics</h2>
        {loading ? (
          <p className="text-neutral-500 text-sm">Loading…</p>
        ) : comics.length === 0 ? (
          <p className="text-neutral-500 text-sm">No comics scheduled yet.</p>
        ) : (
          <ul className="space-y-2">
            {comics.map((comic) => {
              const status = statusOf(comic, now);
              return (
                <li
                  key={comic.id}
                  className="flex items-center gap-3 bg-white rounded-xl shadow p-3"
                >
                  <img
                    src={comic.imageUrl}
                    alt=""
                    className="w-16 h-16 object-cover rounded-lg bg-neutral-100"
                  />
                  <div className="flex-1 min-w-0 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                      {comic.artistName && (
                        <span className="text-neutral-500 truncate">by {comic.artistName}</span>
                      )}
                      {comic.colorImageUrl && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                          🎨 color ready
                        </span>
                      )}
                    </div>
                    <div className="text-neutral-600 mt-1">
                      Releases {formatCT(comic.releaseAt)} CT
                    </div>
                    <div className="text-neutral-400">Freezes {formatCT(comic.freezeAt)} CT</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div>
        <h2 className="font-semibold text-lg mb-2">Reported captions</h2>
        {reportError && <p className="text-red-600 text-sm mb-2">{reportError}</p>}
        {reportsLoading ? (
          <p className="text-neutral-500 text-sm">Loading…</p>
        ) : reports.length === 0 ? (
          <p className="text-neutral-500 text-sm">Nothing reported — the queue is empty.</p>
        ) : (
          <ul className="space-y-2">
            {reports.map((r) => (
              <li key={r.captionId} className="bg-white rounded-xl shadow p-3 space-y-2">
                <div className="flex items-start gap-3">
                  <img
                    src={r.comicImageUrl}
                    alt=""
                    className="w-14 h-14 object-cover rounded-lg bg-neutral-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0 text-sm">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      {r.count} {r.count === 1 ? "report" : "reports"}
                    </span>
                    <p className="mt-1">"{r.text}"</p>
                    <p className="text-neutral-500">
                      — {r.username}
                      {r.city ? `, ${r.city}` : ""} · {formatCT(r.comicReleaseAt)} CT
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => handleDismiss(r.captionId)}
                    className="text-xs px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleRemoveCaption(r.captionId)}
                    className="text-xs px-3 py-1.5 rounded-full bg-red-600 text-white hover:bg-red-700"
                  >
                    Remove caption
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
