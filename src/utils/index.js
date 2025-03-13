import MovieModel from "../models/Movie.model.js";
import fs from "fs";
import path from "path";
const imageLinkBase = "https://image.tmdb.org/t/p";

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const addMovie = async (movie) => {
  try {
    const { id, title, poster_path, backdrop_path, overview, release_date } =
      movie;

    const existingMovie = await MovieModel.findOne({ movieId: String(id) });
    if (existingMovie) {
      console.log(`"Movie already exists ${title} ${id}`);
      return false;
    }
    const genres = movie.genre_ids?.map((genre) => String(genre)) || [];
    const newMovie = await MovieModel.create({
      movieId: String(id),
      title: title,
      thumbnail: `${imageLinkBase}/w500${poster_path}`,
      backdrop: `${imageLinkBase}/w1280${backdrop_path}`,
      description: overview,
      year: release_date.split("-")[0],
      src: null,
      status: "PENDING",
      genre: genres,
    });
    return newMovie;
  } catch (error) {
    console.error("Error adding movie:", error);
    return false;
  }
};

export async function addMovieSrc(movieId, src) {
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

export function writeFile(name, data) {
  try {
    const filePath = path.resolve(`./JSON/${name}`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.log("Error Writing File:", error);
  }
}
