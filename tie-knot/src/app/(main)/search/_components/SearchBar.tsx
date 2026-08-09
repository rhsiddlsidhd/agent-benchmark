"use client";

import { Search } from "lucide-react";
import { Input } from "@/client/components/atoms";

export function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <form
      role="search"
      onSubmit={(e) => e.preventDefault()}
      className="relative"
    >
      <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
        enterKeyHint="search"
        maxLength={100}
        aria-label="상품 검색"
        placeholder="상품명을 검색해보세요"
        className="pl-9"
      />
    </form>
  );
}
