import { cn } from "@/lib/utils";

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * 페이지 최상위 제목 (Hero, 랜딩 타이틀 등)
 * - 크기: 4xl (36px) | 굵기: extrabold | 가운데 정렬
 * - 사용: <TypographyH1>서비스 소개 제목</TypographyH1>
 */
export function TypographyH1({ children, className }: TypographyProps) {
  return (
    <h1
      className={cn(
        "scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance",
        className,
      )}
    >
      {children}
    </h1>
  );
}

/**
 * 섹션 제목 (카드, 모달, 페이지 내 구분선 포함)
 * - 크기: 3xl (30px) | 굵기: semibold | 하단 구분선 있음
 * - 사용: <TypographyH2>섹션 이름</TypographyH2>
 */
export function TypographyH2({ children, className }: TypographyProps) {
  return (
    <h2
      className={cn(
        "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
        className,
      )}
    >
      {children}
    </h2>
  );
}

/**
 * 서브 섹션 제목 (카드 내부, 목록 그룹 헤더 등)
 * - 크기: 2xl (24px) | 굵기: semibold
 * - 사용: <TypographyH3>그룹 이름</TypographyH3>
 */
export function TypographyH3({ children, className }: TypographyProps) {
  return (
    <h3
      className={cn(
        "scroll-m-20 text-2xl font-semibold tracking-tight",
        className,
      )}
    >
      {children}
    </h3>
  );
}

/**
 * 소제목 / 항목 레이블 (폼 섹션, 리스트 아이템 타이틀 등)
 * - 크기: xl (20px) | 굵기: semibold
 * - 사용: <TypographyH4>항목 이름</TypographyH4>
 */
export function TypographyH4({ children, className }: TypographyProps) {
  return (
    <h4
      className={cn(
        "scroll-m-20 text-xl font-semibold tracking-tight",
        className,
      )}
    >
      {children}
    </h4>
  );
}

/**
 * 일반 본문 텍스트 (설명, 내용 단락)
 * - 크기: base | 줄 간격 넓음 | 두 번째 단락부터 상단 margin 자동
 * - 사용: <TypographyP>본문 내용</TypographyP>
 */
export function TypographyP({ children, className }: TypographyProps) {
  return (
    <p className={cn("leading-7 not-first:mt-6", className)}>{children}</p>
  );
}

/**
 * 인용문 / 강조 문구 (후기, 노트, 주의사항 등)
 * - 왼쪽 보더 라인 + 이탤릭체 | 상단 margin 있음
 * - 사용: <TypographyBlockquote>인용 내용</TypographyBlockquote>
 */
export function TypographyBlockquote({ children, className }: TypographyProps) {
  return (
    <blockquote className={cn("mt-6 border-l-2 pl-6 italic", className)}>
      {children}
    </blockquote>
  );
}

/**
 * 인라인 코드 스니펫 (문장 안에 삽입되는 코드)
 * - 배경색 있는 rounded 박스 | monospace | text-sm
 * - 사용: <TypographyInlineCode>npm install</TypographyInlineCode>
 */
export function TypographyInlineCode({ children, className }: TypographyProps) {
  return (
    <code
      className={cn(
        "bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
        className,
      )}
    >
      {children}
    </code>
  );
}

/**
 * 리드 문구 (히어로 아래 부제목, 페이지 요약 설명)
 * - 크기: xl (20px) | 색상: muted (흐리게)
 * - 사용: <TypographyLead>페이지 한 줄 설명</TypographyLead>
 */
export function TypographyLead({ children, className }: TypographyProps) {
  return (
    <p className={cn("text-muted-foreground text-xl", className)}>{children}</p>
  );
}

/**
 * 강조된 일반 텍스트 (카드 제목, 메뉴 항목 등)
 * - 크기: lg (18px) | 굵기: semibold
 * - 사용: <TypographyLarge>강조할 항목</TypographyLarge>
 */
export function TypographyLarge({ children, className }: TypographyProps) {
  return (
    <div className={cn("text-lg font-semibold", className)}>{children}</div>
  );
}

/**
 * 보조 텍스트 / 캡션 (날짜, 태그, 단위 등 작은 정보)
 * - 크기: sm (14px) | 줄 간격 없음 | 굵기: medium
 * - 사용: <TypographySmall>2024.01.01</TypographySmall>
 */
export function TypographySmall({ children, className }: TypographyProps) {
  return (
    <small className={cn("text-sm leading-none font-medium", className)}>
      {children}
    </small>
  );
}

/**
 * 비활성/보조 설명 텍스트 (placeholder, 힌트, 비어있는 상태 메시지)
 * - 크기: sm (14px) | 색상: muted (흐리게)
 * - 사용: <TypographyMuted>아직 등록된 항목이 없습니다</TypographyMuted>
 */
export function TypographyMuted({ children, className }: TypographyProps) {
  return (
    <p className={cn("text-muted-foreground text-sm", className)}>{children}</p>
  );
}
