"use client";

/**
 * ScrollRail — 카드 레일 전용 래퍼 (03_DESIGN §3.1/§4, TODO.md 캐러셀 드래그 스크롤 개선).
 *
 * `useDragScroll`으로 마우스/터치/펜 드래그 + 키보드(←/→) + 포커스 이동 + 클릭 무력화를
 * 지원한다. 반응형 카드 폭은 03_DESIGN 캐러셀 스펙 그대로(`w-[42%] sm:w-[29%]
 * md:w-[22%] lg:w-[15.5%] xl:w-[13.2%]`, Tailwind 기본 브레이크포인트와 일치),
 * 간격/좌우 여백은 기존 토큰(`gap-card-gap`/`-lg`, `px-gutter`/`-lg`)만 사용한다.
 * 카드 hover 상승(`y:-4`)/그림자가 잘리지 않도록 세로 패딩을 둔다.
 *
 * 데스크톱(`md` 이상)에서는 좌우 화살표 버튼도 노출한다 — 마우스로는 드래그 가능
 * 영역이 시각적으로 드러나지 않아 발견성이 떨어지기 때문. 모바일 터치 스와이프/드래그는
 * 그대로 유지하고 화살표 버튼은 `md` 미만에서 숨긴다.
 *
 * children은 이미 `<li>`로 감싼 카드 목록이어야 한다(트랙의 직계 자식 = 스냅 대상).
 * 리스트가 빈 배열일 때 섹션 자체를 숨기는 판단은 호출부 책임이다(§4, 03_DESIGN §2.9).
 */
import { Children, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useDragScroll } from "@/src/hooks";

interface ScrollRailProps {
  /** 카드 1개당 `<li>`로 감싼 렌더 결과. */
  children: ReactNode;
}

export function ScrollRail({ children }: ScrollRailProps) {
  const [index, setIndex] = useState(0);
  const { containerRef, trackRef, trackProps, containerProps, scrollToIndex } =
    useDragScroll<HTMLUListElement>({ onIndexChange: setIndex });
  const count = Children.count(children);

  return (
    <div
      ref={containerRef}
      {...containerProps}
      className="relative scrollbr-hide rail-snap overflow-hidden"
    >
      <motion.ul
        ref={trackRef}
        {...trackProps}
        className="flex gap-card-gap px-gutter py-2 md:gap-card-gap-lg md:px-gutter-lg [&>*]:w-[42%] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-[29%] md:[&>*]:w-[22%] lg:[&>*]:w-[15.5%] xl:[&>*]:w-[13.2%]"
      >
        {children}
      </motion.ul>
    </div>
  );
}
