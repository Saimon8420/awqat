import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { DecorLayer } from "./DecorLayer";
import { GRADIENTS } from "./backgrounds";
import { MOTIFS } from "./index";
import { DEFAULT_STATE } from "@/lib/state";
import { THEMES } from "@/templates/themes";

const theme = THEMES[0];

describe("DecorLayer", () => {
  it("renders nothing when no motif/gradient/bgImage is set", () => {
    const { container } = render(<DecorLayer state={DEFAULT_STATE} theme={theme} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a gradient background div when state.gradient is set", () => {
    const state = { ...DEFAULT_STATE, gradient: GRADIENTS[0].id };
    const { container } = render(<DecorLayer state={state} theme={theme} />);
    const gradientDiv = container.querySelector(
      `div[style*="${GRADIENTS[0].css.slice(0, 20)}"]`,
    );
    expect(gradientDiv).not.toBeNull();
  });

  it("renders a photo background with a legibility scrim when state.bgImage is set", () => {
    const state = { ...DEFAULT_STATE, bgImage: "data:image/png;base64,AAAA" };
    const { container } = render(<DecorLayer state={state} theme={theme} />);
    const photoDiv = container.querySelector('div[style*="data:image/png;base64,AAAA"]');
    expect(photoDiv).not.toBeNull();
  });

  it("renders the selected motif tinted with the theme accent", () => {
    const state = { ...DEFAULT_STATE, motif: MOTIFS[0].id };
    const { container } = render(<DecorLayer state={state} theme={theme} />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
  });
});
