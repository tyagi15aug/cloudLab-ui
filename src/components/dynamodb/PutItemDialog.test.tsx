import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { server } from "../../test/mocks/server";
import { renderWithProviders } from "../../test/utils";
import { PutItemDialog } from "./PutItemDialog";

describe("PutItemDialog", () => {
  it("shows the key hint referencing the table's partition key", () => {
    renderWithProviders(<PutItemDialog open onClose={vi.fn()} tableName="users" partitionKeyHint="id" />);

    expect(screen.getByText(/must include the table's key attribute — "id"/i)).toBeInTheDocument();
  });

  it("rejects invalid JSON", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PutItemDialog open onClose={vi.fn()} tableName="users" partitionKeyHint="id" />);

    // user-event's .type() treats a lone "{" as the start of special-key
    // syntax, so a literal opening brace must be doubled to escape it — a
    // closing "}" on its own is already literal and needs no escaping.
    await user.type(screen.getByLabelText(/item \(json\)/i), "{{not valid json");
    await user.click(screen.getByRole("button", { name: /put item/i }));

    expect(await screen.findByText("Not valid JSON.")).toBeInTheDocument();
  });

  it("rejects JSON that isn't a plain object", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PutItemDialog open onClose={vi.fn()} tableName="users" partitionKeyHint="id" />);

    await user.type(screen.getByLabelText(/item \(json\)/i), "[[1, 2, 3]");
    await user.click(screen.getByRole("button", { name: /put item/i }));

    expect(await screen.findByText(/must be a json object/i)).toBeInTheDocument();
  });

  it("submits a valid item and closes on success", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<PutItemDialog open onClose={onClose} tableName="users" partitionKeyHint="id" />);

    await user.type(screen.getByLabelText(/item \(json\)/i), '{{"id": "1", "name": "Alice"}');
    await user.click(screen.getByRole("button", { name: /put item/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("shows the server error and keeps the dialog open on failure", async () => {
    server.use(
      http.post("/api/resources/dynamodb/tables/:name/items", () => {
        return HttpResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Item is missing the table's key attribute.",
              requestId: "req-4",
              retryable: false,
            },
          },
          { status: 400 },
        );
      }),
    );

    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<PutItemDialog open onClose={onClose} tableName="users" partitionKeyHint="id" />);

    await user.type(screen.getByLabelText(/item \(json\)/i), '{{"name": "Alice"}');
    await user.click(screen.getByRole("button", { name: /put item/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/missing the table's key attribute/i);
    expect(onClose).not.toHaveBeenCalled();
  });
});
