import { Header } from "./_components";
import React from "react";
import { Toaster } from "sonner";
import { AnnouncementBar } from "@/components/molecules/AnnouncementBar";
import announcementData from "@/data/announcement.json";

const layout = ({ children }: { children: React.ReactNode }) => {
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

export default layout;
