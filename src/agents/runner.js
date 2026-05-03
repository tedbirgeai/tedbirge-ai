// TUR #55 A24 — Otonom Agent Runner — server.js boot zamanı çağrılır
// TUR #71 A18+A23 — In-process scheduler: EmailDigest 09:00 TR + Pulse Pazar 23:59

const AuditorAgent = require("./auditor.agent");
const HealerAgent = require("./healer.agent");
const ReporterAgent = require("./reporter.agent");

let started = false;
const agents = [];
let schedulerTimer = null;
let lastDigestDate = null;
let lastPulseWeek = null;

function startScheduler() {
  if (schedulerTimer) return;
  // Her dakika kontrol — Türkiye saati (UTC+3) için 09:00 TR = 06:00 UTC
  schedulerTimer = setInterval(async () => {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcDay = now.getUTCDay(); // 0=Pazar, 6=Cumartesi
    const today = now.toISOString().split("T")[0];

    // EmailDigest: 06:00 UTC = 09:00 TR
    if (utcHour === 6 && lastDigestDate !== today) {
      try {
        const emailDigest = require("../services/emailDigest.service");
        const r = await emailDigest.sendDailyDigest();
        console.log(`[SCHEDULER] EmailDigest 09:00 TR · ${r.status}`);
        lastDigestDate = today;
      } catch (err) {
        console.error("[SCHEDULER] EmailDigest hata:", err.message);
      }
    }

    // Pulse haftalık snapshot: Pazar 20:59 UTC = Pazar 23:59 TR
    // (utcDay=0 Pazar, utcHour=20, utcMinute=59)
    if (utcDay === 0 && utcHour === 20 && now.getUTCMinutes() === 59) {
      const isoWeek = `${now.getUTCFullYear()}-W${String(Math.ceil(((now - new Date(now.getUTCFullYear(), 0, 1)) / 86400000 + 1) / 7)).padStart(2, "0")}`;
      if (lastPulseWeek !== isoWeek) {
        try {
          const pulse = require("../os/modules/pulse");
          if (typeof pulse.weeklyRunner === "function") {
            await pulse.weeklyRunner();
          }
          console.log(`[SCHEDULER] Pulse haftalık snapshot · ${isoWeek}`);
          lastPulseWeek = isoWeek;
        } catch (err) {
          console.error("[SCHEDULER] Pulse weekly hata:", err.message);
        }
      }
    }
  }, 60 * 1000);
  console.log("[SCHEDULER] in-process cron başladı (EmailDigest 09:00 TR + Pulse Pazar 23:59)");
}

function startAgents() {
  if (started) return;
  if (process.env.AGENTS_DISABLED === "true") {
    console.log("[AGENTS] AGENTS_DISABLED=true — agentlar başlatılmadı");
    return;
  }
  // Test modunda başlatma
  if (process.env.NODE_ENV === "test") return;

  agents.push(new AuditorAgent());
  agents.push(new HealerAgent());
  agents.push(new ReporterAgent());

  for (const a of agents) a.start();
  started = true;
  console.log(`[AGENTS] ${agents.length} agent baslatildi`);

  startScheduler();
}

function stopAgents() {
  for (const a of agents) a.stop();
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
  started = false;
}

// Manuel tick (admin endpoint icin)
async function manualTick(agentName) {
  const agent = agents.find(a => a.name === agentName);
  if (!agent) throw new Error(`Agent bulunamadi: ${agentName}`);
  await agent.tick();
  return { ok: true, lastRunAt: agent.lastRunAt };
}

function getStatus() {
  return agents.map(a => ({
    name: a.name,
    intervalMs: a.intervalMs,
    lastRunAt: a.lastRunAt,
    running: a.running,
  }));
}

module.exports = {
  startAgents,
  stopAgents,
  manualTick,
  getStatus,
};
