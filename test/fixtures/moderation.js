// Synthetic fixtures matching the official text result schema; no real API data.
// Keep this list independent of the validator so a missing contract field fails tests.
const FIXTURE_CATEGORIES = [
  "harassment", "harassment/threatening", "hate", "hate/threatening",
  "illicit", "illicit/violent", "self-harm", "self-harm/instructions",
  "self-harm/intent", "sexual", "sexual/minors", "violence", "violence/graphic",
];
function providerFixture({ flagged = false, nullable = false } = {}) {
  const categories = Object.fromEntries(FIXTURE_CATEGORIES.map((name) => [name, false]));
  const category_scores = Object.fromEntries(FIXTURE_CATEGORIES.map((name) => [name, 0.01]));
  const category_applied_input_types = Object.fromEntries(FIXTURE_CATEGORIES.map((name) => [name, ["text"]]));
  categories.violence = flagged;
  category_scores.violence = 0.25;
  if (nullable) {
    for (const name of ["illicit", "illicit/violent"]) {
      categories[name] = null;
      category_scores[name] = 0;
      category_applied_input_types[name] = [];
    }
  }
  return {
    id: "fixture-not-a-real-provider-request",
    model: "omni-moderation-2024-09-26",
    results: [{ flagged, categories, category_scores, category_applied_input_types }],
  };
}
module.exports = { providerFixture };
