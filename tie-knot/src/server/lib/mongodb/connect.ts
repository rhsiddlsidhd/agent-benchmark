import mongoose from "mongoose";

// 1. 캐시 객체의 타입을 정의합니다.
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// 2. NodeJS의 전역(global) 타입에 mongooseCache 속성을 추가합니다.

declare global {
  var mongooseCache: MongooseCache;
}

// 연결 문자열은 모듈 로드 시점이 아니라 실제 연결 직전에 만든다 — 지키려는 불변조건이
// "테스트가 프로덕션 DB에 연결하지 않는다"이므로 검증도 연결 시점에 있어야 한다.
// 로드 시점에 두면 DB를 전혀 안 쓰는 테스트도 배럴 캐스케이드로 이 파일이 딸려 들어오는
// 것만으로 걸린다(vitest `unit` 프로젝트는 mongod를 띄우지 않는다).
const resolveUri = () => {
  const testUri = process.env.MONGO_TEST_URI;

  if (process.env.VITEST && !testUri) {
    throw new Error(
      "테스트 환경에서 MONGO_TEST_URI 없이 실행됨 — 프로덕션 DB 오염 위험, globalSetup 확인하세요.",
    );
  }

  if (!testUri && (!process.env.DB_USER || !process.env.DB_PASSWORD)) {
    throw new Error(
      "MongoDB 연결 정보(DB_USER/DB_PASSWORD 또는 MONGO_TEST_URI)가 없습니다.",
    );
  }

  return (
    testUri ??
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@new-invitation-cluster.8umdvcl.mongodb.net/new_invitation?retryWrites=true&w=majority&appName=new-invitation-cluster`
  );
};

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = {
    conn: null,
    promise: null,
  };
}

export const dbConnect = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(resolveUri(), opts);
  }

  try {
    cached.conn = await cached.promise;

    console.log("MongoDB Connected");
    return cached.conn;
  } catch (e) {
    if (e instanceof Error) {
      console.error("MongoDB Connected Fail", e.message);
    }
    cached.promise = null;
    throw e;
  }
};

// 연결 상태 확인 함수
export const isConnected = () => {
  return mongoose.connection.readyState === 1;
};
