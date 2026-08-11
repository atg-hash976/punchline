"use client";

import { useState, FormEvent } from "react";
import { dateStringInCT, timeStringInCT } from "@/lib/timezone";

type Comic = {
  id: string;
  imageUrl: string;
  colorImageUrl: string | null;
  artistName: string | null;
  releaseAt: string;
  freezeAt: string;
};

export default function EditComicModal({
  comic,
  onClose,
  onSaved,
}: {
  comic: Comic;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [releaseDate, setReleaseDate] = useState(dateStringInCT(new Date(comic.releaseAt)));
  const [releaseTime, setReleaseTime] = useState(timeStringInCT(new Date(comic.releaseAt)));
  const [freezeDate, setFreezeDate] = useState(dateStringInCT(new Date(comic.freezeAt)));
  const [freezeTime, setFreezeTime] = useState(timeStringInCT(new Date(comic.freezeAt)));
  const [artistName, setArtistName] = useState(comic.artistName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await fetch(`/api/admin/comics/${comic.id}`, { method: "PATCH", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Couldn't save changes.");
        return;
      }
      onSaved();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-3 bg-white p-6 rounded-2xl shadow-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Edit scheduled comic</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 text-sm"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div>
          <label className="block text-sm text-neutral-600 mb-1">
            Comic image (black &amp; white) — leave blank to keep current
          </label>
          <img src={comic.imageUrl} alt="" className="w-16 h-16 object-cover rounded-lg bg-neutral-100 mb-1" />
          <input type="file" name="image" accept="image/*" className="w-full" />
        </div>

        <div>
          <label className="block text-sm text-neutral-600 mb-1">
            Color version — leave blank to keep current
          </label>
          {comic.colorImageUrl && (
            <img
              src={comic.colorImageUrl}
              alt=""
              className="w-16 h-16 object-cover rounded-lg bg-neutral-100 mb-1"
            />
          )}
          <input type="file" name="colorImage" accept="image/*" className="w-full" />
        </div>

        <div>
          <label className="block text-sm text-neutral-600 mb-1">Artist name (optional)</label>
          <input
            type="text"
            name="artistName"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            placeholder="Leave blank if AI-generated"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-neutral-600 mb-1">Release date (CT)</label>
            <input
              type="date"
              name="releaseDate"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-600 mb-1">Release time (CT)</label>
            <input
              type="time"
              name="releaseTime"
              value={releaseTime}
              onChange={(e) => setReleaseTime(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-neutral-600 mb-1">Freeze date (CT)</label>
            <input
              type="date"
              name="freezeDate"
              value={freezeDate}
              onChange={(e) => setFreezeDate(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-600 mb-1">Freeze time (CT)</label>
            <input
              type="time"
              name="freezeTime"
              value={freezeTime}
              onChange={(e) => setFreezeTime(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-2 justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-neutral-600 hover:bg-neutral-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
