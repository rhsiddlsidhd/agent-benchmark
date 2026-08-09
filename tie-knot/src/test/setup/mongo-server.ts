import { MongoMemoryReplSet } from "mongodb-memory-server";

let mongoReplSet: MongoMemoryReplSet;

// mongoose session/transaction(TODO #1)은 replica set에서만 동작한다 — standalone
// MongoMemoryServer로는 "Transaction numbers are only allowed on a replica set
// member or mongos" 에러가 난다. 단일 노드 replSet(count: 1)이면 실제 다중 노드
// 없이도 트랜잭션을 검증할 수 있다. storageEngine은 명시적으로 wiredTiger로
// 고정한다 — 기본값(ephemeralForTest)은 트랜잭션이 필요로 하는 저널링을
// 지원하지 않는다.
// mongod 버전은 명시적으로 고정한다 — 생략하면 mongodb-memory-server 패키지가
// 정한 기본 버전을 쓰므로, 패키지를 올릴 때 테스트가 도는 mongod 버전이 조용히
// 바뀐다. 운영(Atlas)과 테스트가 다른 버전으로 갈리면 버전별 동작 차이가 테스트를
// 통과하고 운영에서만 드러난다.
const MONGOD_VERSION = "8.2.6";

export const setup = async () => {
  mongoReplSet = await MongoMemoryReplSet.create({
    binary: { version: MONGOD_VERSION },
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });
  process.env.MONGO_TEST_URI = mongoReplSet.getUri();
};

export const teardown = async () => {
  await mongoReplSet.stop();
};
