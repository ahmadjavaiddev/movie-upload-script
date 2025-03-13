const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const options = {
      dbName: "movies",
    };

    const conn = await mongoose.connect("mongodb://localhost:27017", options);
    // const conn = await mongoose.connect(
    //   "mongodb+srv://ahmadjavaiddev:fWjG9JgWNswAkQ98@cluster0.xledk.mongodb.net",
    //   options
    // );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log("Error ::", error);
    process.exit(1);
  }
};

module.exports = connectDB;
