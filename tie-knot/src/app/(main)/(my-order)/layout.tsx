"use client";

import { Sidebar, SidebarContent, SidebarFooter, SidebarProvider } from "@/client/components/atoms";
import { SidebarNavItem } from "@/client/components/molecules";
import { SidebarToggle } from "@/client/components/organisms";
import { useAuthStore } from "@/client/store";
const Layout = ({ children }: { children: React.ReactNode }) => {
  const email = useAuthStore((state) => state.email);
  const role = useAuthStore((state) => state.role);

  return (
    <SidebarProvider>
      <div className="bg-background flex min-h-screen w-screen pt-16">
        <Sidebar className="bg-card border-border fixed top-0 left-0 z-50 h-screen w-64 border-r pt-16">
          <SidebarContent className="flex-1 overflow-y-auto">
            <SidebarNavItem type="MY_ORDER" />
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
        <main className="flex-1">
          <div className="container mx-auto px-4 pt-4 pb-20">
            <SidebarToggle />
            <div className="pt-4">{children}</div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
