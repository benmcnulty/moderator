# Moderator

A small text-moderation demo with a Webpack frontend and an Express API. It demonstrates server-side provider credentials, response validation, and explicit failure states. This is an educational application with a legacy dependency set, not a production moderation service.

The browser submits text to `POST /api/filter-content` on the local API. The server calls OpenAI's moderation endpoint and returns a validated result containing `flagged`, `categories`, and `category_scores`. The interface shows **Flagged** or **Not flagged** only for valid responses. HTTP errors, invalid JSON, missing fields, and network failures show **Moderation unavailable** and retain the text for retry.

The server explicitly requests `omni-moderation-latest` for a single text input. Its consumed contract requires all 13 documented category flags and numeric scores, with `null` accepted only for `illicit` and `illicit/violent`. Null means **Not assessed**; the UI marks partial coverage and excludes those categories from its displayed score mean. Aggregate flags must agree with assessed categories. This contract was checked against the [official moderation reference](https://developers.openai.com/api/reference/resources/moderations) on 2026-10-02. Tests use complete synthetic fixtures, not live provider responses.

Only the latest submitted request may update results. Older successes and failures are ignored, and a successful request does not clear text edited while it was pending.

## Run locally

Prerequisites: Node.js and npm. The repair was checked on Node 24.21.0 on Windows 11. A provider API key is needed only for live requests; deterministic tests use injected responses and do not contact OpenAI.

```sh
git clone https://github.com/benmcnulty/moderator.git
cd moderator
npm ci --ignore-scripts
npm run build
npm start
```

Open `http://localhost:3000/`. The server binds to loopback. `--ignore-scripts` avoids the historical browser-driver installers; the current deterministic test suite does not need those drivers.

For a live local request, create an ignored `.env` file:

```dotenv
OPENAI_API_KEY=<your-server-side-key>
```

Keep this value on the server. Do not place it in browser code, a Webpack definition, or a public file. `LOCALHOST_KEY` and `LOCALHOST_CERT` can point to local TLS files; when both are configured, use HTTPS on port 3000. Without them, the API and development server use HTTP.

For frontend development, `npm run dev` runs the API on port 3000 and Webpack on port 3100. Open the development page on port 3100 using the same HTTP/HTTPS protocol as the API. `npm run watch` alone starts only the frontend; it still needs the API running separately.

## Inspect and verify

| File | Responsibility |
| --- | --- |
| `server.js` | Express app factory, input validation, server-side provider call, startup |
| `src/moderation-result.js` | Shared response-shape and numeric-score validation |
| `src/index.js` | Form submission, category rendering, unavailable state |
| `src/assets/templates/index.html` | Form and live result table |
| `test/server.test.js` | Injected provider contract tests; importing the server does not open a listening port |
| `test/frontend.test.js` | Deterministic HTTP/JSON/network failure and rendering regressions using a minimal DOM boundary |

```sh
npm test
npm run build
```

These tests cover logic and request contracts. They do not establish browser layout, accessibility conformance, or live-provider availability. Build output is written to `dist/`; building does not publish it.

## Limits and contributions

- **Not flagged is not a safety guarantee.** Category scores and their displayed mean are model outputs, not a calibrated probability that content is safe. A product needs its own review policy and evaluation data.
- Text submitted in a live session is sent to the external provider. The demo has no authentication, abuse controls, quotas, persistent audit trail, or deployment hardening. Keep it local.
- The dependency and browser tooling originated in 2023. No broad dependency upgrade is included in this repair.
- No current hosted demo is claimed. Historical `deploy` scripts are not part of local validation.

Contributions should use a focused branch, add deterministic regression coverage for behavior changes, and run the tests and build. Preserve the response fields and display an explicit unavailable state for every failure.

## License

[MIT](LICENSE). This is a separate moderation demo; it is not the Promptfolio catalog application.
