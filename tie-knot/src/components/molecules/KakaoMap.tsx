import useKakaoLoader from "@/lib/kakao/useKakaoLoader";
import React, { useEffect, useState } from "react";
import { Map, MapMarker } from "react-kakao-maps-sdk";
import { MapPin } from "lucide-react";

const KakaoMap = ({ address }: { address: string }) => {
  useKakaoLoader();

  const [geoState, setGeoState] = useState<{
    lng: number | null;
    lat: number | null;
  }>({ lng: null, lat: null });

  useEffect(() => {
    const getCoordinates = async (address: string) => {
      try {
        const res = await fetch(`/api/kakaomap?address=${address}`);

        const data = await res.json();
        if (!res.ok || data.errorType) {
          throw new Error(data.message);
        }

        const { x, y } = data.documents[0];
        setGeoState({ lat: y, lng: x });
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "서버 오류가 발생하였습니다.";
        console.error(message);
      }
    };

    getCoordinates(address);
  }, [address]);

  return (
    <div className="flex justify-center">
      {geoState.lat === null || geoState.lng === null ? (
        <div className="bg-muted relative aspect-video w-full animate-pulse overflow-hidden rounded-xl">
          <div className="absolute inset-0 flex items-center justify-center">
            <MapPin className="text-muted-foreground/30 h-12 w-12" />
          </div>
        </div>
      ) : (
        <Map
          id="map"
          center={{
            lat: geoState.lat,
            lng: geoState.lng,
          }}
          style={{ width: "100%", height: "300px" }}
          level={5}
        >
          <MapMarker position={{ lat: geoState.lat, lng: geoState.lng }} />
        </Map>
      )}
    </div>
  );
};

export default KakaoMap;
