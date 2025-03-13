// cdn4521
import dotenv from "dotenv";
import readlineSync from "readline-sync";
// import { filterMovies } from "./tasks/filterMovies.js";
import { RunThreads } from "./tasks/threads.js";
import { pushToRedis } from "./tasks/pushToRedis.js";

dotenv.config();

async function main() {
  while (true) {
    console.log(">> What do you want to do:");
    const tools = ["Run:Threads", "Filter:Movies", "Push:Redis"];

    const index = readlineSync.keyInSelect(tools, ">> Which Tool?");
    if (index === -1) {
      console.log("\nOperation cancelled. Exiting.");
      break;
    }

    const task = tools[index];
    console.log(`\n${task} Power Unlocked! :)\n`);

    try {
      switch (task) {
        case "Run:Threads":
          console.log("Running Threads");
          await RunThreads();
          break;
        // case "Filter:Movies":
        //   console.log("Running the Filter All Movies Task");
        //   await filterMovies();
        //   break;
        case "Push:Redis":
          console.log("Movies Adding to Redis");
          await pushToRedis();
          break;
      }
      console.log("\nTask completed successfully!\n");
    } catch (error) {
      console.error("\nTask failed:", error.message);
    }
  }
}

main();
