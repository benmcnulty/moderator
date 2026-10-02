const assert = require("node:assert/strict");
const { validateModerationResult, extractModerationResult } = require("../src/moderation-result");
const { providerFixture } = require("./fixtures/moderation");
describe("complete provider response contract", () => {
  for (const options of [{}, { flagged: true }, { nullable: true }]) {
    it(`accepts a complete synthetic provider response ${JSON.stringify(options)}`, () => {
      const fixture = providerFixture(options);
      assert.equal(extractModerationResult(fixture), fixture.results[0]);
    });
  }
  for (const flagged of [true, false]) {
    it("rejects aggregate flags contradicting assessed categories", () => {
      const result = providerFixture({ flagged }).results[0];
      result.flagged = !flagged;
      assert.throws(() => validateModerationResult(result), /Inconsistent/);
    });
  }
  it("rejects a missing category instead of silently narrowing coverage", () => {
    const result = providerFixture().results[0];
    delete result.categories.violence;
    assert.throws(() => validateModerationResult(result));
  });
  it("rejects null outside the schema's nullable categories", () => {
    const result = providerFixture().results[0];
    result.categories.violence = null;
    assert.throws(() => validateModerationResult(result));
  });
  it("rejects a malformed provider envelope", () => {
    assert.throws(() => extractModerationResult({ results: [] }));
  });
});
