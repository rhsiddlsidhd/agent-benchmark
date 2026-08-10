export function newRedFailures(result, baseline) {
  if (result.environmentError || baseline.environmentError) throw new Error("environment/config/import/timeout errors are not Red proof");
  if (result.passed) throw new Error("changed tests did not fail");
  const existing = new Set(baseline.failedTests);
  const failures = result.failedTests.filter((id) => !existing.has(id));
  if (!failures.length) throw new Error("existing failures are not new Red proof");
  return [...new Set(failures)].sort();
}

export function assertGreen(result) {
  if (result.environmentError) throw new Error("environment/config/import/timeout errors are not Green proof");
  if (!result.passed) throw new Error("tests did not pass");
}
