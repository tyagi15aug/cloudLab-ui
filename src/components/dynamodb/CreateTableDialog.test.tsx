import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { server } from "../../test/mocks/server";
import { renderWithProviders } from "../../test/utils";
import { CreateTableDialog } from "./CreateTableDialog";

describe("CreateTableDialog", () => {
  it("requires a table name and partition key", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateTableDialog open onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /create table/i }));

    expect(await screen.findByText(/table name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/partition key is required/i)).toBeInTheDocument();
  });

  it("only requires a sort key once 'Add a sort key' is checked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateTableDialog open onClose={vi.fn()} />);

    await user.type(screen.getByLabelText(/table name/i), "users");
    await user.type(screen.getByLabelText(/^partition key$/i), "id");
    await user.click(screen.getByRole("button", { name: /create table/i }));

    expect(screen.queryByText(/sort key is required/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: /add a sort key/i }));
    await user.click(screen.getByRole("button", { name: /create table/i }));

    expect(await screen.findByText(/sort key is required/i)).toBeInTheDocument();
  });

  it("submits partition-key-only tables and closes on success", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<CreateTableDialog open onClose={onClose} />);

    await user.type(screen.getByLabelText(/table name/i), "users");
    await user.type(screen.getByLabelText(/^partition key$/i), "id");
    await user.click(screen.getByRole("button", { name: /create table/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("submits a composite key when a sort key is added", async () => {
    let captured: Record<string, unknown> | undefined;
    server.use(
      http.post("/api/resources/dynamodb/tables", async ({ request }) => {
        captured = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            id: "orders",
            name: "orders",
            arn: "arn:aws:dynamodb:us-east-1:000000000000:table/orders",
            region: "us-east-1",
            status: "ACTIVE",
            item_count: 0,
            created_at: 0,
            partition_key: { name: "pk", type: "S" },
            sort_key: { name: "sk", type: "N" },
          },
          { status: 201 },
        );
      }),
    );

    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<CreateTableDialog open onClose={onClose} />);

    await user.type(screen.getByLabelText(/table name/i), "orders");
    await user.type(screen.getByLabelText(/^partition key$/i), "pk");
    await user.click(screen.getByRole("checkbox", { name: /add a sort key/i }));
    await user.type(screen.getByLabelText(/^sort key$/i), "sk");
    // Both partition and sort key selects share the label text "Type" —
    // the sort key one is the second to appear once its section unfolds.
    await user.selectOptions(screen.getAllByLabelText(/^type$/i)[1], "N");
    await user.click(screen.getByRole("button", { name: /create table/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(captured).toMatchObject({ name: "orders", partition_key: "pk", sort_key: "sk", sort_key_type: "N" });
  });

  it("shows the server error and keeps the dialog open on failure", async () => {
    server.use(
      http.post("/api/resources/dynamodb/tables", () => {
        return HttpResponse.json(
          {
            error: {
              code: "RESOURCE_ALREADY_EXISTS",
              message: "A table with this name already exists.",
              requestId: "req-3",
              retryable: false,
            },
          },
          { status: 409 },
        );
      }),
    );

    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<CreateTableDialog open onClose={onClose} />);

    await user.type(screen.getByLabelText(/table name/i), "users");
    await user.type(screen.getByLabelText(/^partition key$/i), "id");
    await user.click(screen.getByRole("button", { name: /create table/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/already exists/i);
    expect(onClose).not.toHaveBeenCalled();
  });
});
