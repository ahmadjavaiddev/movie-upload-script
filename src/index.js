// cdn4521
import dotenv from "dotenv";
import readlineSync from "readline-sync";
import { filterMovies } from "./tasks/filterMovies.js";
import { RunThreads } from "./tasks/threads.js";

dotenv.config();

async function main() {
  while (true) {
    console.log(">> What do you want to do:");
    const tools = ["Run Threads", "Filter All Movies"];

    const index = readlineSync.keyInSelect(tools, ">> Which Tool?");
    if (index === -1) {
      console.log("\nOperation cancelled. Exiting.");
      break;
    }

    const task = tools[index];
    console.log(`\n${task} Power Unlocked! :)\n`);

    try {
      switch (task) {
        case "Filter All Movies":
          console.log("Running the Filter All Movies Task");
          await filterMovies();
          break;
        case "Run Threads":
          console.log("Running Threads");
          await RunThreads();
          break;
      }
      console.log("\nTask completed successfully!\n");
    } catch (error) {
      console.error("\nTask failed:", error.message);
    }
  }
}

main();
