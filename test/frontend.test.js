const { Builder, By, Key, until } = require("selenium-webdriver");
const { expect } = require("chai");

let driver;

before(async () => {
  driver = await new Builder().forBrowser("chrome").build();
});

after(async () => {
  await driver.quit();
});

describe("Frontend Testing", function () {
  this.timeout(10000);

  beforeEach(async () => {
    const baseURL = process.env.BASE_URL;
    await driver.get(baseURL);
  });

  it("should display the result after form submission", async function () {
    const textarea = await driver.findElement(By.id("userText"));
    await textarea.sendKeys("Hello world");

    const submitButton = await driver.findElement(
      By.css('input[type="submit"]')
    );
    await submitButton.click();

    const resultElement = await driver.findElement(By.id("result"));
    await driver.wait(
      until.elementTextContains(resultElement, "Flagged"),
      5000
    );
    const resultContent = await resultElement.getText();

    expect(resultContent).to.include("Flagged");
    expect(resultContent).to.include("Violence Score");
  });
});
