"use client";

import { useEffect, useState } from "react";
import { GeoState } from "@/utils";

export interface NavigationGeo {
  current: GeoState;
  target: GeoState;
}

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

export function useNavigationGeo(address: string): NavigationGeo {
  const [geoState, setGeoState] = useState<NavigationGeo>({
    current: { lng: null, lat: null },
    target: { lng: null, lat: null },
  });

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
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message ?? "서버 오류가 발생하였습니다.");
        }
        const { x, y } = json.data.documents[0];

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

  return geoState;
}
