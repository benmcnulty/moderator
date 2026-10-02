const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { validateModerationResult } = require("../src/moderation-result");

// Minimal DOM boundary: deterministic request/render checks, not browser layout QA.
function element() {
  return {
    children: [], value: "Hello", content: "", classList: { add() {} },
    set textContent(value) { this.content = value; this.children = []; },
    get textContent() { return this.content + this.children.map((node) => node.textContent).join(" "); },
    set innerHTML(value) { this.textContent = value; },
    appendChild(node) { this.children.push(node); },
    replaceChildren(...nodes) { this.content = ""; this.children = nodes; },
    addEventListener(type, handler) { this.handler = handler; },
  };
}
async function submit(fetchResponse) {
  const nodes = Object.fromEntries(["filterForm", "userText", "overallResultBody", "detailedResultBody"].map((id) => [id, element()]));
  nodes.overallResultBody.textContent = "Not flagged from a previous request";
  const source = fs.readFileSync(path.join(__dirname, "../src/index.js"), "utf8").replace(/^import .*;\r?\n/gm, "");
  vm.runInNewContext(source, {
    document: { getElementById: (id) => nodes[id], createElement: () => element() },
    window: { location: { protocol: "http:", hostname: "localhost" } },
    fetch: async () => typeof fetchResponse === "function" ? fetchResponse() : fetchResponse,
    validateModerationResult,
  });
  await nodes.filterForm.handler({ preventDefault() {} });
  return nodes;
}
describe("moderation request and rendered status", () => {
  for (const flagged of [true, false]) {
    it(`renders validated ${flagged ? "flagged" : "unflagged"} results`, async () => {
      const nodes = await submit({ ok: true, json: async () => ({
        flagged, categories: { violence: flagged }, category_scores: { violence: 0.25 },
      }) });
      assert.match(nodes.overallResultBody.textContent, flagged ? /Flagged/ : /Not flagged/);
      assert.match(nodes.detailedResultBody.textContent, /violence.*25\.0000%/);
      assert.equal(nodes.userText.value, "");
    });
  }
  for (const data of [
    { error: "Provider error" }, { flagged: false },
    { flagged: false, categories: {}, category_scores: {} },
    { flagged: false, categories: { violence: false }, category_scores: { violence: "0.5" } },
    { flagged: false, categories: { violence: false }, category_scores: { violence: NaN } },
    { flagged: false, categories: { violence: false }, category_scores: { violence: 2 } },
  ]) {
    it("renders unavailable for malformed success payloads", async () => {
      const nodes = await submit({ ok: true, json: async () => data });
      assert.match(nodes.overallResultBody.textContent, /Moderation unavailable/);
      assert.doesNotMatch(nodes.overallResultBody.textContent, /Not flagged|NaN/);
      assert.equal(nodes.detailedResultBody.textContent, "");
      assert.equal(nodes.userText.value, "Hello");
    });
  }
  for (const response of [
    { ok: false, json: async () => ({ error: "Unauthorized" }) },
    { ok: true, json: async () => { throw new SyntaxError("Invalid JSON"); } },
    () => { throw new Error("Network unavailable"); },
  ]) {
    it("never renders an HTTP, JSON, or network failure as a safety result", async () => {
      const nodes = await submit(response);
      assert.match(nodes.overallResultBody.textContent, /Moderation unavailable/);
      assert.doesNotMatch(nodes.overallResultBody.textContent, /Not flagged|NaN/);
    });
  }
});
