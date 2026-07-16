"use client";
import { Button } from "@/components/atoms/button";
import { NAVIGATION_BUTTONS } from "@/constants/navigation";

import { GeoState } from "@/utils/openApp";
import Image from "next/image";
import React, { useEffect, useState } from "react";

const Navigation = ({ address }: { address: string }) => {
  const [geoState, setGeoState] = useState<{
    current: { lng: number | null; lat: number | null };
    target: {
      lng: number | null;
      lat: number | null;
    };
  }>({ current: { lng: null, lat: null }, target: { lng: null, lat: null } });

  const getCurrentCoordinates = (): Promise<GeoState | null> => {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lng: position.coords.longitude,
            lat: position.coords.latitude,
          });
        },
        (err) => {
          console.error(err);
          resolve(null);
        },
      );
    });
  };

  useEffect(() => {
    const fetchCurrentCoordinates = async () => {
      const coordinate = await getCurrentCoordinates();
      if (coordinate) {
        setGeoState((prev) => ({
          ...prev,
          current: { lng: coordinate.lng, lat: coordinate.lat },
        }));
      }
    };

    fetchCurrentCoordinates();
  }, []);

  useEffect(() => {
    const getCoordinates = async (address: string) => {
      try {
        const res = await fetch(`/api/kakaomap?address=${address}`);
        const data = await res.json();
        if (!res.ok || data.errorType) {
          throw new Error(data.message);
        }
        const { x, y } = data.documents[0];

        setGeoState((prev) => ({
          ...prev,
          target: { lat: Number(y), lng: Number(x) },
        }));
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "서버 오류가 발생하였습니다.";
        console.error(message);
      }
    };

    getCoordinates(address);
  }, [address]);

  return (
    <div className="space-y-2">
      <p className="text-sm font-bold">네비게이션</p>
      <p className="text-muted-foreground text-xs">
        원하시는 앱을 선택하시면 길안내가 시작됩니다.
      </p>
      <div className="flex flex-col gap-2">
        {NAVIGATION_BUTTONS.map((nav, i) => {
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

export default Navigation;
