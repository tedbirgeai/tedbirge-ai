// TUR #55 A24 — Auditor: sistem sağlığı periyodik denetim (her 5 dk)

const BaseAgent = require("./base.agent");
const prisma = require("../config/db");

class AuditorAgent extends BaseAgent {
  constructor() {
    super("Auditor", { intervalMs: 5 * 60_000 });
  }

  async run() {
    const checks = [];

    // 1. Aciliyet KRITIK olan + 7 günden eski
    const eskiKritik = await prisma.lead.count({
      where: { aciliyet: "KRITIK", updatedAt: { lt: new Date(Date.now() - 7 * 86_400_000) } },
    });
    if (eskiKritik > 0) {
      checks.push({ key: "ESKI_KRITIK_LEAD", count: eskiKritik, severity: "WARNING" });
    }

    // 2. AI guven skoru < 0.7 ve onay BEKLIYOR
    const aiOnayBekleyen = await prisma.lead.count({
      where: { aiAnalizOnay: "BEKLIYOR", muhatapGuvenSkoru: { lt: 0.7 } },
    });
    if (aiOnayBekleyen > 0) {
      checks.push({ key: "AI_ONAY_BEKLEYEN", count: aiOnayBekleyen, severity: "INFO" });
    }

    // 3. KVKK PENDING + 25 günden eski (30 gün cevap zorunlu)
    const kvkkRiski = await prisma.dataSubjectRequest.count({
      where: { status: "PENDING", receivedAt: { lt: new Date(Date.now() - 25 * 86_400_000) } },
    });
    if (kvkkRiski > 0) {
      checks.push({ key: "KVKK_30GUN_RISK", count: kvkkRiski, severity: "CRITICAL" });
    }

    // 4. CommissionLog BEKLIYOR + 14 günden eski
    const commBekleyen = await prisma.commissionLog.count({
      where: { durum: "BEKLIYOR", createdAt: { lt: new Date(Date.now() - 14 * 86_400_000) } },
    });
    if (commBekleyen > 0) {
      checks.push({ key: "COMMISSION_GECIKME", count: commBekleyen, severity: "WARNING" });
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
      checks.push({ key: "ATANMAMIS_LEAD", count: atanmamis, severity: "WARNING" });
    }

    // 6. Boş gercekTazminat ama WON status
    const wonAmaTazminatYok = await prisma.lead.count({
      where: { status: "WON", gercekTazminat: null },
    });
    if (wonAmaTazminatYok > 0) {
      checks.push({ key: "WON_TAZMINAT_YOK", count: wonAmaTazminatYok, severity: "WARNING" });
    }

    if (checks.length === 0) {
      await this.log("AUDIT_OK", "INFO", { message: "Tum kontroller temiz" });
    } else {
      const maxSev = checks.some(c => c.severity === "CRITICAL") ? "CRITICAL"
        : checks.some(c => c.severity === "WARNING") ? "WARNING" : "INFO";
      await this.log("AUDIT_FINDINGS", maxSev, { findings: checks });

      // ADMIN feed event
      try {
        await prisma.realtimeEvent.create({
          data: {
            channel: "ADMIN_FEED",
            eventType: "AUDITOR_FINDINGS",
            payload: { findings: checks, severity: maxSev },
          },
        });
      } catch (e) {}
    }

    // TUR #69.5 B2 — 16 Modül Orchestrator (her tick'te 16 modülün runStatusCheck'i)
    // Auditor kendi 6 check'ini KORUR — bu EK katman.
    await this.runAllModules();

    // TUR #72 — 16 Modül runActiveTask (gerçek görev katmanı)
    // shouldRunActiveTask() kontrolü modül-spesifik periyot için.
    await this.runAllActiveTasks();
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
