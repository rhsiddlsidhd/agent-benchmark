import Link from "next/link";
import { Edit } from "lucide-react";
import { Button } from "@/client/components/atoms";
import { Alert } from "@/client/components/molecules";
import { routes } from "@/shared/constants";

const PendingCoupleInfoBanner = ({ orderId }: { orderId: string }) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <Alert type="warning">
        청첩장 정보가 아직 입력되지 않았어요. 정보를 입력하면 바로 확인할 수 있어요.
      </Alert>
      <Button size="lg" variant="outline" asChild>
        <Link href={`${routes.myOrders.coupleInfo}?orderId=${orderId}`}>
          <Edit className="mr-1 h-4 w-4" />
          정보 입력하기
        </Link>
      </Button>
    </div>
  );
};

export { PendingCoupleInfoBanner };
