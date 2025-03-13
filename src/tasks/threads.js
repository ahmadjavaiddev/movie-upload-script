import { Worker } from "worker_threads";
import * as path from "path";
import { fileURLToPath } from "url";

const numThreads = 6;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function RunThreads(type = "NORMAL") {
  for (let i = 0; i < numThreads; i++) {
    let pathOfTask;
    if (type === "NORMAL") {
      pathOfTask = "browser.js";
    }
    if (type === "RETRY") {
      pathOfTask = "retryMovies.js";
    }

    const worker = new Worker(path.resolve(__dirname, pathOfTask));

    worker.on("message", (message) => {
      console.log(`Worker ${i} says:`, message);
    });

    worker.on("error", (error) => {
      console.error(`Worker ${i} encountered an error:`, error);
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        console.error(`Worker ${i} stopped with exit code ${code}`);
      } else {
        console.log(`Worker ${i} finished successfully`);
      }
    });
  }
}
