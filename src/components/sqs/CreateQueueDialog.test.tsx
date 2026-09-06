import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { server } from "../../test/mocks/server";
import { renderWithProviders } from "../../test/utils";
import { CreateQueueDialog } from "./CreateQueueDialog";

describe("CreateQueueDialog", () => {
  it("rejects names with invalid characters", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateQueueDialog open onClose={vi.fn()} />);

    await user.type(screen.getByLabelText(/queue name/i), "not a valid name!");
    await user.click(screen.getByRole("button", { name: /create queue/i }));

    expect(await screen.findByText(/letters, numbers, hyphens, and underscores/i)).toBeInTheDocument();
  });

  it("rejects an empty name", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateQueueDialog open onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /create queue/i }));

    expect(await screen.findByText(/queue name is required/i)).toBeInTheDocument();
  });

  it("submits a valid name and closes on success", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<CreateQueueDialog open onClose={onClose} />);

    await user.type(screen.getByLabelText(/queue name/i), "order-events");
    await user.click(screen.getByRole("button", { name: /create queue/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("shows the server error and keeps the dialog open on failure", async () => {
    server.use(
      http.post("/api/resources/sqs/queues", () => {
        return HttpResponse.json(
          {
            error: {
              code: "RESOURCE_ALREADY_EXISTS",
              message: "A queue with this name already exists.",
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
    renderWithProviders(<CreateQueueDialog open onClose={onClose} />);

    await user.type(screen.getByLabelText(/queue name/i), "taken-name");
    await user.click(screen.getByRole("button", { name: /create queue/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/already exists/i);
    expect(onClose).not.toHaveBeenCalled();
  });
});
