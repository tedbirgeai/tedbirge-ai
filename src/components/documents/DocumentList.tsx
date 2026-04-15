"use client";

import { DocumentItem } from "@/types/lead";

function safeParse(value?: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export default function DocumentList({
  documents,
}: {
  documents: DocumentItem[];
}) {
  return (
    <div className="space-y-4">
      {documents.map((doc) => {
        const ai = safeParse(doc.aiAnalysis || doc.extractedJson);
        return (
          <div key={doc.id} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold">{doc.originalName || "Dosya"}</div>
                <div className="text-sm text-slate-500">
                  {doc.type || "-"} | {doc.status || "-"}
                </div>
              </div>
            </div>

            {ai && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-1 text-sm font-semibold">Ozet</div>
                  <div className="text-sm text-slate-700">{ai.summary || "-"}</div>
                </div>
                <div>
                  <div className="mb-1 text-sm font-semibold">Qualification Score</div>
                  <div className="text-sm text-slate-700">
                    {ai.qualificationScore ?? "-"}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-sm font-semibold">Guçlu Noktalar</div>
                  <ul className="list-disc pl-5 text-sm text-slate-700">
                    {(ai.strengths || []).map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="mb-1 text-sm font-semibold">Eksik Evraklar</div>
                  <ul className="list-disc pl-5 text-sm text-slate-700">
                    {(ai.missingDocuments || []).map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {doc.parsedText && (
              <div className="mt-4">
                <div className="mb-1 text-sm font-semibold">Parsed Text Onizleme</div>
                <pre className="max-h-80 overflow-auto rounded-xl bg-slate-100 p-3 text-xs whitespace-pre-wrap">
{doc.parsedText.slice(0, 3000)}
                </pre>
              </div>
            )}
          </div>
        );
      })}

      {!documents.length && (
        <div className="rounded-2xl border bg-white p-5 text-slate-500 shadow-sm">
          Henuz belge yok.
        </div>
      )}
    </div>
  );
}
