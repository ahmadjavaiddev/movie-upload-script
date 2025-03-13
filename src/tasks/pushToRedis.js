import Redis from "ioredis";
import { connectDB } from "../DB/index.js";
import MovieModel from "../models/Movie.model.js";

const pushToRedis = async (status = "PENDING") => {
  try {
    await connectDB();
    const redisClient = new Redis(process.env.REDIS_URI);
    console.log("process.env.REDIS_URI ::", process.env.REDIS_URI);
    const movies = await MovieModel.find({ status: status });
    console.log("Total Movies to Add ::", movies.length);

    const queueLength = await redisClient.llen("moviesQueue");
    if (queueLength === 0) {
      console.log("Pushing movies to Redis queue...");

      // Use pipeline for bulk operations
      const pipeline = redisClient.pipeline();
      const BATCH_SIZE = 1000;

      for (let i = 0; i < movies.length; i += BATCH_SIZE) {
        const batch = movies.slice(i, i + BATCH_SIZE);
        batch.forEach((movie) => {
          pipeline.rpush("moviesQueue", JSON.stringify(movie));
        });

        // Execute batch
        await pipeline.exec();
        console.log(`Processed ${i + batch.length} of ${movies.length} movies`);
      }

      console.log("Movies Added Successfully");
    } else {
      console.log("Queue is not empty. Skipping push operation.");
    }
  } catch (error) {
    console.error("Error pushing movies to Redis:", error);
    throw error;
  } finally {
    // await redisClient.quit();
  }
};

export { pushToRedis };
