"use client";

import Link from "next/link";
import { Lead } from "@/types/lead";

export default function LeadTable({ leads }: { leads: Lead[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-4 py-3 text-left">Lead Code</th>
            <th className="px-4 py-3 text-left">Musteri</th>
            <th className="px-4 py-3 text-left">Telefon</th>
            <th className="px-4 py-3 text-left">Sehir</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Skor</th>
            <th className="px-4 py-3 text-left">Detay</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-t">
              <td className="px-4 py-3">{lead.leadCode || "-"}</td>
              <td className="px-4 py-3">{lead.customerName || "-"}</td>
              <td className="px-4 py-3">{lead.customerPhone || "-"}</td>
              <td className="px-4 py-3">{lead.city || "-"}</td>
              <td className="px-4 py-3">{lead.status || "-"}</td>
              <td className="px-4 py-3">{lead.qualificationScore ?? 0}</td>
              <td className="px-4 py-3">
                <Link
                  className="rounded-lg bg-slate-900 px-3 py-2 text-white"
                  href={/leads/}
                >
                  Ac
                </Link>
              </td>
            </tr>
          ))}
          {!leads.length && (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                Lead bulunamadi
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
