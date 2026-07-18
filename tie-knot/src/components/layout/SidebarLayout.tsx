"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/components/atoms/sidebar";
import useAuthStore from "@/store/auth.store";

const SidebarLayout = ({ children }: { children: React.ReactNode }) => {
  const email = useAuthStore((state) => state.email);
  const role = useAuthStore((state) => state.role);

  return (
    <Sidebar className="bg-card border-border fixed top-0 left-0 z-50 h-screen w-64 border-r pt-16">
      <SidebarContent className="flex-1 overflow-y-auto">
        {children}
      </SidebarContent>

      <SidebarFooter className="border-border border-t p-4">
        <div className="mb-2 flex items-center gap-3 px-2 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-sm font-medium">
              {email}
            </p>
            <p className="text-muted-foreground text-xs">
              {role === "ADMIN" ? "관리자" : "일반"} 계정
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default SidebarLayout;
