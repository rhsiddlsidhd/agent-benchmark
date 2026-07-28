import Link from "next/link";
import { TypographyMuted } from "@/client/components/atoms";
import { Hammer } from "lucide-react";
import { routes } from "@/shared/constants";

interface ComingSoonPageProps {
  title: React.ReactNode;
  description: React.ReactNode;
  secondaryLink?: { href: string; label: string };
}

export function ComingSoonPage({ title, description, secondaryLink }: ComingSoonPageProps) {
  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden"
      style={{ background: "oklch(0.985 0.006 75)" }}
    >
      {/* Dot grid texture - Consistent with NotFound */}
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

      {/* Background Text (Coming Soon instead of 404) */}
      <div
        className="not-found-ghost text-foreground pointer-events-none absolute leading-none font-[var(--font-NotoSerif)] font-black select-none"
        style={{
          fontSize: "clamp(100px, 20vw, 280px)",
          letterSpacing: "-0.04em",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          opacity: 0.03,
          whiteSpace: "nowrap",
        }}
      >
        COMING SOON
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
          {/* Corner marks */}
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

          {/* Construction Icon */}
          <div className="not-found-fade-2 mb-6">
            <div className="relative">
              <div className="bg-primary/5 absolute inset-0 animate-pulse rounded-full" />
              <Hammer
                className="text-primary relative h-12 w-12 opacity-40"
                strokeWidth={1.5}
              />
            </div>
          </div>

          {/* Status Text */}
          <p
            className="not-found-fade-3 mb-2 text-center text-sm font-[var(--font-NotoSerif)] font-medium tracking-[0.2em] uppercase"
            style={{ color: "oklch(0.65 0.03 60)" }}
          >
            Under Construction
          </p>

          {/* Title */}
          <h1 className="not-found-fade-3 text-foreground text-center text-2xl font-[var(--font-NotoSerif)] font-semibold tracking-tight">
            {title}
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
          <TypographyMuted className="not-found-fade-4 max-w-[280px] text-center leading-relaxed">
            {description}
          </TypographyMuted>

          {/* CTA buttons */}
          <div className="not-found-fade-5 mt-10 flex flex-col gap-3">
            <Link
              href={routes.home}
              className="not-found-btn border-foreground text-foreground inline-block border px-10 py-3 text-sm font-[var(--font-NotoSerif)] font-medium tracking-widest"
            >
              <span>홈으로 돌아가기</span>
            </Link>
            {secondaryLink && (
              <Link
                href={secondaryLink.href}
                className="text-muted-foreground hover:text-foreground text-center text-xs font-medium tracking-wide transition-colors"
              >
                {secondaryLink.label}
              </Link>
            )}
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
