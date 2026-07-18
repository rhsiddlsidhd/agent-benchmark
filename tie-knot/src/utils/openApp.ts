export interface GeoState {
  lng: number | null;
  lat: number | null;
}

const openTmap = (address: string) => {
  const timeout = setTimeout(() => {
    window.open(
      `https://map.naver.com/v5/search/${encodeURIComponent(address)}`,
      "_blank",
    );
  }, 3000);
  window.location.href = `tmap://search?name=${encodeURIComponent(address)}`;
  window.onblur = () => clearTimeout(timeout);
};

const openNaverMap = ({
  current,
  target,
  address,
}: {
  current: GeoState;
  target: GeoState;
  address: string;
}): void => {
  const timeout = setTimeout(() => {
    window.open(`https://map.naver.com/v5/search/${address}`, "_blank");
  }, 3000);

  window.location.href = `nmap://route/car?dname=${address}&dlat=${target.lat}&dlng=${target.lng}&slng=${current.lng}&slat=${current.lat}`;
  window.onblur = () => clearTimeout(timeout);
};

const openKakaoMap = ({
  current,
  target,
  address,
}: {
  current: GeoState;
  target: GeoState;
  address: string;
}): void => {
  const timeout = setTimeout(() => {
    window.open(
      `https://map.kakao.com/link/search/${encodeURIComponent(address)}`,
      "_blank",
    );
  }, 3000);

  window.location.href = `kakaomap://route?sp=${current.lat?.toString()},${current.lng?.toString()}&ep=${
    target.lat
  },${target.lng}&by=CAR`;
  window.onblur = () => clearTimeout(timeout);
};

const openApp = {
  openTmap,
  openKakaoMap,
  openNaverMap,
};

export default openApp;
