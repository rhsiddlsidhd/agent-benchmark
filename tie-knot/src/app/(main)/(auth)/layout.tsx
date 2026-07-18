import Image from "next/image";
import React from "react";
const layout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <main className="bg-background flex min-h-screen items-center">
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="relative hidden h-150 overflow-hidden rounded-2xl lg:block">
              <Image
                src="/assets/images/output.webp"
                alt="Wedding celebration"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="from-background/80 absolute inset-0 bg-linear-to-t to-transparent" />
              <div className="absolute right-8 bottom-8 left-8">
                <h2 className="mb-2 text-3xl font-bold text-balance text-white">
                  당신의 특별한 날을 위한 완벽한 청첩장
                </h2>
                <p className="text-balance text-white/90">
                  간편하게 만들고, 아름답게 공유하세요
                </p>
              </div>
            </div>

            {/* Right side - Login Form */}
            <div className="mx-auto w-full max-w-md lg:mx-0">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default layout;
