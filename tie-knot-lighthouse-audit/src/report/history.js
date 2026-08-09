const fs = require("fs/promises");
const path = require("path");

const HISTORY_PATH =
  process.env.LIGHTHOUSE_HISTORY_PATH ||
  path.join(__dirname, "../../../tie-knot/lighthouse-history.ndjson");

async function loadHistory() {
  try {
    const raw = await fs.readFile(HISTORY_PATH, "utf8");
    return raw
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));
  } catch (e) {
    if (e.code === "ENOENT") return [];
    throw e;
  }
}

function hasRecord(history, { commit, page, formFactor }) {
  return history.some(
    (r) =>
      r.commit === commit &&
      r.page === page &&
      r.formFactor === formFactor &&
      r.status !== "failed",
  );
}

async function saveHistory(history) {
  const content = history.map((record) => JSON.stringify(record)).join("\n") + "\n";
  await fs.writeFile(HISTORY_PATH, content, "utf8");
}

module.exports = { HISTORY_PATH, loadHistory, hasRecord, saveHistory };
