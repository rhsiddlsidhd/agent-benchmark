import GuestBookModal from "@/components/organisms/GuestBookModal";
import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
  // theme, 공통 Style 정의

  return (
    <div className="bg-background border-muted-foreground-foreground mx-auto min-h-screen max-w-lg">
      {children}
      <GuestBookModal />
    </div>
  );
};

export default layout;
