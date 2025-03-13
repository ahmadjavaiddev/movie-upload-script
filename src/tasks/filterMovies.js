import fs from "fs";
import path from "path";
import { connectDB } from "../DB/index.js";
import { addMovie, writeFile } from "../utils/index.js";

const UniqueMovies = new Map();
let MoviesJSON = [];

try {
  const filePath = path.resolve("./JSON/AllMovies.json");
  MoviesJSON = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  if (!Array.isArray(MoviesJSON)) {
    throw new Error("Invalid JSON format: expected an array");
  }
} catch (error) {
  console.error("Error reading movies file:", error.message);
  process.exit(1);
}

const moviesToProcess = [];

async function filterMovies() {
  try {
    await connectDB();
    const results = {
      totalMovies: MoviesJSON.length,
      processedMovies: 0,
      skippedMovies: 0,
      errors: 0,
    };

    for (const movie of MoviesJSON) {
      try {
        if (!movie.id) {
          console.warn("Skipping movie with no ID");
          results.errors++;
          continue;
        }

        if (!UniqueMovies.has(movie.id)) {
          UniqueMovies.set(movie.id, movie);
          moviesToProcess.push(movie);
          await addMovie(movie);
          console.log(`Movie Processed :: ${movie.id}`);
          results.processedMovies++;
        } else {
          console.log(`Duplicate movie skipped :: ${movie.id}`);
          results.skippedMovies++;
        }
      } catch (movieError) {
        console.error(`Error processing movie ${movie.id}:`, movieError);
        results.errors++;
      }
    }
    writeFile("UniqueMovies.json", Array.from(UniqueMovies));
    console.log("results ::", UniqueMovies);
    return results;
  } catch (error) {
    console.error("Error In Filter Movies:", error);
    throw error;
  }
}

export { filterMovies, UniqueMovies, moviesToProcess };
