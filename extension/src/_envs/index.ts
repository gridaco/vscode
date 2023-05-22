import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import assert from "assert";

export function config() {
  // ensure file exists
  const envPath = path.resolve(__dirname, "../.env");
  const fileExists = fs.existsSync(envPath);

  assert(
    process.env.NODE_ENV === "production" ? fileExists : true,
    `env file not found at ${envPath}`
  );

  if (fileExists) {
    dotenv.config({
      path: path.resolve(envPath),
    });
  } else {
    console.warn("env file not found");
  }
}
