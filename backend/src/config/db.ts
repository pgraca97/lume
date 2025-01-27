// src/config/db.ts
import mongoose from "mongoose";

const MONGODB_RETRY_ATTEMPTS = 5;
const MONGODB_RETRY_INTERVAL = 5000; // 5 segundos

export const connectDB = async () => {
  for (let attempt = 1; attempt <= MONGODB_RETRY_ATTEMPTS; attempt++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI as string, {
        serverSelectionTimeoutMS: 10000, 
        socketTimeoutMS: 45000, 
        heartbeatFrequencyMS: 2000,
        maxPoolSize: 10,
        minPoolSize: 2,
        maxIdleTimeMS: 30000,
      });

      console.log("📦 MongoDB Connected");
      return;
    } catch (error) {
      console.error(`Connection attempt ${attempt} failed:`, error);
      if (attempt === MONGODB_RETRY_ATTEMPTS) {
        throw error;
      }
      console.log(`Retrying in ${MONGODB_RETRY_INTERVAL / 1000} seconds...`);
      await new Promise((resolve) =>
        setTimeout(resolve, MONGODB_RETRY_INTERVAL)
      );
    }
  }
};

// Adicionar handlers para reconexão
mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected! Attempting to reconnect...");
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected!");
});
