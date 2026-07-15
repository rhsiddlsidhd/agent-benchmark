# ADR (Architecture Decision Records)

> 형식: Nygard-style short-form (single-file log)
> 새 결정 추가 시 아래 "Log" 최상단에 다음 번호로 항목 추가 (역순 정렬, 최신이 위)

---

## 필드 가이드

| 필드 | 내용 |
|------|------|
| Context | 왜 이 결정 필요한가, 어떤 문제 상황인가 |
| Decision | 무엇을 결정했나, 왜 이걸 선택했나 |
| Consequences | 이 결정으로 무엇이 바뀌는가 (트레이드오프, 후속 작업, 리스크 포함) |

---

## Index

| ID | 제목 | 상태 | 날짜 |
|----|------|------|------|
| ADR-0009 | LLM 요약은 OpenAI API 사용 | Accepted | |
| ADR-0008 | /api/posts와 /api/summary는 route 분리, service 레이어 공유 | Accepted | |
| ADR-0007 | 서버리스 함수 3종 모두 Node/TS로 통일 | Accepted | |
| ADR-0006 | FastAPI/Render 상시 백엔드 서버 제거, Vercel 서버리스로 통일 | Accepted | |
| ADR-0005 | frontend는 Next.js 대신 React(Vite) SPA | Accepted | |
| ADR-0004 | 차트 라이브러리는 Recharts | Accepted | |
| ADR-0003 | 크롤러 중복 방지: idxno PK + UPSERT, 풀 크롤링 후 증분 크롤링 | Accepted | |
| ADR-0002 | 테니스피플 게시글 수집은 bbs_19 게시판 목록 크롤링, 본문 제외 | Accepted | |
| ADR-0001 | 트래픽(검색량) 데이터소스는 네이버 데이터랩 단독 사용 | Accepted | |

---

## Log

### ADR-0009: LLM 요약은 OpenAI API 사용

> 상태: Accepted
> 날짜:

**Context**

게시글 date+title을 기간 단위(3~6개월)로 잘라 LLM에 전달해 요약하려 함. Claude Pro 구독을 API처럼 우회하는 스크립트 방식도 검토 대상이었음.

**Decision**

OpenAI API를 사용한다. Claude Pro 구독 우회 스크립트 방식은 이용약관 위반 소지가 있어 배제한다.

**Consequences**

- Claude API 기준 조사(모델/가격/컨텍스트윈도우/배치 전략)는 참고용으로 보류하고, OpenAI 기준으로 별도 조사가 필요하다.
- OpenAI API 키 노출 방지를 위해 `/api/summary` 서버리스 함수 경유가 필수가 된다.

---

### ADR-0008: /api/posts와 /api/summary는 route 분리, service 레이어 공유

> 상태: Accepted
> 날짜:

**Context**

posts 조회 로직이 `/api/posts`(프론트 게시글 분석 차트/리스트용)와 `/api/summary`(OpenAI 요약용 date+title 조회)에서 중복될 수 있는 상황.

**Decision**

route는 분리 유지하되, posts 조회 로직은 service 레이어로 공유한다. `/api/posts`는 원본 필드 전체를 노출하고, `/api/summary`는 내부적으로 같은 service 함수를 호출해 date+title만 select한다.

**Consequences**

- route 분리 이유: 응답 shape(리스트 vs 요약 텍스트)와 비용/트리거 빈도(DB 읽기 vs OpenAI 과금)가 서로 다름.
- 쿼리 로직 자체의 중복은 service 공유로 방지된다.

---

### ADR-0007: 서버리스 함수 3종 모두 Node/TS로 통일

> 상태: Accepted
> 날짜:

**Context**

`/api/posts`, `/api/naver-trend`, `/api/summary` 세 서버리스 함수의 구현 언어를 정해야 함.

**Decision**

세 함수 모두 Node/TS로 통일한다. OpenAI 호출은 단순 HTTP 요청이라 Python을 쓸 이점이 없다 — 원본 date+title을 그대로 LLM에 전달하는 구조라 별도 형태소분석 전처리가 없기 때문.

**Consequences**

- backend 폴더의 Python은 크롤러 전용으로 역할이 명확히 분리된다.
- 서버리스 함수 개발/배포 도구체인이 단일 언어로 단순화된다.

---

### ADR-0006: FastAPI/Render 상시 백엔드 서버 제거, Vercel 서버리스로 통일

> 상태: Accepted
> 날짜:

**Context**

네이버 데이터랩 프록시, posts 조회, OpenAI 요약 등 데이터 접근 로직을 상시 서버(FastAPI/Render)로 둘지 서버리스로 둘지 결정 필요.

**Decision**

FastAPI/Render 백엔드 서버를 제거한다. 상시 서버 유지비용을 회피하고 무료 티어를 우선한다. `backend` 폴더엔 크롤러 스크립트(Python)만 남고 상시 배포 대상이 아니다.

**Consequences**

- 네이버 데이터랩(무상태 프록시)과 테니스피플(1회/배치성 크롤러+조회) 두 데이터 축 모두 Vercel 서버리스 함수로 제공된다.
- 배포 대상은 frontend + 서버리스 함수로 축소되고, Supabase는 설정만 필요(코드 배포 없음)하다.

---

### ADR-0005: frontend는 Next.js 대신 React(Vite) SPA

> 상태: Accepted
> 날짜:

**Context**

frontend 프레임워크 선택. Next.js는 SSR/API route 이점이 있으나 이 프로젝트에 필요한지 검토.

**Decision**

React(Vite) 단순 SPA를 사용한다. SEO/SSR이 불필요하고, 데이터 접근은 Vercel 서버리스 함수가 전담하므로 Next.js API route의 이점을 살릴 수 없다.

**Consequences**

- 라우팅/데이터 페칭을 Next.js 컨벤션 없이 직접 구성해야 한다.
- 빌드/배포는 정적 SPA + 서버리스 함수 조합으로 단순화된다.

---

### ADR-0004: 차트 라이브러리는 Recharts

> 상태: Accepted
> 날짜:

**Context**

검색량 추세, 게시글 수 추이 등을 라인/바 차트로 시각화해야 함.

**Decision**

Recharts를 사용한다. React 전용이며 선언적 컴포넌트 방식이라 라인/바 차트 용도에 적합하다.

**Consequences**

- 차트 컴포넌트는 React 컴포넌트 트리 내에서 선언적으로 구성된다.

---

### ADR-0003: 크롤러 중복 방지 — idxno PK + UPSERT, 풀 크롤링 후 증분 크롤링

> 상태: Accepted
> 날짜:

**Context**

테니스피플 게시글은 총 7,305개(2022-08-29~), 약 366페이지. 최초 수집 이후 재수집 시 중복을 방지할 방법이 필요.

**Decision**

idxno를 PK로 하고 UPSERT로 중복을 방지한다. 최초 1회 풀 크롤링(366페이지) 후, 이후엔 증분 크롤링(최신 페이지부터 순회하다 기존 idxno를 만나면 중단)한다.

**Consequences**

- 초기 실행은 로컬에서 수동으로 풀 크롤링 스크립트를 실행해 Supabase에 채워넣는다.
- 주기적 스케줄링(cron/GitHub Actions 등) 실행 방식은 별도로 보류, 추후 결정한다.

---

### ADR-0002: 테니스피플 게시글 수집은 bbs_19 게시판 목록 크롤링, 본문 제외

> 상태: Accepted
> 날짜:

**Context**

tennispeople.kr은 공식 API가 없고 robots.txt(차단 규칙)도 없음. RSS(`/rss/allArticle.xml`)는 최신 50개(약 4일치)만 제공해 히스토리 분석엔 부적합함이 확인됨.

**Decision**

`bbs/list.html?table=bbs_19` 게시판을 직접 크롤링한다(전체 7,305개, 2022-08-29~ 히스토리 확인, 페이지당 20행 약 366페이지, 요청당 1~2초 딜레이). 파싱 필드는 idxno/제목/작성자/날짜/조회수이며, 본문 상세페이지는 수집 제외하고 목록 메타데이터만 파싱한다.

**Consequences**

- 제목 기반 빈도/추세 분석이 목적이므로 본문 수집은 불필요하다고 판단.
- 저장은 SQLite/CSV 검토 기준 1MB 미만 예상(최종 저장소는 Supabase).
- 날짜 필드 보유가 확인되어 분석 시점(`new Date()`) 기준 상대 구간 필터링(6개월 전/1년 전 등)이 가능하다.

---

### ADR-0001: 트래픽(검색량) 데이터소스는 네이버 데이터랩 단독 사용

> 상태: Accepted
> 날짜:

**Context**

"트래픽"을 특정 주제 검색량 추세(웹사이트 방문자수 아님)로 정의. 공식 API만 검토 대상(비공식 pytrends 제외). 후보는 네이버 데이터랩 검색어트렌드 API, Google Trends API(alpha), Google Ads API Keyword Planner였음.

**Decision**

네이버 데이터랩 검색어트렌드 API를 단독 사용한다. 무료, 승인 없이 즉시 사용 가능, 상대지수(0~100)로 일/주/월 단위 제공.

**Consequences**

- Google Trends API(alpha)는 공식이나 현재 승인 대기 중이라 사용 불가 — 추후 승인되면 재검토 여지가 있음.
- Google Ads API Keyword Planner는 광고비 지출 이력이 없으면 검색량이 범위값으로만 나와 추세 그래프에 부적합해 제외됨.
- 네이버 데이터랩은 절대 검색량이 아닌 상대지수만 제공한다는 제약을 감안해야 함.

---
