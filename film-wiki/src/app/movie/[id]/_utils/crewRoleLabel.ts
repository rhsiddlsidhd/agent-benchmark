import { JOB_LABELS } from "../_constants";

/** 병합된 직무 목록 → 한국어 역할 라벨("감독 · 각본" 등, 중복 제거). */
export function crewRoleLabel(jobs: string[]): string {
  const labels: string[] = [];
  for (const job of jobs) {
    const label = JOB_LABELS[job] ?? job;
    if (!labels.includes(label)) {
      labels.push(label);
    }
  }
  return labels.join(" · ");
}
