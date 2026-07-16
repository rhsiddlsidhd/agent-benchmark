"use client";

import { Button } from "@/components/atoms/button";
import { useEntry } from "@/hooks/useEntry";

/**
 * 로그인 페이지로 진입하기 위한 Entry 토큰을 발급받고 이동을 처리하는 버튼
 * (로그인을 직접 수행하는 버튼이 아닌, '관문' 역할을 수행합니다.)
 */
const LoginEntryButton = () => {
  // 로그인 페이지("/login")로 진입하기 위한 Entry 핸들러 주입
  const { handleEntry } = useEntry("/login");

  return (
    <Button variant="ghost" size="sm" onClick={handleEntry}>
      로그인
    </Button>
  );
};

export default LoginEntryButton;
