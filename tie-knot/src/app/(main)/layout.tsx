import { Header, Footer } from "./_components";
import React from "react";
import { Toaster } from "sonner";
import { AnnouncementBar } from "@/client/components/molecules";
import announcementData from "@/data/announcement.json";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const activeAnnouncements = announcementData.filter((item) => item.isActive);

  return (
    <div className="bg-background flex min-h-screen w-full flex-col">
      {/* 폭 제약 없음 — 각 라우트/섹션이 container/max-w-*로 자체 관리한다(과거 480px 모바일폭 캡 제거됨) */}
      <AnnouncementBar items={activeAnnouncements} />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <Toaster />
    </div>
  );
};

export default MainLayout;
