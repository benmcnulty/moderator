// Validate before the UI can describe an input as unflagged.
function validateModerationResult(data) {
  if (!data || typeof data.flagged !== "boolean" ||
      !data.categories || typeof data.categories !== "object" || Array.isArray(data.categories) ||
      !data.category_scores || typeof data.category_scores !== "object" || Array.isArray(data.category_scores)) {
    throw new Error("Invalid moderation response");
  }
  const categories = Object.keys(data.categories);
  const scores = Object.keys(data.category_scores);
  if (!categories.length || scores.length !== categories.length || categories.some((category) =>
    typeof data.categories[category] !== "boolean" ||
    !Object.prototype.hasOwnProperty.call(data.category_scores, category) ||
    typeof data.category_scores[category] !== "number" ||
    !Number.isFinite(data.category_scores[category]) ||
    data.category_scores[category] < 0 || data.category_scores[category] > 1
  )) {
    throw new Error("Invalid moderation categories or scores");
  }
  return data;
}
module.exports = { validateModerationResult };
