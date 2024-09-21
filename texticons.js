const puppeteer = require("puppeteer");

(async () => {
  // Step 1: Launch Puppeteer browser
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Step 2: Navigate to the Expo Icons website
  await page.goto("https://icons.expo.fyi/");

  // Step 3: Wait for the content to load (you might need to adjust the selector)
  await page.waitForSelector("#root");

  // Step 4: Extract icon data (adjust this based on the structure of the site)
  const icons = await page.evaluate(() => {
    const iconElements = Array.from(
      document.querySelectorAll(".icon-class-name")
    ); // Replace with actual class
    return iconElements.map((icon) => ({
      name: icon.innerText, // Replace with actual property
      imageUrl: icon.src, // Replace with actual property
    }));
  });

  // Step 5: Output the scraped icon data
  console.log(icons);

  // Step 6: Close the browser
  await browser.close();
})();
