import { Worker } from "worker_threads";
import * as path from "path";
import { fileURLToPath } from "url";

const numThreads = 4;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function RunThreads() {
  for (let i = 0; i < numThreads; i++) {
    const worker = new Worker(path.resolve(__dirname, "browser.js"));

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
