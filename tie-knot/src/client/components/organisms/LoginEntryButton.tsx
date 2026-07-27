import { Button } from "@/client/components/atoms";
import Link from "next/link";

const LoginEntryButton = () => {
  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href="/login">로그인</Link>
    </Button>
  );
};

export { LoginEntryButton };
