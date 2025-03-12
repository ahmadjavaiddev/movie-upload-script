const fs = require("fs");
const path = require("path");

const connectDB = require("./DB");
const axios = require("axios");
const OUTPUT_FILE = path.join(__dirname, "indian.json");

async function fetchMovies() {
  // Initialize or read existing data
  let allMovies = [];
  if (fs.existsSync(OUTPUT_FILE)) {
    allMovies = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
  }

  try {
    for (let page = 1; page <= 500; page++) {
      const response = await axios(
        `https://api.themoviedb.org/3/discover/movie?api_key=46b8e7c428aeb13c58e17fc2d0740d3f&with_original_language=hi|kn|ml|ta|te&page=${page}`
      );

      const newMovies = response.data.results;
      allMovies = [...allMovies, ...newMovies];

      // Save after each page to prevent data loss
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allMovies, null, 2));
      console.log(`Processed page ${page}/500`);

      // Add a small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  } catch (error) {
    console.error("Error fetching movies:", error.message);
  }
}

connectDB()
  .then(() => {
    console.log("Connected to DB");
    fetchMovies();
  })
  .catch((error) => console.log("Error connecting to DB ::", error));
