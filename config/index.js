const mongoose = require("mongoose");

async function connectWithRetry() {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 10000,
    });
    console.log("Connected successfully to MongoDB!");
  } catch (err) {
    console.error("MongoDB connection failed. Retrying in 5 seconds...", err);
    setTimeout(connectWithRetry, 5000);
  }
};

mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected");
});

module.exports.connect = connectWithRetry;