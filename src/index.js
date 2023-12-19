import "./assets/styles/main.css";

console.log("Welcome to Promptfolio 0.0.1!");

const form = document.getElementById("filterForm");
const userTextArea = document.getElementById("userText");
const overallResultBody = document.getElementById("overallResultBody");
const detailedResultBody = document.getElementById("detailedResultBody");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = userTextArea.value;

  try {
    const baseURL = `${window.location.protocol}//${window.location.hostname}:3000`;
    const response = await fetch(`${baseURL}/api/filter-content`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();

    // Calculate the average score across all categories
    let totalScore = 0;
    let numberOfCategories = 0;
    for (const category in data.category_scores) {
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

    overallFlagged.textContent = data.flagged ? "Unsafe" : "Safe";

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
      if (data.categories[category]) {
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
      scoreTd.textContent = `${(data.category_scores[category] * 100).toFixed(
        4
      )}%`;
      row.appendChild(scoreTd);

      detailedResultBody.appendChild(row);
    }

    // Reset the textarea for the next input
    userTextArea.value = "";
  } catch (error) {
    console.error("Error with OpenAI request:", error);
    overallResultBody.innerHTML = `<tr><td colspan="3">Failed to retrieve data from OpenAI</td></tr>`;
    detailedResultBody.innerHTML = "";
  }
});
