const CATEGORY_KEYS = ["performance", "accessibility", "best-practices", "seo"];

const WEB_VITAL_AUDITS = {
  lcp: "largest-contentful-paint",
  fcp: "first-contentful-paint",
  tbt: "total-blocking-time",
  cls: "cumulative-layout-shift",
  speedIndex: "speed-index",
};

/** 단일 lhr에서 카테고리 스코어(0~1) + Core Web Vitals 원시값만 뽑는다. */
function extractFromLhr(lhr) {
  const scores = {};
  for (const key of CATEGORY_KEYS) {
    scores[key] = lhr.categories[key] ? lhr.categories[key].score : null;
  }

  const webVitals = {};
  for (const [metricKey, auditId] of Object.entries(WEB_VITAL_AUDITS)) {
    const audit = lhr.audits[auditId];
    webVitals[metricKey] = audit ? audit.numericValue : null;
  }

  return { scores, webVitals };
}

function median(numbers) {
  const valid = numbers.filter((n) => typeof n === "number" && !Number.isNaN(n));
  if (!valid.length) return null;
  const sorted = [...valid].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** 여러 번(runs) 감사한 lhr 배열을 받아 지표별 median으로 합친다. */
function medianOfRuns(lhrList) {
  const extracted = lhrList.map(extractFromLhr);

  const scores = {};
  for (const key of CATEGORY_KEYS) {
    scores[key] = median(extracted.map((e) => e.scores[key]));
  }

  const webVitals = {};
  for (const metricKey of Object.keys(WEB_VITAL_AUDITS)) {
    webVitals[metricKey] = median(extracted.map((e) => e.webVitals[metricKey]));
  }

  return { scores, webVitals };
}

module.exports = { extractFromLhr, medianOfRuns };
