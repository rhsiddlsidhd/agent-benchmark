import Link from "next/link";
import { PersonAvatar } from "@/src/components/ui";
import type { PersonSearchResult } from "@/src/lib/tmdb/types";
import { knownForLabel } from "../_utils";

/** 인물 검색 결과 카드 — PersonAvatar 를 상세 링크로 감싼다(§3.2). */
export function PersonResultCard({ person }: { person: PersonSearchResult }) {
  return (
    <Link
      href={`/person/${person.id}`}
      aria-label={person.name}
      className="block rounded-lg"
    >
      <PersonAvatar
        path={person.profile_path}
        name={person.name}
        role={knownForLabel(person)}
      />
    </Link>
  );
}
