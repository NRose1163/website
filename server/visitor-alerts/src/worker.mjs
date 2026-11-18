import { DurableObject } from "cloudflare:workers";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BODY_BYTES = 256;

function reply(status, origin) {
  const headers = { "Cache-Control": "no-store", Vary: "Origin" };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers["Access-Control-Max-Age"] = "86400";
  }
  if (status === 429 || status === 503) headers["Retry-After"] = "60";
  return new Response(null, { status, headers });
}

async function readSmallJson(request) {
  if (Number(request.headers.get("Content-Length")) > MAX_BODY_BYTES) throw new Error("Too large");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("No body");
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) throw new Error("Too large");
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export default {
  async fetch(request, env) {
    const site = new URL(env.SITE_URL);
    const origin = request.headers.get("Origin");
    if (new URL(request.url).pathname !== "/visit") return reply(404);
    if (origin !== site.origin) return reply(403);
    if (request.method === "OPTIONS") return reply(204, origin);
    if (request.method !== "POST") return reply(405, origin);
    if (!request.headers.get("Content-Type")?.startsWith("application/json")) return reply(415, origin);
    if (!env.GITHUB_TOKEN || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(env.GITHUB_REPOSITORY || "")) return reply(503, origin);

    // CORS limits browser callers, not scripts that spoof Origin. Bound abuse too.
    const { success } = await env.VISIT_RATE_LIMITER.limit({ key: request.headers.get("CF-Connecting-IP") || "unknown" });
    if (!success) return reply(429, origin);

    let body;
    try {
      body = await readSmallJson(request);
    } catch {
      return reply(400, origin);
    }
    if (!body || typeof body.visitorId !== "string" || !UUID.test(body.visitorId) || Object.keys(body).some((key) => key !== "visitorId")) {
      return reply(400, origin);
    }

    try {
      const registry = env.VISITS.get(env.VISITS.idFromName("portfolio"));
      const result = await registry.fetch("https://registry/visit", {
        method: "POST",
        body: JSON.stringify({ visitorId: body.visitorId.toLowerCase() }),
      });
      return reply(result.status, origin);
    } catch {
      return reply(503, origin);
    }
  },
};

export class VisitRegistry extends DurableObject {
  async fetch(request) {
    const { visitorId } = await request.json();
    const key = `visitor:${visitorId}`;
    const day = new Date().toISOString().slice(0, 10);
    const max = Math.min(100, Math.max(1, Number(this.env.MAX_ALERTS_PER_DAY) || 100));

    // Reserve before triggering GitHub. Transactions prevent simultaneous tabs from
    // producing two notifications, including when an object restarts.
    const decision = await this.ctx.storage.transaction(async (txn) => {
      const existing = await txn.get(key);
      if (existing) {
        if (existing.state === "reserved" && Date.now() - existing.createdAt < 15000) return "pending";
        return "duplicate";
      }
      const previous = await txn.get("daily");
      const count = previous?.day === day ? previous.count : 0;
      if (count >= max) return "limited";
      await txn.put({ [key]: { state: "reserved", createdAt: Date.now(), day }, daily: { day, count: count + 1 } });
      return "send";
    });
    if (decision === "duplicate") return new Response(null, { status: 204 });
    if (decision === "pending") return new Response(null, { status: 503 });
    if (decision === "limited") return new Response(null, { status: 429 });

    let response;
    try {
      const [owner, repo] = this.env.GITHUB_REPOSITORY.split("/");
      const workflow = encodeURIComponent(this.env.GITHUB_WORKFLOW || "visitor-alert.yml");
      response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow}/dispatches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${this.env.GITHUB_TOKEN}`,
          "User-Agent": "portfolio-visitor-alerts",
        },
        body: JSON.stringify({
          ref: this.env.GITHUB_REF || "main",
        }),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      // The provider might have accepted a timed-out request. Keep the reservation
      // instead of sending twice. Best-effort alerts can occasionally be missed.
      await this.ctx.storage.put(key, { state: "uncertain", day });
      return new Response(null, { status: 202 });
    }
    if (!response.ok) {
      // A definite rejection is safe to retry on the browser's next visit.
      await this.ctx.storage.delete(key);
      return new Response(null, { status: 503 });
    }
    await this.ctx.storage.put(key, { state: "sent", day });
    return new Response(null, { status: 204 });
  }
}
