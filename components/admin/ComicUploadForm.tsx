"use client";

import { useRef, useState, FormEvent } from "react";
import { dateInCT } from "@/lib/timezone";

type Props = {
  onCreated: () => void;
};

export default function ComicUploadForm({ onCreated }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [releaseDate, setReleaseDate] = useState(dateInCT(1)); // defaults to tomorrow, CT
  const [freezeDate, setFreezeDate] = useState(dateInCT(1));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await fetch("/api/admin/comics", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      formRef.current?.reset();
      setReleaseDate(dateInCT(1));
      setFreezeDate(dateInCT(1));
      onCreated();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="space-y-3 bg-white p-6 rounded-2xl shadow"
    >
      <h2 className="font-semibold text-lg">Schedule a comic</h2>

      <div>
        <label className="block text-sm text-neutral-600 mb-1">Comic image</label>
        <input type="file" name="image" accept="image/*" required className="w-full" />
      </div>

      <div>
        <label className="block text-sm text-neutral-600 mb-1">Artist name (optional)</label>
        <input
          type="text"
          name="artistName"
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
            defaultValue="10:00"
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
            defaultValue="23:59"
            required
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-indigo-600 text-white rounded-lg py-2 font-semibold disabled:opacity-50"
      >
        {submitting ? "Uploading…" : "Schedule comic"}
      </button>
    </form>
  );
}
