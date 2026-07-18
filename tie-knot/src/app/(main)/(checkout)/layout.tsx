import PageTitle from "@/components/molecules/PageTitle";
import { OrderSummary } from "@/components/organisms/OrderSummary";
import React from "react";

const layout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="bg-background min-h-screen">
      <div className="container mx-auto px-4 pt-24 pb-20">
        <div className="mx-auto max-w-6xl">
          <PageTitle />

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left side -  Form */}
            <div className="lg:col-span-2">{children}</div>

            {/* Right side - Order Summary */}
            <div className="lg:col-span-1">
              <OrderSummary />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default layout;
