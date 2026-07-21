"use client";
import { Button } from "@/components/atoms";
import { navigationButtons } from "@/constants";
import { NavigationGeo } from "@/hooks";
import Image from "next/image";
import React from "react";

interface NavigationProps {
  address: string;
  geoState: NavigationGeo;
}

const Navigation = ({ address, geoState }: NavigationProps) => {
  return (
    <div className="space-y-2">
      <p className="text-sm font-bold">네비게이션</p>
      <p className="text-muted-foreground text-xs">
        원하시는 앱을 선택하시면 길안내가 시작됩니다.
      </p>
      <div className="flex flex-col gap-2">
        {navigationButtons.map((nav, i) => {
          return (
            <Button
              variant="outline"
              key={i}
              onClick={() => {
                nav.onClick({
                  address: address,
                  current: geoState.current,
                  target: geoState.target,
                });
              }}
            >
              <span className="relative inline-block aspect-square w-4 shrink-0">
                <Image
                  src={`/assets/provider/${nav.path}`}
                  fill
                  alt="provider image"
                  className="object-cover"
                  sizes="16px"
                />
              </span>
              <span className="shrink-0 grow-0">{nav.name}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export { Navigation };
