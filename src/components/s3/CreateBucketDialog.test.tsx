import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { server } from "../../test/mocks/server";
import { renderWithProviders } from "../../test/utils";
import { CreateBucketDialog } from "./CreateBucketDialog";

describe("CreateBucketDialog", () => {
  it("validates input before submitting", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateBucketDialog open onClose={vi.fn()} />);

    await user.type(screen.getByLabelText(/bucket name/i), "ab"); // too short
    await user.click(screen.getByRole("button", { name: /create bucket/i }));

    expect(await screen.findByText(/3–63 characters/i)).toBeInTheDocument();
  });

  it("submits the request and shows success by closing the dialog", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<CreateBucketDialog open onClose={onClose} />);

    await user.type(screen.getByLabelText(/bucket name/i), "my-new-bucket");
    await user.click(screen.getByRole("button", { name: /create bucket/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("handles a failed request by showing the server error and keeping the dialog open", async () => {
    server.use(
      http.post("/api/resources/s3/buckets", () => {
        return HttpResponse.json(
          {
            error: {
              code: "RESOURCE_ALREADY_EXISTS",
              message: "A bucket with this name already exists.",
              requestId: "req-1",
              retryable: false,
            },
          },
          { status: 409 },
        );
      }),
    );

    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<CreateBucketDialog open onClose={onClose} />);

    await user.type(screen.getByLabelText(/bucket name/i), "taken-name");
    await user.click(screen.getByRole("button", { name: /create bucket/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/already exists/i);
    expect(onClose).not.toHaveBeenCalled();
  });
});
