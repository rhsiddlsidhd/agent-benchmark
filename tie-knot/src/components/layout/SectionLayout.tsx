import React from "react";

const SectionLayout = ({
  title,
  subTitle,
  children,
}: {
  title: string;
  subTitle: string;
  children: React.ReactNode;
}) => {
  return (
    <section className="bg-background px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <div className="text-center text-xs font-bold tracking-widest">
          {title}
        </div>
        <div className="text-muted-foreground p-4 text-center text-xl font-semibold">
          {subTitle}
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    </section>
  );
};

export default SectionLayout;
