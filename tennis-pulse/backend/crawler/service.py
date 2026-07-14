"""테니스피플(tennispeople.kr) bbs_19 게시판 목록 크롤링 서비스.

순수 파싱 로직과 외부 I/O(HTTP 요청, Supabase 저장)를 함께 다루는 시스템 경계 레이어.
실패 시 구체 예외(CrawlerError)를 raise한다 — 삼키거나 broad exception으로 덮지 않는다.

URL 패턴/HTML 구조는 실제 사이트(http://www.tennispeople.kr/bbs/list.html?table=bbs_19)를
직접 요청해 확인했다:
- 목록 URL: table=bbs_19 & page={n} 두 파라미터만으로 충분(total 파라미터는 페이지네이션
  표시용일 뿐 목록 내용에 영향 없음을 확인)
- 응답 인코딩: euc-kr 선언(meta charset) — 확장 한글 대비 cp949로 디코딩
- 목록 행(<tr>)의 <td>가 정상적으로 닫히지 않는 마크업 오류가 있어(사이트 원본 결함)
  BeautifulSoup(html.parser)의 트리 구조 기반 파싱이 실패함을 실측 확인 — 대신 각 필드를
  <font color="#333333"> 라벨과 값 포맷(날짜 \\d{4}-\\d{2}-\\d{2})으로 순서 앵커링하는
  정규식으로 파싱한다
- 상단 고정 공지 게시글(관리자 공지 등)은 page 값과 무관하게 모든 목록 페이지(마지막 페이지
  이후 out-of-range page 포함)에 항상 재노출됨을 실측 확인 — 목록 종료 판단은 "행이 0개"가
  아니라 "고정 공지가 아닌 일반 게시글이 0개"를 기준으로 해야 함
"""

from __future__ import annotations

import html
import logging
import random
import re
import time

import requests
from postgrest.exceptions import APIError as PostgrestAPIError
from supabase import Client

from crawler.types import BoardPost, CrawlerError
from datetime import date as date_

logger = logging.getLogger(__name__)

_LIST_URL = "http://www.tennispeople.kr/bbs/list.html"
_BOARD_TABLE = "bbs_19"
_RESPONSE_ENCODING = "cp949"
_REQUEST_TIMEOUT_SECONDS = 10
_REQUEST_DELAY_RANGE_SECONDS = (1.0, 2.0)
_REQUEST_HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; tennis-pulse-crawler/1.0)"}

_TABLE_NAME = "posts"
_SUPABASE_PAGE_SIZE = 1000

_ROW_RE = re.compile(r"<tr\b[^>]*>.*?</tr>", re.DOTALL)
_FIELDS_RE = re.compile(
    r'<a href="list\.html\?table=' + re.escape(_BOARD_TABLE) + r'&idxno=(?P<idxno>\d+)[^"]*">'
    r"(?:<font[^>]*>)?(?P<title>.*?)(?:</font>)?</a>"
    r'.*?<font color="#333333">(?P<author>[^<]*)</font>'
    r'.*?<font color="#333333">(?P<date>\d{4}-\d{2}-\d{2})</font>'
    r'.*?<font color="#333333">(?P<views>[\d,]*)</font>',
    re.DOTALL,
)
# 일반 행의 첫 컬럼(페이지 내 순번)은 <font color="#333333">숫자</font>로 렌더링되지만,
# 상단 고정 공지 행은 이 자리에 아이콘 이미지가 들어가고 숫자 폰트가 없다 — 이 차이로
# "고정 공지 여부"를 구분한다.
_SEQ_NUMBER_RE = re.compile(r'<font color="#333333">(\d+)</font>')


def fetch_list_page(session: requests.Session, page: int) -> str:
    """bbs_19 목록 page 페이지를 요청해 디코딩된 HTML 문자열을 반환한다."""
    try:
        response = session.get(
            _LIST_URL,
            params={"table": _BOARD_TABLE, "page": page},
            headers=_REQUEST_HEADERS,
            timeout=_REQUEST_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise CrawlerError(f"{_BOARD_TABLE} 목록 page={page} 요청 실패") from exc
    response.encoding = _RESPONSE_ENCODING
    return response.text


def parse_list_page(html_content: str) -> list[BoardPost]:
    """목록 HTML에서 게시글 메타데이터(idxno/제목/작성자/날짜/조회수)를 파싱한다."""
    posts: list[BoardPost] = []
    for row_match in _ROW_RE.finditer(html_content):
        row = row_match.group(0)
        field_match = _FIELDS_RE.search(row)
        if field_match is None:
            continue

        prefix = row[: field_match.start()]
        is_pinned = _SEQ_NUMBER_RE.search(prefix) is None

        raw_title = field_match.group("title")
        title = html.unescape(re.sub(r"<[^>]+>", "", raw_title)).strip()

        raw_author = html.unescape(field_match.group("author")).strip()
        author = raw_author or None

        raw_views = field_match.group("views").replace(",", "")
        views = int(raw_views) if raw_views else 0

        posts.append(
            BoardPost(
                idxno=int(field_match.group("idxno")),
                title=title,
                author=author,
                posted_at=date_.fromisoformat(field_match.group("date")),
                views=views,
                is_pinned=is_pinned,
            )
        )
    return posts


def get_existing_idxnos(supabase: Client) -> set[int]:
    """Supabase `posts` 테이블에 이미 저장된 idxno 전체를 조회한다."""
    idxnos: set[int] = set()
    offset = 0
    while True:
        try:
            result = (
                supabase.table(_TABLE_NAME)
                .select("idxno")
                .range(offset, offset + _SUPABASE_PAGE_SIZE - 1)
                .execute()
            )
        except PostgrestAPIError as exc:
            raise CrawlerError("기존 idxno 조회 실패") from exc
        rows = result.data
        idxnos.update(row["idxno"] for row in rows)
        if len(rows) < _SUPABASE_PAGE_SIZE:
            break
        offset += _SUPABASE_PAGE_SIZE
    return idxnos


def upsert_posts(supabase: Client, posts: list[BoardPost]) -> None:
    """게시글 목록을 idxno 기준 UPSERT로 저장한다."""
    if not posts:
        return
    payload = [
        {
            "idxno": post.idxno,
            "title": post.title,
            "author": post.author,
            "posted_at": post.posted_at.isoformat(),
            "views": post.views,
        }
        for post in posts
    ]
    try:
        supabase.table(_TABLE_NAME).upsert(payload, on_conflict="idxno").execute()
    except PostgrestAPIError as exc:
        raise CrawlerError(f"{len(posts)}건 upsert 실패") from exc


def run_crawl(supabase: Client) -> None:
    """기존 저장 게시글 유무에 따라 풀 크롤링/증분 크롤링을 선택해 실행한다."""
    existing_idxnos = get_existing_idxnos(supabase)
    session = requests.Session()
    if existing_idxnos:
        logger.info("기존 게시글 %d건 확인 — 증분 크롤링 시작", len(existing_idxnos))
        _crawl_incremental(session, supabase, existing_idxnos)
    else:
        logger.info("기존 게시글 없음 — 풀 크롤링 시작")
        _crawl_full(session, supabase)


def _has_regular_post(posts: list[BoardPost]) -> bool:
    return any(not post.is_pinned for post in posts)


def _crawl_full(session: requests.Session, supabase: Client) -> None:
    page = 1
    total_upserted = 0
    while True:
        posts = parse_list_page(fetch_list_page(session, page))
        if not _has_regular_post(posts):
            logger.info("page=%d에 일반 게시글 없음 — 풀 크롤링 종료", page)
            break

        upsert_posts(supabase, posts)
        total_upserted += len(posts)
        logger.info("page=%d 완료 — %d건 upsert (누적 %d건)", page, len(posts), total_upserted)

        page += 1
        time.sleep(random.uniform(*_REQUEST_DELAY_RANGE_SECONDS))

    logger.info("풀 크롤링 종료 — %d page, %d건 upsert", page - 1, total_upserted)


def _crawl_incremental(
    session: requests.Session, supabase: Client, existing_idxnos: set[int]
) -> None:
    page = 1
    total_upserted = 0
    while True:
        posts = parse_list_page(fetch_list_page(session, page))
        if not _has_regular_post(posts):
            logger.info("page=%d에 일반 게시글 없음 — 증분 크롤링 종료", page)
            break

        new_posts: list[BoardPost] = []
        reached_known = False
        for post in posts:
            if not post.is_pinned and post.idxno in existing_idxnos:
                reached_known = True
                break
            new_posts.append(post)

        if new_posts:
            upsert_posts(supabase, new_posts)
            total_upserted += len(new_posts)
            logger.info(
                "page=%d 신규 %d건 upsert (누적 %d건)", page, len(new_posts), total_upserted
            )

        if reached_known:
            logger.info("기존 idxno 도달 — 증분 크롤링 종료 (page=%d)", page)
            break

        page += 1
        time.sleep(random.uniform(*_REQUEST_DELAY_RANGE_SECONDS))

    logger.info("증분 크롤링 종료 — %d건 upsert", total_upserted)
