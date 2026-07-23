import { Header } from "./_components";
import React from "react";
import { Toaster } from "sonner";
import { AnnouncementBar } from "@/client/components/molecules";
import announcementData from "@/data/announcement.json";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const activeAnnouncements = announcementData.filter((item) => item.isActive);

  return (
    <div>
      <AnnouncementBar items={activeAnnouncements} />
      <Header />
      {children}
      <Toaster />
    </div>
  );
};

export default MainLayout;
