import { describe, it, expect, afterEach } from "vitest";
import mongoose from "mongoose";
import { dbConnect, isConnected } from "./connect";

describe("dbConnect", () => {
  afterEach(async () => {
    await mongoose.disconnect();
    global.mongooseCache = { conn: null, promise: null };
  });

  it("MONGO_TEST_URI로 실제 mongod(mongodb-memory-server)에 연결한다", async () => {
    await dbConnect();

    expect(isConnected()).toBe(true);
  });
});
