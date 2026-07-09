import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { DecorLayer } from "../src/graphics/DecorLayer";
import { DEFAULT_STATE } from "../src/lib/state";
import { THEMES } from "../src/templates/themes";

const theme = THEMES[0]; // emerald, bg "#f4faf7"

describe("DecorLayer", () => {
  it("applies the default 55% scrim opacity and no blur when bgDim/bgBlur are unset", () => {
    const { container } = render(
      <DecorLayer state={{ ...DEFAULT_STATE, bgImage: "data:image/png;base64,AAAA" }} theme={theme} />,
    );
    const photoLayer = container.querySelector(".bg-cover") as HTMLElement;
    const scrim = photoLayer.nextElementSibling as HTMLElement;

    expect(photoLayer.style.filter).toBe("blur(0px)");
    expect(scrim.style.opacity).toBe("0.55");
  });

  it("wires state.bgDim/state.bgBlur to the scrim opacity and photo-layer blur filter", () => {
    const { container } = render(
      <DecorLayer
        state={{ ...DEFAULT_STATE, bgImage: "data:image/png;base64,AAAA", bgDim: 20, bgBlur: 8 }}
        theme={theme}
      />,
    );
    const photoLayer = container.querySelector(".bg-cover") as HTMLElement;
    const scrim = photoLayer.nextElementSibling as HTMLElement;

    expect(photoLayer.style.filter).toBe("blur(8px)");
    expect(scrim.style.opacity).toBe("0.2");
  });

  it("quotes the bgImage URL in backgroundImage (FIX M6)", () => {
    const { container } = render(
      <DecorLayer
        state={{ ...DEFAULT_STATE, bgImage: "data:image/png;base64,AAAA" }}
        theme={theme}
      />,
    );
    const photoLayer = container.querySelector(".bg-cover") as HTMLElement;
    expect(photoLayer.style.backgroundImage).toBe('url("data:image/png;base64,AAAA")');
  });
});
