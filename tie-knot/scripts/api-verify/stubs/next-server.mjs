// src/shared/types/error.ts가 `NextResponse`를 타입으로만 쓴다
// (`APIRouteResponse<T> = NextResponse<APIResponse<T>>`, 런타임 값으로 호출되는 곳 없음).
// Node 네이티브 TS strip은 `import type`으로 안 쓴 import는 값 import와 구분 못 해
// 그대로 남기는데, 이 스크립트는 Next.js 번들러 없이 plain Node로 도는 dev 도구라
// 실제 "next/server" 패키지의 ESM export map을 못 푼다(별개 next 자체 이슈). 이 값은
// 절대 호출되지 않으므로 바인딩만 채우는 더미로 대체한다.
export class NextResponse {}
