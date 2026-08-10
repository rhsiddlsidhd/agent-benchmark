import fs from "node:fs";
import path from "node:path";

export function mutationStatus(root) {
  const file = path.join(root, "reports", "mutation", "mutation.json");
  if (!fs.existsSync(file)) return { proven: false, reason: "mutation report missing" };
  const report = JSON.parse(fs.readFileSync(file, "utf8"));
  const mutants = Object.values(report.files ?? {}).flatMap((entry) => entry.mutants ?? []);
  const survived = mutants.filter((mutant) => mutant.status === "Survived");
  const killed = mutants.filter((mutant) => mutant.status === "Killed");
  return { proven: killed.length > 0 && survived.length === 0, killed: killed.length, survived: survived.length };
}
