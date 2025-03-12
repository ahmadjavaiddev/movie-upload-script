const puppeteer = require("puppeteer");
const fs = require("fs");
const MovieModel = require("./models/Movie.model.js");
const connectDB = require("./DB/index.js");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const moviesData = JSON.parse(fs.readFileSync("./data.json", "utf-8"));
let movies = [...moviesData];

const requestsToBlock = [
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

connectDB()
  .then(async () => {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: null,
      dumpio: true,
    });

    while (movies.length > 0) {
      const movie = movies[0];
      let page;
      try {
        page = await browser.newPage();
        await page.setRequestInterception(true);

        const shouldProcess = await addToDB(movie);
        if (!shouldProcess) {
          movies.shift();
          updateMoviesFile();
          await page.close();
          continue;
        }

        page.on("request", (request) => {
          const requestUrl = request.url();
          if (requestsToBlock.some((req) => requestUrl.includes(req))) {
            request.abort();
          } else {
            request.continue();
          }
        });

        page.on("response", async (response) => {
          try {
            const request = response.request();
            const requestUrl = request.url();

            if (
              requestUrl.includes("/index.m3u8") &&
              response.status() === 302
            ) {
              const locationHeader = response.headers()["location"];
              if (locationHeader) {
                const addMovieSrc = await addSrc(movie.id, locationHeader);
                console.log("Added Movie ::", addMovieSrc.src);
              }
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
          waitUntil: "networkidle0",
          timeout: 60000,
        });

        await delay(3000);
        movies.shift();
        updateMoviesFile();
        await page.close();
        console.log("Successfully processed:", movie.title);
      } catch (error) {
        console.log("Error processing movie ::", movie.id, error);
        if (page && !page.isClosed()) {
          await page.close();
        }
      }
    }

    await browser.close();
  })
  .catch((error) => console.log("Error connecting to DB ::", error));

async function addToDB(movie) {
  try {
    const existingMovie = await MovieModel.findOne({
      movieId: String(movie.id),
    });

    if (existingMovie) {
      console.log("Movie already exists ::", existingMovie.title);
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

function updateMoviesFile() {
  try {
    fs.writeFileSync("./data.json", JSON.stringify(movies, null, 2), "utf-8");
  } catch (error) {
    console.log("Error updating movies file:", error);
  }
}
