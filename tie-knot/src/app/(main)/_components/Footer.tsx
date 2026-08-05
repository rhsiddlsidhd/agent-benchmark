import { TypographyH4 } from "@/client/components/atoms";

export function Footer() {
  return (
    <footer className="border-border border-t bg-slate-50 py-12">
      <div className="px-4 text-center">
        <TypographyH4 className="mb-2">Tie Knot</TypographyH4>
        <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
          {"당신의 특별한 날을 더 아름답게 만드는 모바일 청첩장 서비스"}
        </p>

        <div className="border-border text-muted-foreground border-t pt-8 text-sm">
          <p>{"© 2026 Tie Knot. All rights reserved."}</p>
        </div>
      </div>
    </footer>
  );
}
