import path from "node:path";

const DEFAULT_EXCLUDES = [
  /(^|\/)docs?\//,
  /\.stories\.[jt]sx?$/,
  /\.d\.ts$/,
  /\.(css|scss|sass|less)$/,
  /(^|\/)(generated|__generated__)\//,
  /(^|\/)src\/test\/setup\//,
  /(^|\/)scripts\/e2e-server\.mjs$/,
  /(^|\/)scripts\/tdd-guard\/(?:claude-adapter|codex-adapter|index)\.mjs$/,
  /(^|\/)scripts\/tdd-guard\/reporters\//,
  /(^|\/)type\.ts$/,
  /(^|\/)(index)\.[jt]s$/,
  /(^|\/)(next|vitest|playwright|eslint|prettier)\.config\.[cm]?[jt]s$/,
];

export function normalizePath(file) {
  return file.split(path.sep).join("/").replace(/^\.\//, "");
}

export function isTestFile(file) {
  return /(?:^|\/)(?:e2e\/.*\.spec|.*\.(?:unit\.|integration\.)?test)\.(?:[jt]sx?|mjs)$/.test(
    normalizePath(file),
  );
}

export function classifyFile(file) {
  const normalized = normalizePath(file);
  if (isTestFile(normalized)) return { kind: "test", guarded: false };
  if (DEFAULT_EXCLUDES.some((pattern) => pattern.test(normalized))) {
    return { kind: "excluded", guarded: false };
  }
  if (/\.[cm]?[jt]sx?$/.test(normalized) && (normalized.startsWith("src/") || normalized.startsWith("scripts/"))) {
    return { kind: "product", guarded: true };
  }
  return { kind: "excluded", guarded: false };
}
