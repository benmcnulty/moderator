const request = require("supertest");
const { expect } = require("chai");
const { createApp } = require("../server");
const { providerFixture } = require("./fixtures/moderation");
const result = providerFixture().results[0];

describe("moderation API contract", () => {
  it("returns a validated result without a live provider call", async () => {
    const app = createApp({ moderate: async (text) => {
      expect(text).to.equal("Hello world");
      return result;
    } });
    const response = await request(app).post("/api/filter-content").send({ text: "Hello world" });
    expect(response.status).to.equal(200);
    expect(response.body).to.deep.equal(result);
  });
  for (const text of [undefined, "", "  ", null, 42, {}]) {
    it(`rejects invalid text (${JSON.stringify(text)}) before the provider call`, async () => {
      let called = false;
      const app = createApp({ moderate: async () => { called = true; return result; } });
      const response = await request(app).post("/api/filter-content").send({ text });
      expect(response.status).to.equal(400);
      expect(called).to.equal(false);
    });
  }
  it("returns unavailable when the provider fails", async () => {
    const app = createApp({ moderate: async () => { throw new Error("Provider failed"); } });
    const response = await request(app).post("/api/filter-content").send({ text: "Hello" });
    expect(response.status).to.equal(502);
    expect(response.body).to.have.property("error");
    expect(response.body).not.to.have.property("flagged");
  });
  it("rejects malformed provider JSON", async () => {
    const app = createApp({ moderate: async () => ({ error: "Failure" }) });
    const response = await request(app).post("/api/filter-content").send({ text: "Hello" });
    expect(response.status).to.equal(502);
  });
});
