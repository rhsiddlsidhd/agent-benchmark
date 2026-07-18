const fs = require("fs/promises");
const path = require("path");

const HISTORY_PATH = path.join(__dirname, "../../lighthouse-history.json");

async function loadHistory() {
  try {
    const raw = await fs.readFile(HISTORY_PATH, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    if (e.code === "ENOENT") return [];
    throw e;
  }
}

function hasRecord(history, { commit, page, formFactor }) {
  return history.some(
    (r) => r.commit === commit && r.page === page && r.formFactor === formFactor,
  );
}

async function saveHistory(history) {
  await fs.writeFile(HISTORY_PATH, JSON.stringify(history, null, 2) + "\n", "utf8");
}

module.exports = { HISTORY_PATH, loadHistory, hasRecord, saveHistory };
