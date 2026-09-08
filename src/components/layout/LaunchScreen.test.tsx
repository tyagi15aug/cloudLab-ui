import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../test/utils";
import { server } from "../../test/mocks/server";
import { LaunchScreen } from "./LaunchScreen";

describe("LaunchScreen", () => {
  it("renders children once the readiness endpoint reports overall: ready", async () => {
    // Default handler (src/test/mocks/handlers.ts) already returns ready.
    renderWithProviders(
      <LaunchScreen>
        <div>the actual app</div>
      </LaunchScreen>,
    );

    expect(await screen.findByText("the actual app")).toBeInTheDocument();
  });

  it("shows the checklist splash instead of children while still starting", async () => {
    server.use(
      http.get("/api/health", () => {
        return HttpResponse.json({ api: "ready", localstack: "starting", overall: "starting" });
      }),
    );

    renderWithProviders(
      <LaunchScreen>
        <div>the actual app</div>
      </LaunchScreen>,
    );

    await waitFor(() => {
      expect(screen.getByText("Waking API")).toBeInTheDocument();
      expect(screen.getByText("Starting LocalStack (SQS/S3)")).toBeInTheDocument();
    });
    expect(screen.queryByText("the actual app")).not.toBeInTheDocument();
  });
});
