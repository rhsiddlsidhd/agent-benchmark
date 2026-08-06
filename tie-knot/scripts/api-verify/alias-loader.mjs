import { existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

// Node ESM은 (1) tsconfig `@/*` 경로 별칭도, (2) 확장자 없는 상대 import(TS 관행)도
// 못 푼다 — src/shared/schemas/response/*.ts가 `@/shared/...`를 참조하기 시작하면서
// (server/client/shared 3분할 리팩토링 이후) 이 스크립트들이 그 파일을 직접 import할 때마다
// ERR_MODULE_NOT_FOUND로 깨졌다. tsconfig.json의 `"@/*": ["./src/*"]`와 동일한 규칙만
// 최소로 재현한다.
const SRC_ROOT = pathToFileURL(
  new URL("../../src/", import.meta.url).pathname,
).href;

const CANDIDATE_SUFFIXES = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];

function resolveWithExtensions(url) {
  const filePath = fileURLToPath(url);
  for (const suffix of CANDIDATE_SUFFIXES) {
    const candidate = filePath + suffix;
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return pathToFileURL(candidate).href;
    }
  }
  return null;
}

// 이 스크립트 트리(dev 전용 검증 도구)에서만 쓰는 stub — 앱 런타임(Next 빌드)에는 전혀
// 영향 없다. stubs/*.mjs 자체의 주석 참고.
const BARE_SPECIFIER_STUBS = {
  "next/server": new URL("./stubs/next-server.mjs", import.meta.url).href,
};

// product.schema.ts는 barrel(`@/shared/utils`)에서 PRODUCT_CATEGORIES 하나만 가져오는데,
// barrel 전체를 그대로 재현하면 그 안의 다른 재-export(error.ts의 `next/server` 값 import,
// page.ts가 끌어오는 `@/shared/constants`→`@/shared/types` type-only 연쇄 등)까지 전부
// 실행돼 이 스크립트가 못 푸는 지점까지 번진다. barrel을 거치지 않고 심볼이 실제로 정의된
// 단일 파일로 바로 연결해 우회한다 — product.schema.ts가 barrel에서 다른 심볼을 더 쓰게
// 되면 이 표도 같이 갱신해야 한다.
const BARE_SPECIFIER_REDIRECTS = {
  "@/shared/utils": "@/shared/utils/category",
};

export async function resolve(specifier, context, nextResolve) {
  if (BARE_SPECIFIER_STUBS[specifier]) {
    return nextResolve(BARE_SPECIFIER_STUBS[specifier], context);
  }

  specifier = BARE_SPECIFIER_REDIRECTS[specifier] ?? specifier;

  if (specifier.startsWith("@/")) {
    const mapped = new URL(specifier.slice(2), SRC_ROOT).href;
    const resolved = resolveWithExtensions(mapped);
    if (resolved) return nextResolve(resolved, context);
  }

  // "확장자가 이미 있는지"를 특정 확장자 화이트리스트 없이 판단하기는 애매하다
  // (`coupleInfo.schema`처럼 파일명 자체에 점이 들어간 TS 관행이 흔해서, 마지막
  // `.segment`만 보고 확장자로 오판하기 쉽다) — 그래서 있든 없든 그냥 먼저
  // resolveWithExtensions로 시도하고, 못 찾을 때만 기본 리졸버에 그대로 넘긴다.
  const isRelative = specifier.startsWith("./") || specifier.startsWith("../");
  if (isRelative && context.parentURL) {
    const mapped = new URL(specifier, context.parentURL).href;
    const resolved = resolveWithExtensions(mapped);
    if (resolved) return nextResolve(resolved, context);
  }

  return nextResolve(specifier, context);
}
