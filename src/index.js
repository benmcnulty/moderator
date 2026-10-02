import "./assets/styles/main.css";
import { validateModerationResult } from "./moderation-result";

const form = document.getElementById("filterForm");
const userTextArea = document.getElementById("userText");
const overallResultBody = document.getElementById("overallResultBody");
const detailedResultBody = document.getElementById("detailedResultBody");
let requestGeneration = 0;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = userTextArea.value;
  const generation = ++requestGeneration;
  overallResultBody.textContent = "";
  detailedResultBody.textContent = "";

  try {
    const baseURL = `${window.location.protocol}//${window.location.hostname}:3000`;
    const response = await fetch(`${baseURL}/api/filter-content`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error("Moderation service unavailable");
    }
    const data = validateModerationResult(await response.json());
    if (generation !== requestGeneration) return;

    // Calculate the average score across all categories
    let totalScore = 0;
    let numberOfCategories = 0;
    for (const category in data.category_scores) {
      if (data.categories[category] === null) continue;
      totalScore += data.category_scores[category];
      numberOfCategories += 1;
    }
    const averageScore = totalScore / numberOfCategories;

    // Clear previous results
    overallResultBody.innerHTML = "";
    detailedResultBody.innerHTML = "";

    // Display overall results
    const overallRow = document.createElement("tr");
    const overallStatus = document.createElement("td");
    const overallFlagged = document.createElement("td");
    const overallScore = document.createElement("td");

    const partialCoverage = Object.values(data.categories).some((value) => value === null);
    overallFlagged.textContent = data.flagged ? "Flagged" :
      partialCoverage ? "Not flagged (partial coverage)" : "Not flagged";

    if (data.flagged) {
      const crossDiv = document.createElement("div");
      crossDiv.classList.add("cross");
      overallStatus.appendChild(crossDiv);
    } else {
      const checkmarkDiv = document.createElement("div");
      checkmarkDiv.classList.add("checkmark");
      overallStatus.appendChild(checkmarkDiv);
    }

    overallScore.textContent = `${(averageScore * 100).toFixed(4)}%`;

    overallRow.appendChild(overallStatus);
    overallRow.appendChild(overallFlagged);
    overallRow.appendChild(overallScore);
    overallResultBody.appendChild(overallRow);

    // Loop over categories and populate table rows
    for (const category in data.categories) {
      const row = document.createElement("tr");

      const statusTd = document.createElement("td");
      if (data.categories[category] === null) {
        statusTd.textContent = "Not assessed";
      } else if (data.categories[category]) {
        const crossDiv = document.createElement("div");
        crossDiv.classList.add("cross");
        statusTd.appendChild(crossDiv);
      } else {
        const checkmarkDiv = document.createElement("div");
        checkmarkDiv.classList.add("checkmark");
        statusTd.appendChild(checkmarkDiv);
      }
      row.appendChild(statusTd);

      const categoryNameTd = document.createElement("td");
      categoryNameTd.textContent = category;
      row.appendChild(categoryNameTd);

      const scoreTd = document.createElement("td");
      scoreTd.textContent = data.categories[category] === null ? "Not assessed" : `${(data.category_scores[category] * 100).toFixed(
        4
      )}%`;
      row.appendChild(scoreTd);

      detailedResultBody.appendChild(row);
    }

    // Reset the textarea for the next input
    if (userTextArea.value === text) userTextArea.value = "";
  } catch (error) {
    if (generation !== requestGeneration) return;
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 3;
    cell.textContent = "Moderation unavailable. No safety result was returned. Try again.";
    row.appendChild(cell);
    overallResultBody.replaceChildren(row);
    detailedResultBody.textContent = "";
  }
});
