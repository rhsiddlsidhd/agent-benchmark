"use client";

import { useEffect, useState } from "react";
import { GeoState } from "@/client/utils";
import { useKakaomapGeocode } from "./useKakaomapGeocode";

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
  const [current, setCurrent] = useState<GeoState>({ lng: null, lat: null });

  useEffect(() => {
    const fetchCurrentCoordinates = async () => {
      const coordinate = await getCurrentCoordinates();
      if (coordinate) {
        setCurrent(coordinate);
      }
    };

    fetchCurrentCoordinates();
  }, []);

  const target = useKakaomapGeocode(address);

  return { current, target };
}
