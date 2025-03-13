const { Worker } = require('worker_threads');
const path = require('path');

const numThreads = 4; // Number of threads you want to create

for (let i = 0; i < numThreads; i++) {
    const worker = new Worker(path.resolve(__dirname, 'browser.js'));

    worker.on('message', (message) => {
        console.log(`Worker ${i} says:`, message);
    });

    worker.on('error', (error) => {
        console.error(`Worker ${i} encountered an error:`, error);
    });

    worker.on('exit', (code) => {
        if (code !== 0) {
            console.error(`Worker ${i} stopped with exit code ${code}`);
        } else {
            console.log(`Worker ${i} finished successfully`);
        }
    });
}