import http from "node:http";
import { spawn } from "node:child_process";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

const APP_PORT = 3100;
const CLOUDINARY_PORT = 3199;
const PORTONE_PORT = 3198;
const ADMIN_EMAIL = "admin-e2e@example.com";
const ADMIN_PASSWORD = "Admin-e2e1!";
const USER_EMAIL = "user-e2e@example.com";
const USER_PASSWORD = "User-e2e1!";
const CHECKOUT_PRODUCT_ID = new mongoose.Types.ObjectId("64b000000000000000000001");
const realPortOneSmoke = process.env.PORTONE_SMOKE === "1";

if (realPortOneSmoke) {
  for (const name of ["PORTONE_STORE_ID", "PORTONE_CHANNEL_KEY", "PORTONE_API_SECRET"]) {
    if (!process.env[name]) throw new Error(`${name} is required when PORTONE_SMOKE=1`);
  }
}

const replSet = await MongoMemoryReplSet.create({
  replSet: { count: 1, storageEngine: "wiredTiger" },
});
const mongoUri = replSet.getUri("tie-knot-e2e");

await mongoose.connect(mongoUri);
const users = mongoose.connection.collection("users");
await users.createIndex({ email: 1 }, { unique: true });
await users.insertOne({
  email: ADMIN_EMAIL,
  name: "E2E 관리자",
  phone: "01012345678",
  password: await bcrypt.hash(ADMIN_PASSWORD, 12),
  role: "ADMIN",
  isDelete: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});
await users.insertOne({
  email: USER_EMAIL,
  name: "E2E 구매자",
  phone: "01012345679",
  password: await bcrypt.hash(USER_PASSWORD, 12),
  role: "USER",
  isDelete: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});
await mongoose.connection.collection("products").insertOne({
  authorId: "e2e-seed",
  title: "E2E 기존 이미지 상품",
  description: "기존 이미지를 유지하는 수정 흐름 검증 상품입니다.",
  thumbnail: "https://res.cloudinary.com/e2e/image/upload/existing-thumbnail.png",
  price: 15000,
  category: "favor",
  subCategory: "candle",
  isPremium: false,
  featureIds: [],
  isFeatured: false,
  priority: 0,
  likes: [],
  views: 0,
  salesCount: 0,
  discount: { discountType: "rate", value: 0 },
  status: "active",
  deletedAt: null,
  images: ["https://res.cloudinary.com/e2e/image/upload/existing-detail.png"],
  minQuantity: 1,
  maxQuantity: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
});
await mongoose.connection.collection("products").insertOne({
  _id: CHECKOUT_PRODUCT_ID,
  authorId: "e2e-seed",
  title: "E2E 결제 상품",
  description: "주문 생성과 mock 결제 완료 흐름을 검증하는 상품입니다.",
  thumbnail: "https://res.cloudinary.com/e2e/image/upload/checkout.png",
  price: 12000,
  category: "invitation",
  subCategory: "wedding-invitation",
  isPremium: false,
  featureIds: [],
  isFeatured: false,
  priority: 0,
  likes: [],
  views: 0,
  salesCount: 0,
  discount: { discountType: "rate", value: 0 },
  status: "active",
  deletedAt: null,
  images: [],
  minQuantity: 1,
  maxQuantity: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
});

let uploadSequence = 0;
const cloudinary = http.createServer((request, response) => {
  if (request.method !== "POST" || !request.url?.endsWith("/image/upload")) {
    response.writeHead(404).end();
    return;
  }

  request.resume();
  request.on("end", () => {
    uploadSequence += 1;
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({
      public_id: `e2e/product-${uploadSequence}`,
      secure_url: `https://res.cloudinary.com/e2e/image/upload/product-${uploadSequence}.png`,
    }));
  });
});
await new Promise((resolve) => cloudinary.listen(CLOUDINARY_PORT, "127.0.0.1", resolve));

const portone = realPortOneSmoke ? null : http.createServer(async (request, response) => {
  const match = request.url?.match(/^\/payments\/([^?]+)/);
  if (request.method !== "GET" || !match) {
    response.writeHead(404).end();
    return;
  }

  const paymentId = decodeURIComponent(match[1]);
  const order = await mongoose.connection.collection("orders").findOne({ merchantUid: paymentId });
  if (!order) {
    response.writeHead(404, { "content-type": "application/json" });
    response.end(JSON.stringify({ type: "PAYMENT_NOT_FOUND", message: "payment not found" }));
    return;
  }

  const now = new Date().toISOString();
  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify({
    status: "PAID",
    id: paymentId,
    transactionId: `transaction-${paymentId}`,
    merchantId: "merchant-e2e",
    storeId: "store-e2e",
    channel: { pgProvider: "E2E" },
    version: "V2",
    requestedAt: now,
    updatedAt: now,
    statusChangedAt: now,
    orderName: `${order.product.title} 모바일 청첩장`,
    amount: { total: order.finalPrice, paid: order.finalPrice, cancelled: 0, cancelledTaxFree: 0 },
    currency: "KRW",
    customer: {},
    customData: JSON.stringify({ productId: order.product.productId.toString() }),
    paidAt: now,
    disputes: [],
  }));
});
if (portone) {
  await new Promise((resolve) => portone.listen(PORTONE_PORT, "127.0.0.1", resolve));
}

const app = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", String(APP_PORT)],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      MONGO_TEST_URI: mongoUri,
      JWT_SECRET: "e2e-jwt-secret-at-least-thirty-two-characters",
      ENTRY_JWT_SECRET: "e2e-entry-secret-at-least-thirty-two-chars",
      NEXT_PUBLIC_CLOUDINARY_BASE_URL: `http://127.0.0.1:${CLOUDINARY_PORT}`,
      CLOUDINARY_UPLOAD_PRESET: "e2e-preset",
      CLOUDINARY_CLOUD_NAME: "e2e-cloud",
      CLOUDINARY_API_KEY: "e2e-key",
      CLOUDINARY_API_SECRET: "e2e-secret",
      NEXT_PUBLIC_PORTONE_STORE_ID: realPortOneSmoke
        ? process.env.PORTONE_STORE_ID
        : "store-e2e",
      NEXT_PUBLIC_PORTONE_CHANNEL_KEY: realPortOneSmoke
        ? process.env.PORTONE_CHANNEL_KEY
        : "channel-e2e",
      NEXT_PUBLIC_PORTONE_E2E_MOCK: realPortOneSmoke ? "" : "enabled",
      NEXT_PUBLIC_PORTONE_MANUAL_SMOKE: realPortOneSmoke ? "enabled" : "",
      PORTONE_API_SECRET: realPortOneSmoke
        ? process.env.PORTONE_API_SECRET
        : "portone-e2e-secret",
      PORTONE_API_BASE_URL: realPortOneSmoke
        ? ""
        : `http://127.0.0.1:${PORTONE_PORT}`,
    },
  },
);

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  if (!app.killed) app.kill(signal);
  await new Promise((resolve) => cloudinary.close(resolve));
  if (portone) await new Promise((resolve) => portone.close(resolve));
  await mongoose.disconnect();
  await replSet.stop();
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    await shutdown(signal);
    process.exit(0);
  });
}

app.on("exit", async (code) => {
  await shutdown("SIGTERM");
  process.exit(code ?? 1);
});
