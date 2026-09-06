import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { server } from "../../test/mocks/server";
import { renderWithProviders } from "../../test/utils";
import { SendMessageDialog } from "./SendMessageDialog";

describe("SendMessageDialog", () => {
  it("requires a message body before submitting", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SendMessageDialog open onClose={vi.fn()} queueName="orders" />);

    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByText(/message body is required/i)).toBeInTheDocument();
  });

  it("submits the body and closes on success", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<SendMessageDialog open onClose={onClose} queueName="orders" />);

    // user-event's .type() treats a lone "{" as the start of special-key
    // syntax, so a literal opening brace must be doubled to escape it — a
    // closing "}" on its own is already literal and needs no escaping.
    await user.type(screen.getByLabelText(/message body/i), '{{"orderId": "42"}');
    await user.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("shows the server error and keeps the dialog open on failure", async () => {
    server.use(
      http.post("/api/resources/sqs/queues/:name/messages", () => {
        return HttpResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Message body must not be empty.",
              requestId: "req-2",
              retryable: false,
            },
          },
          { status: 400 },
        );
      }),
    );

    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<SendMessageDialog open onClose={onClose} queueName="orders" />);

    await user.type(screen.getByLabelText(/message body/i), "hello");
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/must not be empty/i);
    expect(onClose).not.toHaveBeenCalled();
  });
});
