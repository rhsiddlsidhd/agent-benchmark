import { SidebarProvider } from "@/components/atoms/sidebar";
import SidebarNavItem from "@/components/molecules/SidebarNavItem";
import SidebarLayout from "@/components/layout/SidebarLayout";
import SidebarToggle from "@/components/organisms/SidebarToggle";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="bg-background flex min-h-screen w-screen pt-16">
        <SidebarLayout>
          <SidebarNavItem type="MY_PROFILE" />
        </SidebarLayout>
        <main className="flex-1">
          <div className="container mx-auto p-4">
            <SidebarToggle />
            <div className="pt-4">{children}</div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default layout;
