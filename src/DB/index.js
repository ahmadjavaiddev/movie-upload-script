import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const options = {
      dbName: process.env.DB_NAME,
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log("Error ::", error);
    process.exit(1);
  }
};

export { connectDB };
