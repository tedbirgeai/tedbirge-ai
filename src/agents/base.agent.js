// TUR #55 A24 — BaseAgent: tum otonom ajanlarin ortak yapisi

const prisma = require("../config/db");

class BaseAgent {
  constructor(name, options = {}) {
    this.name = name;
    this.intervalMs = options.intervalMs || 60_000; // default 1 dk
    this.lastRunAt = null;
    this.running = false;
    this._timer = null;
  }

  /** Ajan turu (override) */
  async run() {
    throw new Error("run() override edilmeli");
  }

  /** AgentEvent yazici */
  async log(eventType, severity = "INFO", payload = {}) {
    try {
      await prisma.agentEvent.create({
        data: {
          agentName: this.name,
          eventType,
          severity,
          payload,
        },
      });
    } catch (e) {
      console.warn(`[${this.name}] log fail:`, e.message);
    }
  }

  async tick() {
    if (this.running) return;
    this.running = true;
    const startedAt = Date.now();
    try {
      await this.run();
      this.lastRunAt = new Date();
    } catch (err) {
      await this.log("AGENT_ERROR", "ERROR", { message: err.message, stack: err.stack?.slice(0, 1000) });
    } finally {
      this.running = false;
      const elapsed = Date.now() - startedAt;
      if (elapsed > 30_000) {
        await this.log("SLOW_TICK", "WARNING", { elapsedMs: elapsed });
      }
    }
  }

  start() {
    if (this._timer) return;
    // İlk tick 5 sn sonra (server warmup)
    setTimeout(() => this.tick(), 5_000);
    this._timer = setInterval(() => this.tick(), this.intervalMs);
    console.log(`[AGENT] ${this.name} started (every ${this.intervalMs}ms)`);
  }

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }
}

module.exports = BaseAgent;
