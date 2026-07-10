import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ImageUploadField } from "../src/components/ui/image-upload";

describe("ImageUploadField", () => {
  it("shows an upload button and no thumbnail when empty", () => {
    render(<ImageUploadField onChange={() => {}} onClear={() => {}} label="Upload image" />);
    expect(screen.getByRole("button", { name: /upload image/i })).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("shows a thumbnail plus Replace and Remove when a value is set", () => {
    const { container } = render(
      <ImageUploadField
        value="data:image/png;base64,AAAA"
        onChange={() => {}}
        onClear={() => {}}
      />,
    );
    // The preview <img> is decorative (alt=""), so it's queried from the DOM
    // rather than by role.
    expect(container.querySelector("img")).toHaveAttribute("src", "data:image/png;base64,AAAA");
    expect(screen.getByRole("button", { name: /replace/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
  });

  it("fires onClear when Remove is clicked", () => {
    const onClear = vi.fn();
    render(
      <ImageUploadField value="data:image/png;base64,AAAA" onChange={() => {}} onClear={onClear} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /remove/i }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
