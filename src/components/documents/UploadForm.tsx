"use client";

import { useState } from "react";
import { API_BASE_URL, getToken } from "@/lib/api";

export default function UploadForm({
  leadId,
  onUploaded,
}: {
  leadId: string;
  onUploaded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useStateukle</div>
      <input
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="block w-full rounded-lg border p-3"
      />
      <button
        type="submit"
        disabled={!file || loading}
        className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Yukleniyor..." : "Yukle"}
      </button>
      {message && <div className="mt-3 text-sm text-slate-600">{message}</div>}
    </form>
  );
}
