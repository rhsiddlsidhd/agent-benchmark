const fs = require("fs");
const path = require("path");

// NaN(커버 안 된 파일)을 가장 낮은 점수로 취급해 정렬 시 최상단에 오도록 함
function normalizedScore(metrics) {
  return Number.isNaN(metrics.mutationScore) ? -1 : metrics.mutationScore;
}

// root(systemUnderTestMetrics)의 이름은 "All files" 고정값이라 경로에서 제외하고 자식부터 순회함
function collectFileResults(root) {
  const acc = [];
  for (const child of root.childResults) {
    walkFileResults(child, "", acc);
  }
  return acc;
}

function walkFileResults(node, prefix, acc) {
  const filePath = prefix ? `${prefix}/${node.name}` : node.name;

  if (node.childResults.length === 0) {
    acc.push({ path: filePath, metrics: node.metrics });
  } else {
    for (const child of node.childResults) {
      walkFileResults(child, filePath, acc);
    }
  }
}

module.exports = async ({ github, context }) => {
  const reportPath = path.join(
    process.env.GITHUB_WORKSPACE,
    "tie-knot/reports/mutation/mutation.json",
  );

  if (!fs.existsSync(reportPath)) {
    console.log("mutation.json 없음 — mutate 대상 파일 없거나 실행 실패, comment 스킵");
    return;
  }

  const report = JSON.parse(fs.readFileSync(reportPath, "utf-8"));

  const metricsModulePath = path.join(
    process.env.GITHUB_WORKSPACE,
    "tie-knot/node_modules/mutation-testing-metrics/dist/src/index.js",
  );
  const { calculateMutationTestMetrics } = await import(
    "file://" + metricsModulePath
  );

  const { systemUnderTestMetrics } = calculateMutationTestMetrics(report);
  const score = systemUnderTestMetrics.metrics.mutationScore;
  const scoreText = Number.isNaN(score) ? "N/A" : score.toFixed(1);

  const fileResults = collectFileResults(systemUnderTestMetrics);
  const worstFiles = [...fileResults]
    .sort((a, b) => normalizedScore(a.metrics) - normalizedScore(b.metrics))
    .slice(0, 10);

  const marker = "<!-- stryker-mutation-report -->";
  let body = `${marker}\n### 🧬 Mutation Test Score: **${scoreText}%**`;

  if (worstFiles.length > 0) {
    const rows = worstFiles.map(({ path: filePath, metrics }) => {
      const fileScore = Number.isNaN(metrics.mutationScore)
        ? "N/A"
        : `${metrics.mutationScore.toFixed(1)}%`;
      return `| ${filePath} | ${fileScore} | ${metrics.killed} | ${metrics.survived} | ${metrics.noCoverage} |`;
    });

    body += [
      "",
      "",
      "<details><summary>파일별 점수 낮은 순 (최대 10개)</summary>",
      "",
      "| File | Score | Killed | Survived | No Coverage |",
      "|---|---|---|---|---|",
      ...rows,
      "",
      "</details>",
    ].join("\n");
  }

  const { data: comments } = await github.rest.issues.listComments({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
  });

  const existing = comments.find((c) => c.body?.includes(marker));

  if (existing) {
    await github.rest.issues.updateComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      comment_id: existing.id,
      body,
    });
  } else {
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number,
      body,
    });
  }
};
