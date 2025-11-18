import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: "standalone",

  // Ensure environment variables are available at runtime in standalone mode
  env: {
    FASTAPI_ENDPOINT: process.env.FASTAPI_ENDPOINT,
    OLLAMA_ENDPOINT: process.env.OLLAMA_ENDPOINT,
    INTERNAL_API_URL: process.env.INTERNAL_API_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
  },
};

export default nextConfig;
