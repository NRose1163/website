# Portfolio visitor alerts through GitHub email

When a browser first visits a portfolio page, the Cloudflare relay triggers the
**New portfolio visitor** GitHub Actions workflow. GitHub's existing workflow
notification emails deliver the alert. Your existing Mail or Gmail app can show
a phone notification for that email. No ntfy account, ntfy app, or other new
notification service is needed. The portfolio stays on GitHub Pages.

The feature is disabled until the relay URL is set and delivery is tested.

## Activate

1. Sign in to the existing GitHub account that owns `NRose1163/website` and the
   Cloudflare account. Use Cloudflare Workers Free.
2. In [GitHub notification settings](https://github.com/settings/notifications),
   enable **Email** under **System > Actions**, and turn off **Only notify for
   failed workflows**. Watch the website repository with Actions enabled. Confirm
   that GitHub's notification email address is the inbox you want to use.
   These account settings can also enable emails for other watched workflows.
3. Publish `.github/workflows/visitor-alert.yml` on `main`. Run it manually once
   from GitHub Actions and verify that the completion email arrives. A successful
   workflow dispatch alone does not prove email or phone delivery.
4. Create a fine-grained GitHub personal access token limited to the **website**
   repository, with **Actions: Read and write** (and automatic read-only Metadata).
   It does not need Contents, Issues, or Workflows write permission. Choose an
   expiration and replace the secret before it expires. This token permits
   managing repository Actions; GitHub cannot restrict it to one workflow.
   Never put the token in Git, site HTML, screenshots, or chat messages.
5. In `server/visitor-alerts`, install and deploy:

   ```sh
   pnpm install --frozen-lockfile
   pnpm exec wrangler login
   pnpm run deploy
   pnpm exec wrangler secret put GITHUB_TOKEN
   ```

   Paste the token only at the secret prompt or in the Cloudflare Worker secret
   field. The initial deployment rejects visits until the secret exists.

6. Update `_config.yml` with the actual Worker URL and publish the website:

   ```yaml
   visitor_alerts:
     enabled: true
     endpoint: "https://nathan-portfolio-visitor-alerts.YOUR-SUBDOMAIN.workers.dev/visit"
   ```

7. Exclude each of your regular browsers by opening
   `https://nrose1163.github.io/website/?visitor_alerts=off`. The preference persists
   until site data is cleared; `?visitor_alerts=on` removes it.
8. Visit from a fresh browser profile and check for one email. Refresh and open
   another page; neither should trigger another workflow. If you want a phone
   alert, enable notifications for GitHub messages in your existing email app.

## Behavior and limitations

- A random ID in local storage approximates a unique browser, not a person.
  Another device, browser, private session, or cleared/expired storage can count
  again. Direct PDF downloads do not run the script.
- Web Locks serialize first visits across tabs in supporting browsers. Older
  browsers use a best-effort fallback. The relay atomically deduplicates the same
  ID with a SQLite-backed Durable Object.
- The relay stores the ID, delivery state, day, and daily count. GitHub receives
  only a workflow dispatch for `main`, not the visitor ID, page, referrer, UTM
  parameters, or IP. Cloudflare processes requests and uses the IP transiently
  for rate limiting. Application request logging is disabled.
- Workflow run times and the generic visit message are visible to people who
  can view repository Actions. In a public repository, these are public.
- Requests are limited to 10/minute per IP per Cloudflare location and at most
  100 attempted workflow triggers per UTC day. CORS is not authentication against
  scripts that spoof the Origin header. Limits bound notification abuse.
- Definite API rejections can retry on a later page visit after 60 seconds. An
  ambiguous timeout or crash after reservation is not resent, to avoid duplicates;
  an alert can occasionally be missed. These are best-effort notifications.
- Alerts depend on GitHub Actions queuing and email delivery, so they are not
  instant. The server records a successful dispatch, not delivery to your inbox.
  Disabling the workflow, expiring the token, changing email settings, or filtering
  email can prevent an alert. This uses event-driven workflow dispatch, not a
  scheduled workflow that stops after repository inactivity.
- Disabled JavaScript, blocked storage, DNT/GPC privacy opt-outs, and detected
  browser automation skip alerts. Hidden tabs wait until visible. If the site's
  cookie-consent feature is enabled, alerts wait for analytics consent.

## Validation and disabling

Run `node --test test/visitor-alerts/*.test.cjs` from the repository root.
In `server/visitor-alerts`, run `pnpm test` and `pnpm run check`. The server tests
use Cloudflare's real local runtime with a mocked GitHub API; no actual workflows
or emails are triggered. Node.js and local loopback networking are required.

The Jekyll hook adds the script to HTML pages without overriding the theme.
The relay and new tests are excluded from the public site build. Use the real
`/website` baseurl when building. Set `visitor_alerts.enabled: false` and publish
to disable; existing tabs can still complete in-flight requests.

## References

- [GitHub Actions notifications](https://docs.github.com/en/subscriptions-and-notifications/how-tos/managing-github-actions-notifications)
- [Workflow dispatch API and token permissions](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event)
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Durable Objects pricing and free limits](https://developers.cloudflare.com/durable-objects/platform/pricing/)

Cloudflare has a Free plan. GitHub Actions usage depends on repository visibility
and runner choice; retain the standard Linux runner and check the account's
included usage before using a private repository or a paid runner.
