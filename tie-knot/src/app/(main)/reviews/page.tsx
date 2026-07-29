import { ComingSoonPage } from "@/client/components/organisms";
import { routes } from "@/shared/constants";

// mock UI만 구현 — navigation.ts가 참조하는 href를 채운 것, 실제 리뷰 목록/작성 기능은 별도 작업.
export default function ReviewsPage() {
  return (
    <ComingSoonPage
      title={
        <>
          리뷰 페이지를 <br /> 준비하고 있습니다
        </>
      }
      description={
        <>
          사용자분들의 생생한 후기를
          <br />
          더욱 아름답게 보여드리기 위해
          <br />
          정성스럽게 단장하고 있어요.
        </>
      }
      secondaryLink={{ href: routes.products.root, label: "다른 템플릿 먼저 구경하기" }}
    />
  );
}
