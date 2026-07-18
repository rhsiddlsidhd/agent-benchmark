export const revalidate = 300;

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import Grid from "@/components/layout/Grid";
import { Package, DollarSign, ShoppingCart, Users } from "lucide-react";
import { TypographyMuted, TypographySmall } from "@/components/atoms/typoqraphy";

export default function AdminDashboard() {
  const stats = [
    {
      title: "총 상품",
      value: "24",
      icon: Package,
      description: "등록된 템플릿 수",
      trend: "+2 이번 달",
    },
    {
      title: "총 매출",
      value: "₩1,234,000",
      icon: DollarSign,
      description: "이번 달 매출",
      trend: "+12.5% 지난 달 대비",
    },
    {
      title: "주문",
      value: "89",
      icon: ShoppingCart,
      description: "이번 달 주문 수",
      trend: "+8 지난 주 대비",
    },
    {
      title: "회원",
      value: "342",
      icon: Users,
      description: "총 회원 수",
      trend: "+23 이번 달",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <TypographyMuted>
          모바일 청첩장 관리자 대시보드에 오신 것을 환영합니다.
        </TypographyMuted>
      </div>

      <Grid slot="admin-dashboard-stats">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-foreground mb-1 text-2xl font-bold">
                {stat.value}
              </div>
              <TypographyMuted className="mb-1">
                {stat.description}
              </TypographyMuted>
              <TypographySmall className="text-primary font-medium">{stat.trend}</TypographySmall>
            </CardContent>
          </Card>
        ))}
      </Grid>

      <Card>
        <CardHeader>
          <CardTitle>최근 활동</CardTitle>
        </CardHeader>
        <CardContent>
          <TypographyMuted>
            최근 활동 내역이 여기에 표시됩니다.
          </TypographyMuted>
        </CardContent>
      </Card>
    </div>
  );
}
