// 사용자 입력을 $regex/RegExp에 그대로 넣으면 메타문자로 패턴 컴파일이 실패하거나
// 의도와 다른 매칭이 발생할 수 있다 — 리터럴 문자로 취급되도록 이스케이프한다.
export const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
