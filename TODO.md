# TODO

## 프로젝트 계획

- **프로젝트명: `tennis-pulse`** (검색량+게시글수로 관심도/화제성 측정한다는 의미)
- 형태: 웹앱
- 주제: 특정 주제 기반 트래픽량 + 특정 웹사이트 게시글 분석 차트 대시보드
- "트래픽" 의미 확정: 특정 주제 검색량 추세 (웹사이트 방문자수 아님)
- 데이터소스 후보 (공식 API만, 비공식 pytrends 제외)
  - 네이버 데이터랩 검색어트렌드 API — 무료, 승인 없이 즉시 사용, 상대지수(0~100), 일/주/월 단위
  - Google Trends API (alpha) — 공식이나 승인 대기 중, 현재 사용 불가
  - Google Ads API Keyword Planner — 무료, 단 광고비 지출 이력 없으면 검색량이 범위값으로만 나와 추세 그래프엔 부적합
- **결정: 트래픽(검색량) 데이터소스는 네이버 데이터랩 단독 사용**

## 게시글 분석 (테니스피플)

- 대상: tennispeople.kr, 공식 API 없음, robots.txt 없음(차단 규칙 없음)
- RSS(`/rss/allArticle.xml`) 검토했으나 최신 50개(약 4일치)만 제공 → 히스토리 분석엔 부적합, 제외
- **결정: `bbs/list.html?table=bbs_19` 게시판 크롤링**
  - 전체 7,305개 게시글, 2022-08-29~ 히스토리 확인
  - 페이지당 20행, 약 366페이지 순회 (`page=1..366`), 요청당 1~2초 딜레이
  - 파싱 필드: idxno, 제목, 작성자, 날짜, 조회수
  - **본문 상세페이지는 수집 제외 — 목록 메타데이터만 파싱** (제목 기반 빈도/추세 분석이 목적이라 본문 불필요)
  - 저장: SQLite/CSV, 예상 용량 1MB 미만
  - 분석 시점 기준(`new Date()`) 상대 구간 필터링(6개월 전/1년 전 등) 가능 — 날짜 필드 보유 확인됨

## 아키텍처

- 모노레포: `root/[프로젝트명]/backend`, `root/[프로젝트명]/frontend` — 폴더 분리
- DB: Supabase(Postgres/SQL) — 집계 쿼리(GROUP BY, top N, 기간 필터) 필요해서 Firebase(NoSQL)보다 적합
- 데이터 접근은 모두 Vercel 서버리스 함수 경유로 통일 (하단 "서버리스 함수 정리" 참고) — frontend가 Supabase를 직접 호출하지 않음
- 크롤러(Python)는 상시 서비스 아님 — 스케줄 실행(배치)만 필요
- **결정: 중복 방지는 idxno PK + UPSERT, 최초 1회 풀 크롤링(366페이지) 후 이후 증분 크롤링(최신 페이지부터 보다 기존 idxno 만나면 중단) 방식으로 설계**
- **보류: 주기적 스케줄링(cron/GitHub Actions 등) 실행 방식은 추후 결정**
- 초기 실행: 로컬에서 수동으로 풀 크롤링 스크립트 실행 → Supabase에 채워넣기
- **결정: 차트 라이브러리는 Recharts** (React 전용, 선언적 컴포넌트, 라인/바 차트 용도에 적합)
- **결정: frontend는 Next.js 대신 React(Vite) 단순 SPA**
  - 이유: SEO/SSR 불필요, 데이터 접근은 Vercel 서버리스 함수가 전담(Next.js API route 이점 못 살림)

### 데이터 축 구분 (2개, 성격 다름)

- **네이버 데이터랩**: 읽기 전용/무상태 프록시 — 상시 서버(FastAPI/Render) 대신 **Vercel Serverless Function**으로 제공 (호출당 과금, 무료 티어로 충분, 상시 유지 비용 없음)
- **테니스피플**: 크롤러는 1회/배치성 — Supabase에 영속 저장만 하면, 이후 조회는 Vercel 서버리스 함수(`/api/posts`)가 Supabase 조회해서 응답

### 배포/설정 구분

- **배포(코드 올림)**: frontend(React) + 서버리스 함수 2개(네이버 프록시, OpenAI 요약 프록시) → **Vercel 단일 플랫폼**
- **설정만(코드 없음)**: Supabase — 콘솔에서 프로젝트/테이블 생성, API 키 발급으로 끝
- **결정: FastAPI/Render 백엔드 서버 제거** — 상시 서버 유지비용 회피 목적, 무료 티어 우선. backend 폴더엔 크롤러 스크립트(Python)만 남고 상시 배포 대상 아님

### 서버리스 함수 정리 (모든 데이터 접근을 서버리스 함수 경유로 통일)

- **게시글/트래픽 원본 조회**: `/api/posts` 등 — frontend가 Supabase SDK로 직접 쿼리하지 않고, 이 함수를 경유 (함수 내부에서 Supabase 조회 후 응답). secret 노출 여부와 무관하게 **접근 경로 일관성** 위해 통일
- **네이버 데이터랩 프록시**: `/api/naver-trend` 등, client_secret 노출 방지
- **OpenAI 요약 프록시**: `/api/summary` 등, client가 요청하면 함수가 Supabase에서 date+title 조회 → OpenAI API 호출 → 요약 결과 반환. API 키 노출 방지
- **결정: 세 서버리스 함수 모두 Node/TS로 통일** — OpenAI 호출은 단순 HTTP 요청이라 Python 이점 없음 (원본 date+title 그대로 LLM에 전달하는 구조라 별도 형태소분석 전처리 없음)

### DB 스키마 (초안, 최종 확정 아님)

- `posts` 테이블 필드 초안: `idxno(PK)`, `title`, `author(nullable)`, `posted_at`, `views`, `created_at`
- **이건 논리적 계약(frontend가 기대할 필드)일 뿐, 정확한 타입/제약/인덱스 등 물리적 스키마는 backend 전문 에이전트가 harness 구축 후 실제 스크래핑 샘플 데이터 검증하며 최종 결정**

## 게시글 분석 Summary (LLM)

- 입력: 필요 기간만 잘라서 전달 (3개월~6개월 단위), date+title 쌍
- Claude Pro 구독 우회 스크립트 방식은 검토 안 함 (이용약관 위반 소지로 배제)
- **결정: OpenAI API 사용**
- Claude API 기준 조사(모델/가격/컨텍스트윈도우/배치 전략)는 참고용으로 보류, OpenAI 기준으로 별도 조사 필요
