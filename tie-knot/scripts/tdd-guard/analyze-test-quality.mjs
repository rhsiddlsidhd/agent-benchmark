import fs from "node:fs";
import ts from "typescript";

const TEST_NAMES = new Set(["it", "test"]);

function callName(node) {
  if (ts.isIdentifier(node.expression)) return node.expression.text;
  if (ts.isPropertyAccessExpression(node.expression)) return node.expression.name.text;
  return "";
}

export function analyzeTestQuality(file) {
  const text = fs.readFileSync(file, "utf8");
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const errors = [];
  let tests = 0;
  let assertions = 0;
  let productImports = 0;
  let snapshots = 0;
  function bodyAssertions(body) {
    let count = 0;
    let snapshotCount = 0;
    const scan = (node) => {
      if (ts.isCallExpression(node)) {
        if (ts.isIdentifier(node.expression) && node.expression.text === "expect") count++;
        const name = callName(node);
        if (name === "toMatchSnapshot" || name === "toMatchInlineSnapshot") snapshotCount++;
      }
      ts.forEachChild(node, scan);
    };
    if (body) scan(body);
    return { count, snapshotCount };
  }
  const visit = (node) => {
    if (ts.isImportDeclaration(node) && typeof node.moduleSpecifier.text === "string" && (node.moduleSpecifier.text.startsWith("@/") || node.moduleSpecifier.text.startsWith("."))) productImports++;
    if (ts.isCallExpression(node)) {
      const name = callName(node);
      const skippedTest = ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) && TEST_NAMES.has(node.expression.expression.text) &&
        ["skip", "todo"].includes(node.expression.name.text);
      if (TEST_NAMES.has(name) || skippedTest) {
        tests++;
        const expression = node.expression;
        if (skippedTest || (ts.isPropertyAccessExpression(expression) && ["skip", "todo"].includes(expression.name.text))) errors.push("skip/todo test");
        const body = node.arguments.find((argument) =>
          ts.isArrowFunction(argument) || ts.isFunctionExpression(argument),
        );
        if (body && (ts.isArrowFunction(body) || ts.isFunctionExpression(body)) && ts.isBlock(body.body) && body.body.statements.length === 0) errors.push("empty test");
        const contract = body && (ts.isArrowFunction(body) || ts.isFunctionExpression(body)) ? bodyAssertions(body.body) : { count: 0, snapshotCount: 0 };
        if (!skippedTest && contract.count === 0) errors.push("test without assertion");
        if (contract.count > 0 && contract.count === contract.snapshotCount) errors.push("snapshot-only test");
      }
      if (name.startsWith("toMatchSnapshot") || name.startsWith("toMatchInlineSnapshot")) snapshots++;
      if (ts.isIdentifier(node.expression) && node.expression.text === "expect") {
        assertions++;
        const arg = node.arguments[0];
        if (arg && (arg.kind === ts.SyntaxKind.TrueKeyword || arg.kind === ts.SyntaxKind.FalseKeyword || ts.isNumericLiteral(arg) || ts.isStringLiteral(arg))) errors.push("constant assertion");
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (tests === 0) errors.push("zero tests");
  if (assertions === 0) errors.push("no assertions");
  if (productImports === 0) errors.push("not connected to product module");
  if (snapshots > 0 && snapshots === assertions) errors.push("snapshot-only test");
  return { valid: errors.length === 0, errors: [...new Set(errors)], tests, assertions, productImports };
}
