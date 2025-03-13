// const puppeteer = require("puppeteer");
const puppeteer = require("puppeteer-core");
const fs = require("fs");
const MovieModel = require("./models/Movie.model.js");
const connectDB = require("./DB/index.js");
const Redis = require("ioredis");

const redisClient = new Redis(
  "rediss://default:AccCAAIjcDFiZDhiZmVkOTMzZGE0ZmI3YmIyM2IxN2FhNzcwOWY5NnAxMA@obliging-cowbird-50946.upstash.io:6379"
);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const requestsToBlock = [
  "image",
  "stylesheet",
  "google.com",
  "data:image",
  "https://cvt-s2.agl002.online",
  "googletagmanager.com",
  "gstatic.com/recaptcha",
  "cdnjs.cloudflare.com",
  "vembed.net",
  "google-analytics.com",
  "cvt-s2.adangle.online",
  "engagedpungentrepress.com",
  "hqq.to",
  "adangle.online",
  "adcdnweb.site",
  "listeamed.net",
  "uncertainfollow.com",
  "acscdn.com",
  "adcdn29.site",
  "unpkg.com",
  "/js/adblock.js",
  "gstatic.com/cv/js/sender/v1",
];

(async () => {
  connectDB()
    .then(async () => {
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
          const shouldProcess = await addToDB({ ...movie, genre: genres });
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
              const addMovieSrc = await addSrc(movie.id, locationHeader);
              console.log("Added Movie ::", addMovieSrc.src, info);
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
          // Optional: For a failed movie, you might want to push it back onto the queue:
          // await redisClient.rPush("moviesQueue", JSON.stringify(movie));
        }
        // Get the next movie from Redis
        movieStr = await redisClient.lpop("moviesQueue");
      }

      await browser.close();
      await redisClient.quit();
      console.log("All movies have been processed.");
    })
    .catch((error) => console.log("Error connecting to DB ::", error));
})();

// Keep addToDB and addSrc functions unchanged (with a slight modification in addToDB below)

async function addToDB(movie) {
  try {
    const existingMovie = await MovieModel.findOne({
      movieId: String(movie.id),
    });
    if (existingMovie) {
      console.log("Movie already exists ::", existingMovie.title, movie.id);
      return false;
    }
    await MovieModel.create({
      movieId: String(movie.id),
      title: movie.title,
      thumbnail: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      backdrop: `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`,
      description: movie.overview,
      year: movie.release_date.split("-")[0],
      src: null,
      status: "PENDING",
      genre: genre,
    });
    return true;
  } catch (error) {
    console.log(`Error adding ${movie.id} movie to DB ::`, error);
    return false;
  }
}

async function addSrc(movieId, src) {
  try {
    const movie = await MovieModel.findOne({ movieId });
    if (!movie) {
      console.log(`Movie ${movieId} not found`);
      return false;
    }
    movie.src = src;
    movie.status = "PUBLISH";
    await movie.save();
    return movie;
  } catch (error) {
    console.log(`Error adding src to ${movieId} movie ::`, error);
    return false;
  }
}
