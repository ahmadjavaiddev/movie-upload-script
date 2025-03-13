// import puppeteer from "puppeteer";
import puppeteer from "puppeteer-core";
import Redis from "ioredis";
import { connectDB } from "../DB/index.js";
import { addMovie, addMovieSrc, delay } from "../utils/index.js";
import { requestsToBlock } from "../constants.js";

connectDB()
  .then(async () => {
    const redisClient = new Redis(process.env.REDIS_URI);
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
      executablePath: "/usr/bin/chromium-browser",
      defaultViewport: null,
      dumpio: true,
    });

    // Process movies from the Redis queue until empty
    let movieStr = await redisClient.lpop("moviesQueue");
    while (movieStr) {
      const movie = JSON.parse(movieStr);
      const info = `${movie.title} ${movie.id}`;
      console.log("Processing the Movie ::", info);

      let page;
      try {
        // Check if movie is already in DB (caching logic could also be added in Redis here)
        const genres = movie.genre_ids?.map((genre) => String(genre)) || [];
        const shouldProcess = await addMovie({ ...movie, genre: genres });
        if (!shouldProcess) {
          console.log(`Skipping movie ${info} as it already exists in DB.`);
          movieStr = await redisClient.lpop("moviesQueue");
          continue;
        }

        page = await browser.newPage();
        await page.setRequestInterception(true);

        page.on("request", (request) => {
          const requestUrl = request.url();
          if (requestsToBlock.some((req) => requestUrl.includes(req))) {
            request.abort();
          } else {
            request.continue();
          }
        });

        // Setup m3u8 detection promise
        let m3u8Resolve;
        const m3u8Promise = new Promise((resolve) => {
          m3u8Resolve = resolve;
        });

        page.on("response", async (response) => {
          try {
            const requestUrl = response.request().url();
            if (
              requestUrl.includes("/index.m3u8") &&
              response.status() === 302
            ) {
              const locationHeader = response.headers()["location"];
              if (locationHeader) m3u8Resolve(locationHeader);
            }
          } catch (error) {
            console.log("Error handling response:", error);
          }
        });

        const urlPath = movie.title
          .toLowerCase()
          .trim()
          .split(" ")
          .join("-")
          .replace(/[:']/g, "");

        await page.goto(`https://www.hdmovie2.uk/${urlPath}`, {
          waitUntil: "networkidle2",
          timeout: 60000,
        });

        // Check for not-found element
        const notFoundExists = await page.evaluate(() => {
          return document.querySelector(".not-found") !== null;
        });
        if (notFoundExists) {
          console.log("Not found element detected for movie:", info);
          await page.close();
          movieStr = await redisClient.lpop("moviesQueue");
          continue;
        }

        // Wait for m3u8 or timeout
        try {
          const locationHeader = await Promise.race([
            m3u8Promise,
            delay(30000), // 30 seconds timeout
          ]);

          if (locationHeader) {
            const response = await addMovieSrc(movie.id, locationHeader);
            console.log("Added Movie ::", response.src, info);
          } else {
            console.log("Timeout waiting for m3u8 for:", info);
          }
        } catch (error) {
          console.log("Error waiting for m3u8 response:", error);
        }

        await page.close();
        console.log("Process completed for:", info);
      } catch (error) {
        console.log("Error processing movie ::", info, error);
        if (page && !page.isClosed()) await page.close();
      }
      // Get the next movie from Redis
      movieStr = await redisClient.lpop("moviesQueue");
    }

    await browser.close();
    await redisClient.quit();
    console.log("All movies have been processed.");
  })
  .catch((error) => console.log("Error Processing The Movie ::", error));
