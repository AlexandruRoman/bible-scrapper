const puppeteer = require("puppeteer");
var fs = require("fs");

const URL = "https://www.bible.com/bible/191/GEN.1.VDC";

const extractBook = (url) => {
  return url.split("/").slice(-1)[0].split(".")[0];
};

async function tutorial() {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(URL);
    const books = {};
    while (true) {
      const bookId = extractBook(page.url());
      if (!books[bookId]) books[bookId] = [];

      const verses = await page.evaluate(() => {
        const output = [];
        const spans = document.querySelectorAll("span.verse");
        const versesCount = [
          ...new Map(
            Object.values(spans).map((item) => [item.className, item])
          ).values(),
        ].length;
        for (let v = 1; v <= versesCount; v++) {
          const contents = Object.values(
            document.querySelectorAll(`span.verse.v${v} .content`)
          ).map((el) => el.textContent);
          output.push(
            contents
              .join(" ")
              .trim()
              .replace(/  +/g, " ")
              .replace(/ \,/, ",")
              .replace(/ \;/, ";")
              .replace(/ \:/, ":")
              .replace(/ \!/, "!")
              .replace(/ \?/, "?")
              .replace(/ \./g, ".")
          );
        }
        return output;
      });

      books[bookId].push(verses);
      try {
        await page.click("a.nav-right");
      } catch (error) {
        break;
      }
      await page.waitForSelector(".verse");

      // if (books[bookId].length === 2) break;
    }
    await browser.close();
    const json = JSON.stringify(books);
    fs.writeFile("VDC.json", json, "utf8", () => false);
  } catch (error) {
    console.error(error);
  }
}

tutorial();
