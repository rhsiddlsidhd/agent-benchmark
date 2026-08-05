import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import ctaData from "@/data/cta.json";
import { StartActionCTA } from "./StartActionCTA";

describe("StartActionCTA", () => {
  it("primaryAction/secondaryAction을 cta.json href로 렌더한다", () => {
    render(<StartActionCTA />);

    const primaryLink = screen.getByRole("link", { name: ctaData.primaryAction.label });
    const secondaryLink = screen.getByRole("link", { name: ctaData.secondaryAction.label });

    expect(primaryLink).toHaveAttribute("href", ctaData.primaryAction.href);
    expect(secondaryLink).toHaveAttribute("href", ctaData.secondaryAction.href);
  });
});
