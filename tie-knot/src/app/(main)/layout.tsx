import { Header, Footer } from "./_components";
import React from "react";
import { Toaster } from "sonner";
import { AnnouncementBar } from "@/client/components/molecules";
import announcementData from "@/data/announcement.json";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const activeAnnouncements = announcementData.filter((item) => item.isActive);

  return (
    <div className="bg-muted/30 min-h-screen">
      {/* 데스크탑에서도 모바일 폭을 연상케 하는 480px 캡 — 전단지처럼 꽉 찬 콘텐츠를
          전제로 한 Home 개편 설계(TODO.md Phase 1) */}
      <div className="bg-background mx-auto flex min-h-screen w-full max-w-[480px] flex-col shadow-sm">
        <AnnouncementBar items={activeAnnouncements} />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <Toaster />
    </div>
  );
};

export default MainLayout;
