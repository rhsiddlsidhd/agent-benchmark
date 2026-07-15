"""tennis-pulse 백엔드 크롤러 entrypoint.

로컬에서 수동 실행하는 배치 스크립트다(HTTP로 노출되지 않음).
판단/fallback 로직은 두지 않는다 — 로깅 후 crawler.service가 raise한 예외를 그대로 위로 전파한다.
"""

from __future__ import annotations

import logging
import os

from dotenv import load_dotenv
from supabase import Client, create_client

from crawler.service import run_crawl
from crawler.types import CrawlerError

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)


def _build_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise CrawlerError(
            "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다."
        )
    return create_client(url, key)


def main() -> None:
    load_dotenv()
    supabase = _build_supabase_client()
    try:
        run_crawl(supabase)
    except CrawlerError:
        logger.exception("크롤링 실패")
        raise


if __name__ == "__main__":
    main()
