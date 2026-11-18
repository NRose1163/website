import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const require = createRequire(import.meta.url);
const { Miniflare, convertV4MiniflareOptions } = createRequire(require.resolve("wrangler"))("miniflare");
const origin = "https://nrose1163.github.io";

async function harness(t, overrides = {}) {
  const sent = [];
  let providerStatus = 200;
  const mf = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: readFileSync(new URL("../src/worker.mjs", import.meta.url), "utf8"),
      compatibilityDate: "2026-11-18",
      bindings: {
        SITE_URL: `${origin}/website/`,
        GITHUB_TOKEN: "test-token-never-used-on-network",
        GITHUB_REPOSITORY: "NRose1163/website",
        GITHUB_WORKFLOW: "visitor-alert.yml",
        GITHUB_REF: "main",
        MAX_ALERTS_PER_DAY: "100",
        ...overrides,
      },
      durableObjects: { VISITS: { className: "VisitRegistry", useSQLite: true } },
      ratelimits: { VISIT_RATE_LIMITER: { namespace_id: "116311", simple: { limit: 1000, period: 60 } } },
      outboundService: async (request) => {
        assert.equal(request.url, "https://api.github.com/repos/NRose1163/website/actions/workflows/visitor-alert.yml/dispatches");
        assert.equal(request.headers.get("Authorization"), "Bearer test-token-never-used-on-network");
        assert.equal(request.headers.get("User-Agent"), "portfolio-visitor-alerts");
        sent.push(await request.json());
        return new Response("{}", { status: providerStatus });
      },
    })
  );
  t.after(() => mf.dispose());
  const visit = (visitorId = randomUUID(), headers = {}) =>
    mf.dispatchFetch("https://worker.test/visit", {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ visitorId }),
    });
  return {
    mf,
    sent,
    visit,
    setProviderStatus: (value) => {
      providerStatus = value;
    },
  };
}

test("real Durable Object sends once across concurrent requests and new browsers", async (t) => {
  const { visit, sent } = await harness(t);
  const id = randomUUID();
  const responses = await Promise.all(Array.from({ length: 8 }, () => visit(id)));
  assert.ok(responses.some((r) => r.status === 204));
  assert.ok(responses.every((r) => r.status === 204 || r.status === 503));
  assert.equal(sent.length, 1);
  assert.equal((await visit(id)).status, 204);
  assert.equal(sent.length, 1);
  assert.equal((await visit()).status, 204);
  assert.equal(sent.length, 2);
  assert.deepEqual(sent[0], { ref: "main" });
  assert.equal(JSON.stringify(sent).includes(id), false);
  assert.equal("email" in sent[0], false);
  assert.equal("click" in sent[0], false);
});

test("rejects unrelated origins, invalid input and oversized streams without publishing", async (t) => {
  const { mf, visit, sent } = await harness(t);
  assert.equal((await visit(randomUUID(), { Origin: "https://unrelated.example" })).status, 403);
  assert.equal((await visit("not-a-uuid")).status, 400);
  assert.equal((await visit([randomUUID()])).status, 400);
  assert.equal((await visit(randomUUID(), { "Content-Type": "text/plain" })).status, 415);
  assert.equal(
    (
      await mf.dispatchFetch("https://worker.test/visit", {
        method: "POST",
        headers: { Origin: origin, "Content-Type": "application/json" },
        body: "x".repeat(1000),
      })
    ).status,
    400
  );
  const preflight = await mf.dispatchFetch("https://worker.test/visit", { method: "OPTIONS", headers: { Origin: origin } });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("Access-Control-Allow-Origin"), origin);
  assert.equal(sent.length, 0);
});

test("retries a definite provider rejection using the same browser ID", async (t) => {
  const { visit, sent, setProviderStatus } = await harness(t);
  const id = randomUUID();
  setProviderStatus(429);
  assert.equal((await visit(id)).status, 503);
  setProviderStatus(200);
  assert.equal((await visit(id)).status, 204);
  assert.equal((await visit(id)).status, 204);
  assert.equal(sent.length, 2);
});

test("global daily cap bounds notifications even with fresh browser IDs", async (t) => {
  const { visit, sent } = await harness(t, { MAX_ALERTS_PER_DAY: "1" });
  const id = randomUUID();
  assert.equal((await visit(id)).status, 204);
  assert.equal((await visit(id)).status, 204);
  assert.equal((await visit()).status, 429);
  assert.equal(sent.length, 1);
});

test("fails closed until the GitHub token is configured", async (t) => {
  const { visit, sent } = await harness(t, { GITHUB_TOKEN: "" });
  assert.equal((await visit()).status, 503);
  assert.equal(sent.length, 0);
});
