import mongoose from "mongoose";

// MongoDB connection string - you'll need to set this in your environment variables
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

// Mongoose connection with global caching for Next.js dev mode to avoid multiple connections on hot reload
declare global {
  // eslint-disable-next-line no-var
  var _mongooseConnection: Promise<typeof mongoose> | undefined;
}

let cached = global._mongooseConnection;

if (!cached) {
  try {
    cached = global._mongooseConnection = mongoose.connect(MONGODB_URI);
  } catch (error) {
    console.error("Error connecting to MongoDB", error);
    throw error;
  }
}

export async function connectToMongoDB(): Promise<typeof mongoose> {
  return cached!;
}

// Helper to disconnect (useful for testing)
export async function disconnectFromMongoDB(): Promise<void> {
  if (mongoose.connections[0].readyState !== 0) {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}
