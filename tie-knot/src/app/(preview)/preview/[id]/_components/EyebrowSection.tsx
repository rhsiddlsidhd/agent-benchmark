import { TypographyEyebrow, TypographyLead } from "@/client/components/atoms";
import React from "react";

interface EyebrowSectionProps {
  eyebrow: string;
  heading: string;
  children: React.ReactNode;
}

const EyebrowSection = ({ eyebrow, heading, children }: EyebrowSectionProps) => {
  return (
    <section className="bg-background px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <TypographyEyebrow>{eyebrow}</TypographyEyebrow>
        <TypographyLead className="p-4 font-semibold">
          {heading}
        </TypographyLead>
        <div className="space-y-4">{children}</div>
      </div>
    </section>
  );
};

export { EyebrowSection };
