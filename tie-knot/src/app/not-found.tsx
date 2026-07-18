import Link from "next/link";
import { TypographyMuted } from "@/components/atoms/typoqraphy";

export default function NotFound() {
  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden"
      style={{ background: "oklch(0.985 0.006 75)" }}
    >
      {/* Dot grid texture */}
      <div
        className="not-found-dots pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, oklch(0.5 0.02 60 / 0.18) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, oklch(0.92 0.04 80 / 0.4), transparent 70%)",
        }}
      />

      {/* Ghost 404 */}
      <div
        className="not-found-ghost text-foreground pointer-events-none absolute leading-none font-[var(--font-NotoSerif)] font-black select-none"
        style={{
          fontSize: "clamp(160px, 38vw, 380px)",
          letterSpacing: "-0.06em",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          opacity: 0.05,
        }}
      >
        404
      </div>

      {/* Main card — floating */}
      <div className="not-found-float relative z-10 flex flex-col items-center">
        {/* Top flourish */}
        <div className="not-found-fade-1 mb-8 flex items-center gap-4">
          <div
            className="h-px w-20"
            style={{
              background:
                "linear-gradient(to right, transparent, oklch(0.5 0.02 60 / 0.4))",
            }}
          />
          <span
            className="text-base font-[var(--font-NotoSerif)]"
            style={{ color: "oklch(0.5 0.02 60 / 0.5)" }}
          >
            ✦
          </span>
          <div
            className="h-px w-20"
            style={{
              background:
                "linear-gradient(to left, transparent, oklch(0.5 0.02 60 / 0.4))",
            }}
          />
        </div>

        {/* Envelope card */}
        <div
          className="not-found-fade-2 relative flex flex-col items-center px-12 py-14"
          style={{
            minWidth: "min(90vw, 460px)",
            background: "oklch(1 0 0 / 0.85)",
            border: "1px solid oklch(0.75 0.03 60 / 0.25)",
            backdropFilter: "blur(12px)",
            boxShadow:
              "0 2px 0 oklch(0.75 0.03 60 / 0.15), 0 20px 60px -10px oklch(0.5 0.05 60 / 0.12)",
          }}
        >
          {/* Corner marks */}ㅍ
          <div
            className="absolute top-3 left-3 h-4 w-4 border-t border-l"
            style={{ borderColor: "oklch(0.7 0.03 60 / 0.35)" }}
          />
          <div
            className="absolute top-3 right-3 h-4 w-4 border-t border-r"
            style={{ borderColor: "oklch(0.7 0.03 60 / 0.35)" }}
          />
          <div
            className="absolute bottom-3 left-3 h-4 w-4 border-b border-l"
            style={{ borderColor: "oklch(0.7 0.03 60 / 0.35)" }}
          />
          <div
            className="absolute right-3 bottom-3 h-4 w-4 border-r border-b"
            style={{ borderColor: "oklch(0.7 0.03 60 / 0.35)" }}
          />
          {/* Envelope icon */}
          <div className="not-found-fade-2 mb-6">
            <svg
              width="48"
              height="36"
              viewBox="0 0 48 36"
              fill="none"
              style={{ opacity: 0.25 }}
            >
              <rect
                x="1"
                y="1"
                width="46"
                height="34"
                rx="1"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M1 3l23 16L47 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          {/* 404 number */}
          <p
            className="not-found-fade-3 mb-1 leading-none font-[var(--font-NotoSerif)] font-black tracking-tighter"
            style={{
              fontSize: "clamp(56px, 14vw, 80px)",
              color: "oklch(0.85 0.03 60)",
            }}
          >
            404
          </p>
          {/* Title */}
          <h1 className="not-found-fade-3 text-foreground text-xl font-[var(--font-NotoSerif)] font-semibold tracking-tight">
            페이지를 찾을 수 없습니다
          </h1>
          {/* Divider */}
          <div className="not-found-fade-4 my-6 flex items-center gap-3">
            <div
              className="h-px w-10"
              style={{ background: "oklch(0.7 0.03 60 / 0.3)" }}
            />
            <span
              className="text-xs font-[var(--font-NotoSerif)]"
              style={{ color: "oklch(0.7 0.03 60 / 0.5)" }}
            >
              ✦
            </span>
            <div
              className="h-px w-10"
              style={{ background: "oklch(0.7 0.03 60 / 0.3)" }}
            />
          </div>
          {/* Description */}
          <TypographyMuted className="not-found-fade-4 max-w-[260px] text-center leading-relaxed">
            요청하신 청첩장 또는 페이지가
            <br />
            존재하지 않거나 삭제되었습니다.
          </TypographyMuted>
          {/* CTA button */}
          <div className="not-found-fade-5 mt-10">
            <Link
              href="/"
              className="not-found-btn border-foreground text-foreground inline-block border px-10 py-3 text-sm font-[var(--font-NotoSerif)] font-medium tracking-widest"
            >
              <span>홈으로 돌아가기</span>
            </Link>
          </div>
        </div>

        {/* Bottom brand mark */}
        <div className="not-found-fade-5 mt-8 flex items-center gap-3">
          <div
            className="h-px w-10"
            style={{
              background:
                "linear-gradient(to right, transparent, oklch(0.5 0.02 60 / 0.3))",
            }}
          />
          <span
            className="text-xs font-[var(--font-NotoSerif)] tracking-widest"
            style={{ color: "oklch(0.5 0.02 60 / 0.45)" }}
          >
            Tie Knot
          </span>
          <div
            className="h-px w-10"
            style={{
              background:
                "linear-gradient(to left, transparent, oklch(0.5 0.02 60 / 0.3))",
            }}
          />
        </div>
      </div>
    </main>
  );
}
