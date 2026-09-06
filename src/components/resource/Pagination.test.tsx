import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("renders nothing when there is neither a previous nor a next page", () => {
    const { container } = render(<Pagination hasPrev={false} hasNext={false} onPrev={vi.fn()} onNext={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("disables Previous on the first page and enables Next", () => {
    render(<Pagination hasPrev={false} hasNext onPrev={vi.fn()} onNext={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("calls onNext and onPrev when clicked", async () => {
    const user = userEvent.setup();
    const onPrev = vi.fn();
    const onNext = vi.fn();

    render(<Pagination hasPrev hasNext onPrev={onPrev} onNext={onNext} />);

    await user.click(screen.getByRole("button", { name: "Previous" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(onPrev).toHaveBeenCalled();
    expect(onNext).toHaveBeenCalled();
  });

  it("disables both buttons when disabled is set, even with pages available", () => {
    render(<Pagination hasPrev hasNext onPrev={vi.fn()} onNext={vi.fn()} disabled />);

    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });
});
