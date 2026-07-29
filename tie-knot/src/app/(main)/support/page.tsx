import { ComingSoonPage } from "@/client/components/organisms";

// mock UI만 구현 — sidebar.ts의 authUserOrderNavigateItems가 참조하던 href를 채운 것, 실제 문의 폼/FAQ는 별도 작업.
export default function SupportPage() {
  return (
    <ComingSoonPage
      title={
        <>
          고객센터 페이지를 <br /> 준비하고 있습니다
        </>
      }
      description={
        <>
          문의사항은 준비되는 대로
          <br />
          더 편하게 남기실 수 있도록
          <br />
          정성스럽게 만들고 있어요.
        </>
      }
    />
  );
}
