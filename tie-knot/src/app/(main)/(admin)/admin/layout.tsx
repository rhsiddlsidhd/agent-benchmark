import { SidebarProvider } from "@/components/atoms/sidebar";
import SidebarHeader from "@/components/organisms/SidebarToggle";
import SidebarLayout from "@/components/layout/SidebarLayout";
import type React from "react";
import SidebarNavItem from "@/components/molecules/SidebarNavItem";
import AdminModal from "@/components/organisms/AdminModal";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="bg-background flex min-h-screen w-screen pt-16">
        <SidebarLayout>
          <SidebarNavItem type="ADMIN" />
        </SidebarLayout>
        <main className="flex-1">
          <div className="container mx-auto p-4">
            <SidebarHeader />
            <div className="pt-4">{children}</div>
          </div>
          <AdminModal />
        </main>
      </div>
    </SidebarProvider>
  );
}
