import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { MongoMemoryServer } from "mongodb-memory-server";

export async function runBuildWithMemoryMongo({
  createMongo = () => MongoMemoryServer.create(),
  run = (uri) => new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", "build"], {
      stdio: "inherit",
      env: {
        ...process.env,
        MONGO_TEST_URI: uri,
        MAIN_PREVIEW_INFO_ID: "",
        MAIN_PREVIEW_PRODUCT_ID: "",
      },
    });
    child.once("error", reject);
    child.once("close", (code) => resolve(code ?? 1));
  }),
} = {}) {
  const mongo = await createMongo();
  try {
    return await run(mongo.getUri());
  } finally {
    await mongo.stop();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = await runBuildWithMemoryMongo();
}
