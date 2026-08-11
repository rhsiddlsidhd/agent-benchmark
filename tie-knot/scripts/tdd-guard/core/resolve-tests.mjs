import { buildTestGraph } from "../../test-scope/test-graph.mjs";

export function resolveTests(root, source) {
  return buildTestGraph(root).testsFor(source);
}

export function resolveSources(root, tests) {
  const graph = buildTestGraph(root);
  return [...new Set(tests.flatMap((test) => graph.sourcesFor(test)))].sort();
}
