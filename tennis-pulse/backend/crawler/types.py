"""테니스피플(tennispeople.kr) bbs_19 게시판 크롤링 도메인 타입."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date


class CrawlerError(Exception):
    """크롤링(요청/파싱/저장) 과정에서 발생하는 예외."""


@dataclass(frozen=True, slots=True)
class BoardPost:
    """bbs_19 게시판 목록에서 파싱한 게시글 메타데이터(본문 제외).

    is_pinned은 Supabase에 저장하지 않는 파싱 전용 필드다 — 상단 고정 공지 게시글은
    페이지 번호와 무관하게 모든 목록 페이지에 항상 다시 노출되므로, 증분 크롤링의
    "기존 idxno를 만나면 중단" 판단에서 제외하기 위해 필요하다.
    """

    idxno: int
    title: str
    author: str | None
    posted_at: date
    views: int
    is_pinned: bool
