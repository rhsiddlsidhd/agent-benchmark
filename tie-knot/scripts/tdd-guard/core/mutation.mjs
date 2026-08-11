import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function sourceHash(root, targets) {
  return sha256(targets.map((target) => {
    const file = target.slice(0, target.lastIndexOf(":"));
    return `${target}\0${fs.readFileSync(path.join(root, file))}`;
  }).join("\0"));
}

export function mutationStatus(root) {
  const file = path.join(root, "reports", "mutation", "mutation.json");
  const proofFile = path.join(root, "reports", "mutation", "changed-proof.json");
  if (!fs.existsSync(proofFile)) return { proven: false, reason: "mutation proof missing" };
  const proof = JSON.parse(fs.readFileSync(proofFile, "utf8"));
  if (proof.sourceHash !== sourceHash(root, proof.targets ?? [])) return { proven: false, reason: "mutation source changed" };
  if (proof.status === "N/A") return { proven: true, status: "N/A", killed: 0, survived: 0 };
  if (!fs.existsSync(file)) return { proven: false, reason: "mutation report missing" };
  const reportText = fs.readFileSync(file, "utf8");
  if (proof.reportHash !== sha256(reportText)) return { proven: false, reason: "mutation report changed" };
  const report = JSON.parse(reportText);
  const mutants = Object.values(report.files ?? {}).flatMap((entry) => entry.mutants ?? []);
  const killed = mutants.filter((mutant) => mutant.status === "Killed");
  const survived = proof.surviving?.length ?? 0;
  return { proven: proof.status === "PASSED" && survived === 0, status: proof.status, killed: killed.length, survived };
}
