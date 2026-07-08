"use client";

/**
 * AdultContentProvider — 성인 콘텐츠 토글 전역 상태 (FR-7 / 01_ARCHITECTURE §9 / 03_DESIGN §2.4).
 *
 * 경계선 결정(planner): 토글 상태 공유는 **React Context + URL searchParams 동기화**로
 * 처리한다. 서버 렌더 페이지(홈/상세)까지 반영할 필요는 없고, `include_adult` 는 검색
 * (T5/T6)·디스커버(T11/T12)의 Route Handler 요청에만 영향을 준다. 따라서:
 *
 * - 상태는 이 Client Context 가 소유하고, 헤더(RootLayout)와 검색 페이지의 두 AdultToggle
 *   이 동일 Context 를 구독한다 — 한쪽을 켜면 다른 쪽도 즉시 반영된다.
 * - 값은 훅(useSearchInfinite/useDiscoverInfinite)의 queryKey 에 포함되어 TanStack Query 가
 *   자동으로 새 키로 재조회한다(별도 invalidateQueries 없이 전환 즉시 결과 반영).
 * - `include_adult` 자체는 **서버사이드/Route Handler 에서만** TMDB 에 전달된다(§9).
 *   이 컨텍스트는 키를 알지 않는다(ADR-0003).
 *
 * 구현 노트 — 왜 useState+effect 가 아니라 useSyncExternalStore 인가:
 * - 초기값은 URL(`?adult=1`)에서 복원해야 하는데, 이는 브라우저 전용 상태다. useState 로
 *   서버 렌더 후 effect 에서 setState 하면 (a) hydration 불일치 위험, (b) React 19 의
 *   `react-hooks/set-state-in-effect` 경고를 유발한다.
 * - 대신 모듈 스코프 스토어를 useSyncExternalStore 로 구독한다. getServerSnapshot 은 항상
 *   false 를 반환(SSR·하이드레이션 안전), 클라이언트에서는 최초 getSnapshot 이 URL 에서 한
 *   번 시드한다. 스토어가 모듈 스코프라 값이 클라이언트 네비게이션(Link 이동) 사이에도
 *   메모리에 유지되고, 전체 새로고침 시에만 URL 에서 다시 시드된다.
 *
 * URL 동기화(새로고침·링크 공유 시 유지):
 * - 값 변경 시 `?adult=1` 을 URL 에 병합/제거한다. RootLayout 수준의 공유 컴포넌트에서
 *   `useSearchParams` 를 쓰면 앱 전체가 CSR bailout(Suspense 요구)돼 정적 페이지가
 *   깨지므로, `history.replaceState` 기반 얕은 갱신을 쓴다(discover-explorer 와 동일 패턴).
 *   서버 라운드트립이 없어 정적 홈/상세 페이지의 프리렌더를 해치지 않는다.
 * - `usePathname` 으로 경로 변경도 감지해 새 경로의 URL 에도 현재 값을 반영한다
 *   (toggle 없이 Link 이동만 해도 이전 경로에만 남아있던 `?adult=1` 이 새 경로에서
 *   사라지는 문제 방지). `usePathname` 은 `useSearchParams` 와 달리 정적 렌더링에
 *   CSR bailout 을 강제하지 않는다.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

/** URL 에 상태를 표기하는 쿼리 파라미터 키와 "켜짐" 값. */
const ADULT_PARAM = "adult";
const ADULT_ON_VALUE = "1";

interface AdultContentContextValue {
  /** 성인 콘텐츠 포함 여부(= TMDB include_adult). 기본 false. */
  includeAdult: boolean;
  /** 명시적으로 값을 설정한다(URL 동기화 포함). */
  setIncludeAdult: (next: boolean) => void;
  /** 현재 값을 반전한다(토글 클릭). */
  toggle: () => void;
}

const AdultContentContext = createContext<AdultContentContextValue | null>(null);

/** 현재 URL 의 검색 문자열에서 adult 파라미터가 켜져 있는지 판정한다(클라이언트 전용). */
function readAdultFromUrl(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get(ADULT_PARAM) === ADULT_ON_VALUE;
}

/**
 * 현재 URL 의 다른 파라미터(discover 의 type/genres 등)를 보존한 채 adult 파라미터만
 * 병합/제거해 얕게 갱신한다. 서버 네비게이션이 아니므로 진행 중인 상태를 유지한다.
 */
function syncAdultToUrl(next: boolean): void {
  const params = new URLSearchParams(window.location.search);
  if (next) {
    params.set(ADULT_PARAM, ADULT_ON_VALUE);
  } else {
    params.delete(ADULT_PARAM);
  }
  const queryString = params.toString();
  const url = queryString ? `?${queryString}` : window.location.pathname;
  window.history.replaceState(null, "", url);
}

/**
 * 모듈 스코프 외부 스토어. 값은 클라이언트 네비게이션 사이에도 메모리에 유지되고,
 * 최초 접근 시 URL 에서 한 번 시드된다(전체 새로고침 시 URL 기준으로 재시드).
 */
let storeValue: boolean | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): boolean {
  if (storeValue === null) {
    // 최초 클라이언트 읽기에서 URL 로 시드(하이드레이션 이후에만 호출됨).
    storeValue = readAdultFromUrl();
  }
  return storeValue;
}

/** SSR·하이드레이션에서는 항상 false — 첫 렌더 불일치를 만들지 않는다. */
function getServerSnapshot(): boolean {
  return false;
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function setStoreValue(next: boolean): void {
  if (storeValue === next) {
    return;
  }
  storeValue = next;
  syncAdultToUrl(next);
  for (const listener of listeners) {
    listener();
  }
}

export function AdultContentProvider({ children }: { children: ReactNode }) {
  const includeAdult = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const pathname = usePathname();

  // 클라이언트 네비게이션으로 경로가 바뀌면 새 경로의 URL 에도 현재 값을 반영한다.
  // syncAdultToUrl 자체는 값이 바뀔 때만 호출되므로(toggle), 값 변경 없이 경로만
  // 바뀌는 경우 URL 이 이전 경로 기준으로 남는 문제를 막는다.
  useEffect(() => {
    syncAdultToUrl(includeAdult);
  }, [pathname, includeAdult]);

  const setIncludeAdult = useCallback((next: boolean) => {
    setStoreValue(next);
  }, []);

  const value = useMemo<AdultContentContextValue>(
    () => ({
      includeAdult,
      setIncludeAdult,
      toggle: () => setStoreValue(!includeAdult),
    }),
    [includeAdult, setIncludeAdult]
  );

  return (
    <AdultContentContext.Provider value={value}>
      {children}
    </AdultContentContext.Provider>
  );
}

/**
 * 성인 콘텐츠 토글 상태에 접근한다. Provider 밖에서 호출하면 조용히 기본값을 반환하지
 * 않고 즉시 에러를 던진다(에러를 삼키지 않음 — 배선 누락을 개발 중 드러낸다).
 */
export function useAdultContent(): AdultContentContextValue {
  const context = useContext(AdultContentContext);
  if (context === null) {
    throw new Error(
      "useAdultContent 는 AdultContentProvider 내부에서만 사용할 수 있습니다."
    );
  }
  return context;
}
