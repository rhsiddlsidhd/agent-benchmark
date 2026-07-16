import { useState, useEffect, useRef } from "react";
import { ImageListPayload } from "@/types/image";

export type ImageItem =
  | { type: "existing"; id: string; preview: string; originalUrl: string }
  | { type: "new"; id: string; preview: string; file: File };

const toExistingItem = (url: string): ImageItem => ({
  id: crypto.randomUUID(),
  type: "existing",
  preview: url,
  originalUrl: url,
});

const makeNewItem = (file: File): ImageItem => ({
  id: crypto.randomUUID(),
  type: "new",
  preview: URL.createObjectURL(file),
  file,
});

const revokeBlobUrl = (item: ImageItem) => {
  if (item.type === "new" && item.preview.startsWith("blob:")) {
    URL.revokeObjectURL(item.preview);
  }
};

export function useImageList(defaultUrls?: string[]) {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // defaultUrls가 준비되면 한 번만 초기화 (SWR 비동기 로드 대응)
  useEffect(() => {
    if (initialized || !defaultUrls?.length) return;
    setItems(defaultUrls.map(toExistingItem));
    setInitialized(true);
  }, [defaultUrls, initialized]);

  // 언마운트 시 남아있는 blob URL 해제
  useEffect(() => {
    return () => {
      itemsRef.current.forEach(revokeBlobUrl);
    };
  }, []);

  const add = (files: File[]) =>
    setItems((prev) => [...prev, ...files.map(makeNewItem)]);

  const remove = (id: string) =>
    setItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) revokeBlobUrl(target);
      return prev.filter((item) => item.id !== id);
    });

  const getPayload = (): ImageListPayload => ({
    existing: items
      .filter(
        (i): i is Extract<ImageItem, { type: "existing" }> =>
          i.type === "existing",
      )
      .map((i) => i.originalUrl),
    newFiles: items
      .filter((i): i is Extract<ImageItem, { type: "new" }> => i.type === "new")
      .map((i) => i.file),
  });

  return { items, add, remove, getPayload };
}
