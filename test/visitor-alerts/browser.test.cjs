const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { runInNewContext } = require("node:vm");
const { randomUUID } = require("node:crypto");
const source = readFileSync(resolve(__dirname, "../../assets/js/visitor-alerts.js"), "utf8");
const prefix = "portfolio-visitor:/website:v1";
const flush = () => new Promise((done) => setImmediate(done));

async function browser(options = {}) {
  const data = options.data || new Map();
  const requests = [];
  const events = {};
  let lockQueue = Promise.resolve();
  const context = {
    URL,
    URLSearchParams,
    AbortSignal,
    Date,
    crypto: { randomUUID },
    location: new URL(options.url || "https://nrose1163.github.io/website/"),
    navigator: { locks: { request: (_, fn) => (lockQueue = lockQueue.then(fn)) }, ...options.navigator },
    document: {
      currentScript: {
        dataset: {
          endpoint: "https://relay.example/visit",
          siteUrl: "https://nrose1163.github.io/website/",
          consentRequired: "false",
          ...options.dataset,
        },
      },
      visibilityState: options.visibility || "visible",
      addEventListener: (event, fn) => {
        events[event] = fn;
      },
    },
    window: {
      addEventListener: (event, fn) => {
        events[event] = fn;
      },
    },
    localStorage: {
      getItem: (key) => {
        if (options.blockStorage) throw new Error("Blocked");
        return data.get(key) ?? null;
      },
      setItem: (key, value) => {
        if (options.blockStorage) throw new Error("Blocked");
        data.set(key, value);
      },
      removeItem: (key) => data.delete(key),
    },
    fetch: async (url, init) => {
      requests.push({ url, ...init });
      return { ok: options.ok !== false };
    },
  };
  runInNewContext(source, context);
  await flush();
  return { context, requests, data, events };
}

test("one alert on first visit; none on refresh or another page; fresh browser alerts", async () => {
  const first = await browser();
  assert.equal(first.requests.length, 1);
  assert.equal((await browser({ data: first.data })).requests.length, 0);
  assert.equal((await browser({ data: first.data, url: "https://nrose1163.github.io/website/projects/research/" })).requests.length, 0);
  assert.equal((await browser()).requests.length, 1);
  assert.deepEqual(Object.keys(JSON.parse(first.requests[0].body)), ["visitorId"]);
  assert.equal(first.requests[0].referrerPolicy, "no-referrer");
});

test("failure allows a later retry with the same identity and prevents retry storms", async () => {
  const first = await browser({ ok: false });
  assert.equal(first.data.has(`${prefix}:sent`), false);
  assert.equal((await browser({ data: first.data })).requests.length, 0);
  first.data.set(`${prefix}:retry`, "0");
  const retry = await browser({ data: first.data });
  assert.equal(retry.requests.length, 1);
  assert.equal(retry.requests[0].body, first.requests[0].body);
});

test("owner opt-out persists without making a request", async () => {
  const first = await browser({ url: "https://nrose1163.github.io/website/?visitor_alerts=off" });
  assert.equal(first.requests.length, 0);
  assert.equal((await browser({ data: first.data })).requests.length, 0);
  assert.equal((await browser({ data: first.data, url: "https://nrose1163.github.io/website/?visitor_alerts=on" })).requests.length, 1);
});

test("blocked storage, preview hosts, bots, privacy opt-outs and unrelated paths do not alert", async () => {
  for (const options of [
    { blockStorage: true },
    { url: "http://localhost:4000/website/" },
    { url: "https://nrose1163.github.io/another-site/" },
    { navigator: { webdriver: true } },
    { navigator: { globalPrivacyControl: true } },
    { navigator: { doNotTrack: "1" } },
  ])
    assert.equal((await browser(options)).requests.length, 0);
});

test("waits for the page to become visible", async () => {
  const b = await browser({ visibility: "hidden" });
  assert.equal(b.requests.length, 0);
  b.context.document.visibilityState = "visible";
  await b.events.visibilitychange();
  assert.equal(b.requests.length, 1);
});

test("respects the existing analytics consent flag", async () => {
  const b = await browser({ dataset: { consentRequired: "true" } });
  assert.equal(b.requests.length, 0);
  b.context.window.CookieConsent = { acceptedCategory: () => true };
  await b.events["cc:onConsent"]();
  assert.equal(b.requests.length, 1);
});

test("duplicate script execution shares a browser lock and sends only once", async () => {
  const b = await browser({ visibility: "hidden" });
  b.context.document.visibilityState = "visible";
  runInNewContext(source, b.context);
  runInNewContext(source, b.context);
  await flush();
  assert.equal(b.requests.length, 1);
});
