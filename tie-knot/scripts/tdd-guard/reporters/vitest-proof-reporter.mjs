import fs from "node:fs";

export default class VitestProofReporter {
  constructor() { this.cases = []; }
  onTestCaseResult(testCase) {
    this.cases.push({ id: testCase.id, name: testCase.name, state: testCase.result().state, errors: testCase.result().errors?.map((error) => error.message) ?? [] });
  }
  onTestRunEnd() {
    if (process.env.TDD_PROOF_REPORT) fs.writeFileSync(process.env.TDD_PROOF_REPORT, JSON.stringify({ tests: this.cases }));
  }
}
