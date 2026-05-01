// TUR #55 A24 — Otonom Agent Runner — server.js boot zamanı çağrılır

const AuditorAgent = require("./auditor.agent");
const HealerAgent = require("./healer.agent");
const ReporterAgent = require("./reporter.agent");

let started = false;
const agents = [];

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
}

function stopAgents() {
  for (const a of agents) a.stop();
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
