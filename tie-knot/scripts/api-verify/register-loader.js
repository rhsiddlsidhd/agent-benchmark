const { register } = require("node:module");
const { pathToFileURL } = require("node:url");

// alias-loader.mjs를 등록한다 — 이 스크립트 트리 안에서 src/**의 `@/` 별칭 import 또는
// 확장자 없는 상대 import를 직접 import(schemas.js, auth.js)해야 하는 곳마다 이 파일을
// 한 번 require하면 된다. 여러 번 require돼도(schemas.js/auth.js 각자 require) module
// 캐시 덕에 등록은 한 번만 실행된다.
register("./alias-loader.mjs", pathToFileURL(__filename));
