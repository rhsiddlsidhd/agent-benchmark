const HASH_KEYS = ["head", "productHash", "testHash", "configHash", "sessionBinding"];

export function proofValidity(proof, current) {
  if (!proof) return { valid: false, state: current.tests.length ? "TEST_CHANGED" : "CLEAN", reason: "proof missing" };
  for (const key of HASH_KEYS) {
    if (proof[key] !== current[key]) return { valid: false, state: current.tests.length ? "TEST_CHANGED" : "CLEAN", reason: `${key} changed` };
  }
  return { valid: true, state: proof.state, proof };
}

export function redProof(current, { scope, sessionId, failedTestIds, allowedProductFiles, createdAt }) {
  const previousRed = current.previous?.redScopes ?? [];
  return {
    ...current,
    previous: undefined,
    sessionId,
    state: `RED_PROVEN[${scope}]`,
    redScopes: [...new Set([...previousRed, scope])].sort(),
    greenScopes: [],
    testIds: [...new Set(failedTestIds)].sort(),
    allowedProductFiles: [...new Set(allowedProductFiles)].sort(),
    createdAt,
  };
}

export function implementingProof(proof, current) {
  return { ...proof, state: "IMPLEMENTING", product: current.product, productHash: current.productHash };
}

export function greenProof(previous, current, scope, createdAt) {
  if (!previous?.redScopes?.includes(scope)) throw new Error(`RED_PROVEN[${scope}] required`);
  if (previous.testHash !== current.testHash || previous.head !== current.head || previous.configHash !== current.configHash) throw new Error("Red proof invalidated");
  const greenScopes = [...new Set([...(previous.greenScopes ?? []), scope])].sort();
  return { ...previous, ...current, state: `GREEN_PROVEN[${scope}]`, redScopes: previous.redScopes, greenScopes, allowedProductFiles: previous.allowedProductFiles, testIds: previous.testIds, createdAt };
}

export function mutationProof(previous, mutation, createdAt) {
  if (!mutation.proven) throw new Error("survived mutant or missing mutation report");
  if (!previous.requiredScopes.every((scope) => previous.greenScopes.includes(scope))) throw new Error("all required scopes need Green proof");
  return { ...previous, state: "MUTATION_PROVEN", mutation, mutationAt: createdAt };
}

export function verifiedProof(previous, createdAt) {
  if (previous.state !== "MUTATION_PROVEN") throw new Error("MUTATION_PROVEN required");
  return { ...previous, state: "VERIFIED", verifiedAt: createdAt };
}
