/* One alert per browser profile. Configuration comes from the Jekyll hook. */
(() => {
  "use strict";
  const script = document.currentScript;
  if (!script) return;
  const report = (status) => {
    script.dataset.alertStatus = status;
  };
  report("loaded");
  const { endpoint, siteUrl, consentRequired } = script.dataset;
  let site;
  try {
    site = new URL(siteUrl);
    if (new URL(endpoint).protocol !== "https:") return report("invalid-endpoint");
  } catch {
    return report("invalid-configuration");
  }
  const base = site.pathname.replace(/\/$/, "");
  if (location.origin !== site.origin || (location.pathname !== base && !location.pathname.startsWith(`${base}/`))) return report("outside-site");
  if (navigator.webdriver) return report("automated-browser");
  if (navigator.globalPrivacyControl || navigator.doNotTrack === "1") return report("privacy-opt-out");

  const prefix = `portfolio-visitor:${base}:v1`;
  let running = false;
  const hasConsent = () => consentRequired !== "true" || window.CookieConsent?.acceptedCategory?.("analytics") === true;

  async function notify() {
    if (!hasConsent()) return report("waiting-for-consent");
    // If persistent storage is blocked, skip the alert rather than notify on
    // every page load. Never send browser details, URLs, or a referrer to GitHub.
    try {
      if (localStorage.getItem(`${prefix}:owner`) === "1") return report("owner-excluded");
      if (localStorage.getItem(`${prefix}:sent`) === "1") return report("already-notified");
      let visitorId = localStorage.getItem(`${prefix}:id`);
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitorId || "")) {
        visitorId = crypto.randomUUID();
        localStorage.setItem(`${prefix}:id`, visitorId);
      }
      const retryAt = Number(localStorage.getItem(`${prefix}:retry`) || 0);
      if (retryAt > Date.now()) return report("retry-cooldown");
      localStorage.setItem(`${prefix}:retry`, String(Date.now() + 60000));
      report("sending");
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId }),
        credentials: "omit",
        referrerPolicy: "no-referrer",
        keepalive: true,
        signal: AbortSignal.timeout(12000),
      });
      if (response.ok) {
        localStorage.setItem(`${prefix}:sent`, "1");
        localStorage.removeItem(`${prefix}:retry`);
        report("accepted");
      } else {
        report(`relay-http-${response.status}`);
      }
    } catch {
      // Notification failures must never interfere with the portfolio.
      report("storage-or-network-error");
    }
  }

  async function start() {
    if (running) return;
    if (document.visibilityState !== "visible") return report("waiting-for-visible-page");
    if (!hasConsent()) return report("waiting-for-consent");
    running = true;
    report("waiting-for-browser-lock");
    try {
      if (navigator.locks) await navigator.locks.request(prefix, notify);
      else await notify();
    } catch {
      // A browser can deny lock or storage access.
      report("browser-lock-error");
    } finally {
      running = false;
    }
  }

  // Owner exclusion is local to this browser and works before any request.
  try {
    const owner = new URLSearchParams(location.search).get("visitor_alerts");
    if (owner === "off") localStorage.setItem(`${prefix}:owner`, "1");
    if (owner === "on") localStorage.removeItem(`${prefix}:owner`);
  } catch {
    return report("storage-unavailable");
  }
  document.addEventListener("visibilitychange", start);
  window.addEventListener("cc:onConsent", start);
  window.addEventListener("cc:onChange", start);
  start();
})();
