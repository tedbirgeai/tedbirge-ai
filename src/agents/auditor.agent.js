// TUR #55 A24 — Auditor: sistem sağlığı periyodik denetim (her 5 dk)

const BaseAgent = require("./base.agent");
const prisma = require("../config/db");

class AuditorAgent extends BaseAgent {
  constructor() {
    super("Auditor", { intervalMs: 5 * 60_000 });
  }

  async run() {
    // TUR #72.9 D5 — Auditor heartbeat: her tick basinda kanit AgentEvent (kullaniciya "Son aktivite" gorsel kaniti)
    try {
      await prisma.agentEvent.create({
        data: {
          agentName: "auditor",
          eventType: "HEARTBEAT",
          severity: "INFO",
          payload: {
            tickAt: new Date().toISOString(),
            message: "Auditor 5 dk tick basladi",
          },
        },
      });
    } catch (_) {}

    // TUR #73 — DEFENSIVE: 6 audit check + runAllModules + runAllActiveTasks
    // birbirinden bagimsiz try-catch'lerde. Bir hata zinciri kirmaz.
    // Onceki bug: check'lerden biri throw = run() throw = lastRunAt update yok = 16 modul hic tick yapmaz.
    try {
      await this.runAuditChecks();
    } catch (auditErr) {
      await this.log("AUDIT_CHECK_FAILED", "ERROR", { message: auditErr.message?.slice(0, 500) }).catch(() => {});
    }

    try {
      await this.runAllModules();
    } catch (modErr) {
      await this.log("MODULE_ORCHESTRATOR_FAILED", "ERROR", { message: modErr.message?.slice(0, 500) }).catch(() => {});
    }

    try {
      await this.runAllActiveTasks();
    } catch (actErr) {
      await this.log("ACTIVE_TASK_ORCHESTRATOR_FAILED", "ERROR", { message: actErr.message?.slice(0, 500) }).catch(() => {});
    }
  }

  // TUR #73 — 6 audit check'i kendi metoduna alindi (defensive try-catch)
  async runAuditChecks() {
    const checks = [];

    // TUR #72.5 H4 — her finding detay payload (UI akis paneli render edebilsin)

    // 1. Aciliyet KRITIK olan + 7 günden eski
    const eskiKritik = await prisma.lead.count({
      where: { aciliyet: "KRITIK", updatedAt: { lt: new Date(Date.now() - 7 * 86_400_000) } },
    });
    if (eskiKritik > 0) {
      const items = await prisma.lead.findMany({
        where: { aciliyet: "KRITIK", updatedAt: { lt: new Date(Date.now() - 7 * 86_400_000) } },
        select: { id: true, leadCode: true, status: true, updatedAt: true },
        take: 5,
      });
      checks.push({
        check: "ESKI_KRITIK_LEAD",
        title: "Eski KRITIK Lead",
        count: eskiKritik,
        severity: "WARNING",
        items: items.map((l) => ({ id: l.id, leadCode: l.leadCode, status: l.status, updatedAt: l.updatedAt })),
      });
    }

    // 2. AI guven skoru < 0.7 ve onay BEKLIYOR
    const aiOnayBekleyen = await prisma.lead.count({
      where: { aiAnalizOnay: "BEKLIYOR", muhatapGuvenSkoru: { lt: 0.7 } },
    });
    if (aiOnayBekleyen > 0) {
      checks.push({
        check: "AI_ONAY_BEKLEYEN",
        title: "AI Onay Bekleyen (guven < 0.7)",
        count: aiOnayBekleyen,
        severity: "INFO",
        items: [],
      });
    }

    // 3. KVKK PENDING + 25 günden eski (30 gün cevap zorunlu)
    const kvkkRiski = await prisma.dataSubjectRequest.count({
      where: { status: "PENDING", receivedAt: { lt: new Date(Date.now() - 25 * 86_400_000) } },
    });
    if (kvkkRiski > 0) {
      checks.push({
        check: "KVKK_30GUN_RISK",
        title: "KVKK 30 gun risk (PENDING > 25g)",
        count: kvkkRiski,
        severity: "CRITICAL",
        items: [],
      });
    }

    // 4. CommissionLog BEKLIYOR + 14 günden eski
    const commBekleyen = await prisma.commissionLog.count({
      where: { durum: "BEKLIYOR", createdAt: { lt: new Date(Date.now() - 14 * 86_400_000) } },
    });
    if (commBekleyen > 0) {
      checks.push({
        check: "COMMISSION_GECIKME",
        title: "Komisyon BEKLIYOR > 14g",
        count: commBekleyen,
        severity: "WARNING",
        items: [],
      });
    }

    // 5. Atanmamis aktif lead
    const atanmamis = await prisma.lead.count({
      where: {
        status: { in: ["NEW", "CONTACTED", "DOCS_PENDING", "ANALYZED"] },
        assignments: { none: {} },
        createdAt: { lt: new Date(Date.now() - 3 * 86_400_000) },
      },
    });
    if (atanmamis > 0) {
      const items = await prisma.lead.findMany({
        where: {
          status: { in: ["NEW", "CONTACTED", "DOCS_PENDING", "ANALYZED"] },
          assignments: { none: {} },
          createdAt: { lt: new Date(Date.now() - 3 * 86_400_000) },
        },
        select: { id: true, leadCode: true, status: true, createdAt: true },
        take: 5,
      });
      checks.push({
        check: "ATANMAMIS_LEAD",
        title: "Atanmamis Aktif Lead (3g+)",
        count: atanmamis,
        severity: "WARNING",
        items: items.map((l) => ({ id: l.id, leadCode: l.leadCode, status: l.status, createdAt: l.createdAt })),
      });
    }

    // 6. Boş gercekTazminat ama WON status
    const wonAmaTazminatYok = await prisma.lead.count({
      where: { status: "WON", gercekTazminat: null },
    });
    if (wonAmaTazminatYok > 0) {
      checks.push({
        check: "WON_TAZMINAT_YOK",
        title: "WON ama Tazminat Yok",
        count: wonAmaTazminatYok,
        severity: "WARNING",
        items: [],
      });
    }

    // TUR #72.5 H4 — 0 finding ise WARNING degil INFO (yanlis uyari bug)
    if (checks.length === 0) {
      await this.log("AUDIT_OK", "INFO", {
        message: "Tum kontroller temiz",
        findings: [],
        summary: { total: 0, critical: 0, warning: 0, info: 0 },
      });
    } else {
      const maxSev = checks.some(c => c.severity === "CRITICAL") ? "CRITICAL"
        : checks.some(c => c.severity === "WARNING") ? "WARNING" : "INFO";
      const summary = {
        total: checks.length,
        critical: checks.filter((c) => c.severity === "CRITICAL").length,
        warning: checks.filter((c) => c.severity === "WARNING").length,
        info: checks.filter((c) => c.severity === "INFO").length,
      };
      const titles = checks.map((c) => `${c.title} (${c.count})`).join(" · ");
      await this.log("AUDIT_FINDINGS", maxSev, {
        findings: checks,
        summary,
        message: `Auditor · ${summary.total} bulgu — ${titles}`,
      });

      // ADMIN feed event
      try {
        await prisma.realtimeEvent.create({
          data: {
            channel: "ADMIN_FEED",
            eventType: "AUDITOR_FINDINGS",
            payload: { findings: checks, summary, severity: maxSev },
          },
        });
      } catch (e) {}
    }
    // TUR #73 — runAllModules + runAllActiveTasks artik run()'da bagimsiz try-catch'lerden cagriliyor.
    // Bu metot sadece audit checks ile sinirli (defensive isolation).
  }

  async runAllModules() {
    const tedbirgeOS = require("../os");
    const moduleNames = [
      "ai", "analyzer", "appearance", "backup", "compliance",
      "costGuard", "deploy", "insurance", "maintenance", "navigation",
      "notifications", "performance", "pulse", "recovery", "security", "uyapControl",
    ];

    const start = Date.now();
    const results = await Promise.allSettled(
      moduleNames.map((name) => {
        const mod = tedbirgeOS.modules?.[name];
        if (!mod || typeof mod.runStatusCheck !== "function") {
          return Promise.resolve({ skipped: true, name });
        }
        return mod.runStatusCheck().then(
          (r) => ({ ok: true, name, result: r }),
          (err) => ({ ok: false, name, error: err.message }),
        );
      }),
    );

    const summary = results.map((r) => r.value || r.reason);
    const written = summary.filter((s) => s.ok).length;
    const skipped = summary.filter((s) => s.skipped).length;
    const failed = summary.filter((s) => s.ok === false).length;

    await this.log("MODULE_ORCHESTRATOR", "INFO", {
      written,
      skipped,
      failed,
      durationMs: Date.now() - start,
      message: `Orchestrator · ${written}/${moduleNames.length} modül AgentEvent yazdı (${skipped} skip, ${failed} fail)`,
    });
  }

  // TUR #72 — runActiveTask orchestrator: her modülün shouldRunActiveTask() kontrolü
  async runAllActiveTasks() {
    const tedbirgeOS = require("../os");
    const moduleNames = [
      "ai", "analyzer", "appearance", "backup", "compliance",
      "costGuard", "deploy", "insurance", "maintenance", "navigation",
      "notifications", "performance", "pulse", "recovery", "security", "uyapControl",
    ];

    const start = Date.now();
    const results = await Promise.allSettled(
      moduleNames.map((name) => {
        const mod = tedbirgeOS.modules?.[name];
        if (!mod || typeof mod.runActiveTask !== "function") {
          return Promise.resolve({ skipped: true, name, reason: "no_runActiveTask" });
        }
        if (typeof mod.shouldRunActiveTask === "function" && !mod.shouldRunActiveTask()) {
          return Promise.resolve({ skipped: true, name, reason: "interval_not_reached" });
        }
        return mod.runActiveTask().then(
          (r) => ({ ok: true, name, result: r }),
          (err) => ({ ok: false, name, error: err.message }),
        );
      }),
    );

    const summary = results.map((r) => r.value || r.reason);
    const acted = summary.filter((s) => s.ok).length;
    const skipped = summary.filter((s) => s.skipped).length;
    const failed = summary.filter((s) => s.ok === false).length;

    await this.log("ACTIVE_TASK_ORCHESTRATOR", "INFO", {
      acted,
      skipped,
      failed,
      durationMs: Date.now() - start,
      message: `Aktif görev · ${acted}/${moduleNames.length} modül runActiveTask çalıştı (${skipped} skip, ${failed} fail)`,
    });
  }
}

module.exports = AuditorAgent;
