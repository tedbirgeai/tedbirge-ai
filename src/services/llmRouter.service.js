// TUR #71 A19 — CEO Konsol LLM Router
// Anthropic Tool Use + SELECT-only Prisma güvenlik + KVKK alan maskele
// Madde 30.15 — LLM Router Güvenlik Disiplini

const Anthropic = require("@anthropic-ai/sdk");
const prisma = require("../config/db");

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1024;

const SYSTEM_PROMPT = `Sen Tedbirge OS asistanısın. CEO sorularına Prisma DB'den SELECT yazıp doğal dil cevap üretirsin.

KESİN KURALLAR:
1) SADECE SELECT veya WITH ile başlayan sorgular
2) INSERT/UPDATE/DELETE/DROP/ALTER/TRUNCATE/CREATE/GRANT/REVOKE YASAK
3) KVKK riskli alanlar (TC kimlik, telefon, e-posta) maskelenir: SUBSTRING(...)
4) LIMIT 100 zorunlu (büyük sonuç istemiyoruz)

Mevcut tablolar:
- Lead (id, customerName, status, accidentType, createdAt, gercekTazminat, qualificationScore)
- User (id, fullName, role, isActive, twoFactorEnabled, createdAt)
- Document (id, leadId, status, aiAnalysis, createdAt, updatedAt)
- AgentEvent (id, agentName, eventType, severity, payload, createdAt)
- Pulse (id, weekStart, metrics, trendType, createdAt)
- DataSubjectRequest (id, status, requestType, receivedAt)
- CommissionLog (id, leadId, tahsilatBrut, durum, createdAt)
- Assignment (leadId, lawyerId, status, createdAt)

Yanıt formatı: önce SQL açıkla, sonra tool kullan, son cevap doğal dil + ana metric.`;

const TOOLS = [
  {
    name: "prismaSelect",
    description: "Prisma DB üzerinde SELECT sorgusu çalıştır. Sadece read-only.",
    input_schema: {
      type: "object",
      properties: {
        sql: {
          type: "string",
          description: "SELECT veya WITH ile başlayan PostgreSQL sorgusu. LIMIT 100 zorunlu.",
        },
      },
      required: ["sql"],
    },
  },
];

// SQL güvenlik regex check — Madde 30.15
function validateSql(sql) {
  if (!sql || typeof sql !== "string") return { ok: false, reason: "empty" };
  const trimmed = sql.trim();
  if (!/^(SELECT|WITH)\s/i.test(trimmed)) {
    return { ok: false, reason: "SELECT/WITH ile başlamalı" };
  }
  if (/\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE)\b/i.test(trimmed)) {
    return { ok: false, reason: "DML/DDL yasak (sadece SELECT)" };
  }
  if (/;\s*\S/.test(trimmed)) {
    return { ok: false, reason: "multi-statement yasak" };
  }
  return { ok: true };
}

async function executeSql(sql) {
  const guard = validateSql(sql);
  if (!guard.ok) {
    throw new Error(`SQL güvenlik ihlali: ${guard.reason}`);
  }
  try {
    const rows = await prisma.$queryRawUnsafe(sql);
    return rows;
  } catch (err) {
    throw new Error(`SQL çalıştırma hatası: ${err.message}`);
  }
}

async function routeCommand(userQuery) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      answer: "ANTHROPIC_API_KEY yapılandırılmamış. CEO Konsol şu an pasif.",
      data: null,
      sql: null,
      tokenUsage: { input: 0, output: 0 },
    };
  }

  const client = new Anthropic.default({ apiKey });

  const messages = [{ role: "user", content: userQuery }];

  const first = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    tools: TOOLS,
    messages,
  });

  let totalInputTokens = first.usage?.input_tokens || 0;
  let totalOutputTokens = first.usage?.output_tokens || 0;

  // Tool kullanımı varsa
  const toolUse = first.content.find((c) => c.type === "tool_use");
  if (toolUse && toolUse.name === "prismaSelect") {
    const sql = toolUse.input?.sql;
    let toolResult;
    let resultData = null;
    let resultSql = sql;
    try {
      const rows = await executeSql(sql);
      resultData = rows;
      toolResult = JSON.stringify(rows.slice(0, 50)); // ilk 50 satır LLM'e
    } catch (err) {
      toolResult = `HATA: ${err.message}`;
    }

    // 2. çağrı: tool_result ile doğal dil cevap üret
    const second = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages: [
        ...messages,
        { role: "assistant", content: first.content },
        {
          role: "user",
          content: [
            { type: "tool_result", tool_use_id: toolUse.id, content: toolResult },
          ],
        },
      ],
    });

    totalInputTokens += second.usage?.input_tokens || 0;
    totalOutputTokens += second.usage?.output_tokens || 0;

    const textBlock = second.content.find((c) => c.type === "text");
    return {
      answer: textBlock?.text || "Cevap üretilemedi.",
      data: resultData,
      sql: resultSql,
      tokenUsage: { input: totalInputTokens, output: totalOutputTokens },
    };
  }

  // Tool kullanmadıysa direkt text cevap
  const textBlock = first.content.find((c) => c.type === "text");
  return {
    answer: textBlock?.text || "Cevap üretilemedi.",
    data: null,
    sql: null,
    tokenUsage: { input: totalInputTokens, output: totalOutputTokens },
  };
}

module.exports = { routeCommand, validateSql, executeSql };
