const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { validateModerationResult } = require("../src/moderation-result");
const { providerFixture } = require("./fixtures/moderation");

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
function createHarness(fetchResponse) {
  const nodes = Object.fromEntries(["filterForm", "userText", "overallResultBody", "detailedResultBody"].map((id) => [id, element()]));
  nodes.overallResultBody.textContent = "Not flagged from a previous request";
  const source = fs.readFileSync(path.join(__dirname, "../src/index.js"), "utf8").replace(/^import .*;\r?\n/gm, "");
  vm.runInNewContext(source, {
    document: { getElementById: (id) => nodes[id], createElement: () => element() },
    window: { location: { protocol: "http:", hostname: "localhost" } },
    fetch: async () => typeof fetchResponse === "function" ? fetchResponse() : fetchResponse,
    validateModerationResult,
  });
  return nodes;
}
async function submit(fetchResponse) {
  const nodes = createHarness(fetchResponse);
  await nodes.filterForm.handler({ preventDefault() {} });
  return nodes;
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
}
const validResponse = { ok: true, json: async () => providerFixture().results[0] };
const submitEvent = { preventDefault() {} };
describe("moderation request and rendered status", () => {
  it("does not let an older success overwrite a newer failure or clear its input", async () => {
    const older = deferred();
    let calls = 0;
    const nodes = createHarness(() => ++calls === 1 ? older.promise : { ok: false });
    nodes.userText.value = "Request A";
    const requestA = nodes.filterForm.handler(submitEvent);
    nodes.userText.value = "Request B";
    await nodes.filterForm.handler(submitEvent);
    older.resolve(validResponse);
    await requestA;
    assert.match(nodes.overallResultBody.textContent, /Moderation unavailable/);
    assert.doesNotMatch(nodes.overallResultBody.textContent, /Not flagged/);
    assert.equal(nodes.userText.value, "Request B");
  });
  it("does not let an older failure overwrite a newer success", async () => {
    const older = deferred();
    let calls = 0;
    const nodes = createHarness(() => ++calls === 1 ? older.promise : validResponse);
    nodes.userText.value = "Request A";
    const requestA = nodes.filterForm.handler(submitEvent);
    nodes.userText.value = "Request B";
    await nodes.filterForm.handler(submitEvent);
    nodes.userText.value = "Unsent request C";
    older.reject(new Error("Old request failed"));
    await requestA;
    assert.match(nodes.overallResultBody.textContent, /Not flagged/);
    assert.doesNotMatch(nodes.overallResultBody.textContent, /Moderation unavailable/);
    assert.equal(nodes.userText.value, "Unsent request C");
  });
  it("preserves edits made while the current request is pending", async () => {
    const response = deferred();
    const nodes = createHarness(() => response.promise);
    const request = nodes.filterForm.handler(submitEvent);
    nodes.userText.value = "Unsent edits";
    response.resolve(validResponse);
    await request;
    assert.equal(nodes.userText.value, "Unsent edits");
    assert.match(nodes.overallResultBody.textContent, /Not flagged/);
  });

  for (const flagged of [true, false]) {
    it(`renders validated ${flagged ? "flagged" : "unflagged"} results`, async () => {
      const nodes = await submit({ ok: true, json: async () => providerFixture({ flagged }).results[0] });
      assert.match(nodes.overallResultBody.textContent, flagged ? /Flagged/ : /Not flagged/);
      assert.match(nodes.detailedResultBody.textContent, /violence.*25\.0000%/);
      assert.equal(nodes.userText.value, "");
    });
  }
  it("shows nullable categories as not assessed and marks partial coverage", async () => {
    const nodes = await submit({ ok: true, json: async () => providerFixture({ nullable: true }).results[0] });
    assert.match(nodes.overallResultBody.textContent, /Not flagged \(partial coverage\)/);
    assert.match(nodes.detailedResultBody.textContent, /Not assessed illicit Not assessed/);
    assert.match(nodes.detailedResultBody.textContent, /Not assessed illicit\/violent Not assessed/);
  });
  it("does not display inconsistent flags as an unflagged result", async () => {
    const result = providerFixture({ flagged: true }).results[0];
    result.flagged = false;
    const nodes = await submit({ ok: true, json: async () => result });
    assert.match(nodes.overallResultBody.textContent, /Moderation unavailable/);
  });
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
