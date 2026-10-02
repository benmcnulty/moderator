// Text-only contract for the explicitly requested omni-moderation-latest model.
// Reference checked 2026-10-02: https://developers.openai.com/api/reference/resources/moderations
const CATEGORY_NAMES = [
  "harassment", "harassment/threatening", "hate", "hate/threatening",
  "illicit", "illicit/violent", "self-harm", "self-harm/instructions",
  "self-harm/intent", "sexual", "sexual/minors", "violence", "violence/graphic",
];
const NULLABLE_CATEGORIES = new Set(["illicit", "illicit/violent"]);

function validateModerationResult(data) {
  if (!data || typeof data.flagged !== "boolean" ||
      !data.categories || typeof data.categories !== "object" || Array.isArray(data.categories) ||
      !data.category_scores || typeof data.category_scores !== "object" || Array.isArray(data.category_scores)) {
    throw new Error("Invalid moderation response");
  }
  const categories = Object.keys(data.categories);
  const scores = Object.keys(data.category_scores);
  if (categories.length !== CATEGORY_NAMES.length || scores.length !== CATEGORY_NAMES.length ||
      CATEGORY_NAMES.some((category) =>
        !Object.prototype.hasOwnProperty.call(data.categories, category) ||
        !(typeof data.categories[category] === "boolean" ||
          (data.categories[category] === null && NULLABLE_CATEGORIES.has(category))) ||
        !Object.prototype.hasOwnProperty.call(data.category_scores, category) ||
        typeof data.category_scores[category] !== "number" ||
        !Number.isFinite(data.category_scores[category]) ||
        data.category_scores[category] < 0 || data.category_scores[category] > 1
      )) {
    throw new Error("Invalid moderation categories or scores");
  }
  if (data.flagged !== CATEGORY_NAMES.some((category) => data.categories[category] === true)) {
    throw new Error("Inconsistent aggregate moderation flag");
  }
  return data;
}

function extractModerationResult(response) {
  if (!response || typeof response.id !== "string" || !response.id ||
      typeof response.model !== "string" || !response.model ||
      !Array.isArray(response.results) || response.results.length !== 1) {
    throw new Error("Invalid single-text moderation envelope");
  }
  return validateModerationResult(response.results[0]);
}
module.exports = { CATEGORY_NAMES, validateModerationResult, extractModerationResult };
