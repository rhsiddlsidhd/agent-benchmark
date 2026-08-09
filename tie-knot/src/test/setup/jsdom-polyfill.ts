import { afterEach } from "vitest";

// services/actions 등 DOM 없는 파일(`// @vitest-environment node`)은 이 아래
// jsdom 전용 폴리필을 전부 건너뛴다 — jsdom 환경에서만 Element/window가 존재한다.
if (typeof window !== "undefined") {
  await import("@testing-library/jest-dom/vitest");
  const { cleanup } = await import("@testing-library/react");

  afterEach(cleanup);

  // jsdom이 Pointer Events API를 구현하지 않아 Radix UI(Select/Dialog 등)가 던지는 에러 방지
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }

  // jsdom이 ResizeObserver를 구현하지 않아, Radix Select가 트리거 크기 측정에 쓰는
  // @radix-ui/react-use-size의 useLayoutEffect가 마운트 시 즉시 던진다 — Select를
  // 2개 이상 동시에 렌더링하는 폼(예: ProductRegistrationForm)에서 처음 드러남.
  if (typeof globalThis.ResizeObserver === "undefined") {
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
  }

  // jsdom이 DataTransfer를 구현하지 않아, 파일 input을 프로그래밍적으로 채우는
  // 패턴(new DataTransfer() → input.files = dataTransfer.files, ProductRegistrationForm의
  // 썸네일/미리보기 업로드 ref 콜백)이 마운트 즉시 던진다 — 파일 업로드 상호작용을
  // 실제로 테스트할 때 처음 드러남.
  if (typeof globalThis.DataTransfer === "undefined") {
    class DataTransferMock {
      private fileList: File[] = [];
      items = {
        add: (file: File) => {
          this.fileList.push(file);
        },
      };
      get files() {
        return this.fileList as unknown as FileList;
      }
    }
    globalThis.DataTransfer = DataTransferMock as unknown as typeof DataTransfer;
  }

  // jsdom이 IntersectionObserver를 구현하지 않아, BottomActionBar(useEffect 안에서
  // 폼 끝 지점 가시성을 관찰)를 렌더하는 컨테이너 테스트(CheckoutForm 등)가 마운트
  // 즉시 던진다.
  if (typeof globalThis.IntersectionObserver === "undefined") {
    class IntersectionObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    }
    globalThis.IntersectionObserver =
      IntersectionObserverMock as unknown as typeof IntersectionObserver;
  }

  // jsdom이 matchMedia를 구현하지 않아, embla-carousel(OptionsHandler의 반응형
  // breakpoint 옵션 병합)이 마운트 즉시 "undefined is not a function"으로 던진다 —
  // atoms/carousel.tsx(Carousel)를 렌더하는 컴포넌트를 테스트할 때 처음 드러남.
  if (typeof window.matchMedia === "undefined") {
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList;
  }

  // jsdom의 HTMLInputElement.files setter는 진짜 FileList 브랜드 체크를 하기 때문에
  // 위 DataTransferMock이 만든 배열을 대입하면 "not of type 'FileList'"로 던진다 —
  // 테스트 환경에서만 이 setter를 느슨하게 바꿔 배열도 그대로 받아들이게 한다.
  // user-event.upload()가 쓰는 인스턴스 전용 own-property 대입은 이 prototype
  // accessor보다 우선 적용되므로 서로 간섭하지 않는다.
  const nativeFilesDescriptor = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "files",
  );
  if (nativeFilesDescriptor?.get) {
    Object.defineProperty(HTMLInputElement.prototype, "files", {
      configurable: true,
      get(this: HTMLInputElement & { __filesOverride?: FileList }) {
        return this.__filesOverride ?? nativeFilesDescriptor.get!.call(this);
      },
      set(this: HTMLInputElement & { __filesOverride?: FileList }, value: FileList) {
        this.__filesOverride = value;
      },
    });
  }
}
