import { Button } from "@/client/components/atoms";
import Link from "next/link";
import { routes } from "@/shared/constants";

const LoginEntryButton = () => {
  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href={routes.login}>로그인</Link>
    </Button>
  );
};

export { LoginEntryButton };
