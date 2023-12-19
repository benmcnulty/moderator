const request = require("supertest");
const expect = require("chai").expect;
const app = require("../server");

describe("API Endpoint Testing", function () {
  it("should return valid moderation results for valid text", function (done) {
    request(app)
      .post("/api/filter-content")
      .send({ text: "Hello world" })
      .end(function (err, res) {
        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property("flagged");
        expect(res.body).to.have.property("violenceScore");
        done();
      });
  });

  it("should return an error for empty input", function (done) {
    request(app)
      .post("/api/filter-content")
      .send({ text: "" })
      .end(function (err, res) {
        expect(res.statusCode).to.equal(400);
        done();
      });
  });
});
