import Redis from "ioredis";
import fs from "fs";

const client = new Redis(
  "rediss://default:AccCAAIjcDFiZDhiZmVkOTMzZGE0ZmI3YmIyM2IxN2FhNzcwOWY5NnAxMA@obliging-cowbird-50946.upstash.io:6379"
);

// Read movies from file
const moviesData = JSON.parse(fs.readFileSync("./data.json", "utf-8"));

(async () => {
  console.log("Total Movies to Add ::", moviesData.length);

  const queueLength = await client.llen("moviesQueue");
  if (queueLength === 0) {
    console.log("Pushing movies to Redis queue...");
    for (const movie of moviesData) {
      await client.rpush("moviesQueue", JSON.stringify(movie));
      console.log("Movie Added in Redis ::", movie.id);
    }
  }

  //   for (const movie of moviesData) {
  //     await client.rPush("moviesQueue", JSON.stringify(movie));
  //     console.log("Movie Added in Redis ::", movie.id);
  //   }

  console.log("Movies Added SeccessFully");
})();
