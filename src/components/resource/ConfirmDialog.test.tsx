import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/client";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("renders nothing when closed", () => {
    render(
      <ConfirmDialog
        open={false}
        title="Delete queue"
        message="Are you sure?"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the title, message, and default confirm label when open", () => {
    render(
      <ConfirmDialog
        open
        title="Delete queue"
        message="Are you sure you want to delete orders?"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Delete queue")).toBeInTheDocument();
    expect(screen.getByText("Are you sure you want to delete orders?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });

  it("uses a custom confirm label and calls onConfirm/onClose", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ConfirmDialog
        open
        title="Delete queue"
        message="Are you sure?"
        confirmLabel="Delete queue"
        danger
        onClose={onClose}
        onConfirm={onConfirm}
        isPending={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete queue" }));
    expect(onConfirm).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows a server error message when one is present", () => {
    const error = new ApiError(
      { code: "RESOURCE_CONFLICT", message: "Queue is not empty.", requestId: null, retryable: false },
      409,
    );

    render(
      <ConfirmDialog
        open
        title="Delete queue"
        message="Are you sure?"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
        error={error}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Queue is not empty.");
  });
});
