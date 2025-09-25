import mongoose from "mongoose";

// MongoDB connection string - you'll need to set this in your environment variables
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

const connectionOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  bufferCommands: false,
  heartbeatFrequencyMS: 10000,
};

// Mongoose connection with global caching for Next.js dev mode to avoid multiple connections on hot reload
declare global {
  // eslint-disable-next-line no-var
  var _mongooseConnection: Promise<typeof mongoose> | undefined;
}

let cached = global._mongooseConnection;

if (!cached) {
  cached = global._mongooseConnection = mongoose.connect(
    MONGODB_URI,
    connectionOptions,
  );
}

export async function connectToMongoDB(): Promise<typeof mongoose> {
  try {
    const connection = await cached!;
    // Check if connection is still alive
    if (connection.connection.readyState !== 1) {
      console.warn("MongoDB connection lost, reconnecting...");
      global._mongooseConnection = undefined;
      return connectToMongoDB();
    }
    return connection;
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    // Reset cache on failure to allow retry
    global._mongooseConnection = undefined;
    throw error;
  }
}

// Helper to disconnect (useful for testing)
export async function disconnectFromMongoDB(): Promise<void> {
  if (mongoose.connections[0].readyState !== 0) {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}
