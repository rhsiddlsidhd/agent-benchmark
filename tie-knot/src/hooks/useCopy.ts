import { useState } from "react";
import { toast } from "sonner";

/**
 * 텍스트 복사 로직을 관리하는 커스텀 훅
 */
export function useCopy() {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async (text: string, onCopySuccess?: () => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast.success("복사되었습니다.");
      onCopySuccess?.();
    } catch (error) {
      console.error("복사 실패:", error);
      toast.error("복사에 실패했습니다.");
    } finally {
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return { isCopied, copyToClipboard };
}
