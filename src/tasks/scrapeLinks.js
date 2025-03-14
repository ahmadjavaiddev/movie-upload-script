// import puppeteer from "puppeteer";
// import { requestsToBlock } from "./src/constants.js";

// (async () => {
//   const browser = await puppeteer.launch({
//     headless: false,
//     args: [
//       "--no-sandbox",
//       "--disable-setuid-sandbox",
//       "--disable-dev-shm-usage",
//     ],
//     defaultViewport: null,
//     dumpio: true,
//   });

//   let page = await browser.newPage();
//   await page.setRequestInterception(true);

//   page.on("request", (request) => {
//     const requestUrl = request.url();
//     if (requestsToBlock.some((req) => requestUrl.includes(req))) {
//       request.abort();
//     } else {
//       if (requestUrl.includes("vino332gptk.com/play/")) {
//         console.log(requestUrl.split("vino332gptk.com/play/")[1]);
//       }
//       request.continue();
//     }
//   });

//   await page.goto(`https://www.hdmovie2.uk/the-diplomat-2025-hindi`, {
//     waitUntil: "networkidle2",
//     timeout: 60000,
//   });

//   console.log("All movies have been processed.");
// })();

import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

const targetUrl = {
  url: "https://www.hdmovie2.uk/genre/adventure",
  maxLength: 68,
  fileName: "adventure.json",
};

// Configure scraper
const config = {
  targetUrl: targetUrl.url,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  },
  delay: 2000, // 2-second delay between requests
};

async function scrapeWebsite() {
  try {
    let i = 1;
    while (i <= targetUrl.maxLength) {
      // Fetch HTML
      const response = await axios.get(`${targetUrl.url}/page/${i}`, {
        headers: config.headers,
      });

      // Load HTML into Cheerio
      const $ = cheerio.load(response.data);
      await fetchLinks($);
      console.log(`Page ${i} Processed`);
      i++;
    }
  } catch (error) {
    console.error("Scraping failed:", error.message);
  }
}

async function fetchLinks($) {
  try {
    const moviesLink = [];

    // First find the movies list container
    const moviesList = $(".movies-list-full");

    // Then find all movie items within the list
    moviesList.find(".ml-item").each((index, elem) => {
      const movieElement = $(elem);
      const relativeLink = movieElement.find("a").attr("href");

      if (relativeLink) {
        // Convert relative URL to absolute URL
        const absoluteLink = new URL(relativeLink, config.targetUrl).href;
        moviesLink.push({
          url: absoluteLink,
        });
      }
    });
    console.log("moviesLink ::", moviesLink);
    writeFile(moviesLink);
  } catch (error) {
    console.log("Error ::", error);
  }
}

function writeFile(data) {
  try {
    const filePath = path.resolve(`./${targetUrl.fileName}`);
    let previousData = [];

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      if (fileContent) {
        previousData = JSON.parse(fileContent);
      }
    }
    const newData = [...previousData, ...data];
    console.log("Total Movies Are ::", newData.length);
    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));
  } catch (error) {
    console.log("Error while writing File ::", error);
  }
}

// Run scraper
export { scrapeWebsite };
