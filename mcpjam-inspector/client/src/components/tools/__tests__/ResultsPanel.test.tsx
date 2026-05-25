import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResultsPanel } from "../ResultsPanel";
import { UIType } from "@/lib/mcp-ui/mcp-apps-utils";

vi.mock("@/lib/mcp-ui/mcp-apps-utils", () => ({
  UIType: {
    MCP_APPS: "mcp-apps",
    OPENAI_SDK: "openai-sdk",
    OPENAI_SDK_AND_MCP_APPS: "openai-sdk-and-mcp-apps",
    MCP_UI: "mcp-ui",
  },
  detectUIType: vi.fn(),
  getUIResourceUri: vi.fn(),
}));

vi.mock("../ToolResultRenderer", () => ({
  ToolResultRenderer: () => (
    <div data-testid="tool-result-renderer">Widget Preview</div>
  ),
}));

vi.mock("@/components/ui/json-editor", () => ({
  JsonEditor: () => <div data-testid="json-editor">JSON</div>,
}));

import {
  detectUIType,
  getUIResourceUri,
} from "@/lib/mcp-ui/mcp-apps-utils";

const mockDetectUIType = detectUIType as ReturnType<typeof vi.fn>;
const mockGetUIResourceUri = getUIResourceUri as ReturnType<typeof vi.fn>;

const plainResult = {
  content: [{ type: "text", text: "Hello" }],
} as any;

const baseProps = {
  error: "",
  result: null,
  validationErrors: undefined,
  unstructuredValidationResult: "not_applicable" as const,
};

describe("ResultsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDetectUIType.mockReturnValue(null);
    mockGetUIResourceUri.mockReturnValue(null);
  });

  describe("empty state", () => {
    it("shows placeholder when there is no result or error", () => {
      render(<ResultsPanel {...baseProps} />);
      expect(
        screen.getByText("Execute a tool to see results here"),
      ).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("shows error message when error is provided", () => {
      render(<ResultsPanel {...baseProps} error="Something went wrong" />);
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });
  });

  describe("plain result (no UI component)", () => {
    it("shows JSON editor for a plain result", () => {
      render(<ResultsPanel {...baseProps} result={plainResult} />);
      expect(screen.getByTestId("json-editor")).toBeInTheDocument();
    });

    it("does not show Preview/Raw toggle buttons for a plain result", () => {
      render(<ResultsPanel {...baseProps} result={plainResult} />);
      expect(screen.queryByRole("button", { name: /preview/i })).toBeNull();
      expect(screen.queryByRole("button", { name: /raw/i })).toBeNull();
    });
  });

  describe("UI component result", () => {
    const uiProps = {
      ...baseProps,
      result: plainResult,
      serverId: "server-1",
      toolName: "my-tool",
      toolInput: { x: 1 } as Record<string, unknown>,
    };

    beforeEach(() => {
      mockDetectUIType.mockReturnValue(UIType.OPENAI_SDK);
    });

    it("shows Preview and Raw toggle buttons", () => {
      render(<ResultsPanel {...uiProps} />);
      expect(screen.getByRole("button", { name: /preview/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /raw/i })).toBeInTheDocument();
    });

    it("defaults to preview mode", () => {
      render(<ResultsPanel {...uiProps} />);
      expect(screen.getByTestId("tool-result-renderer")).toBeInTheDocument();
      expect(screen.queryByTestId("json-editor")).toBeNull();
    });

    it("switches to raw JSON view when Raw button is clicked", () => {
      render(<ResultsPanel {...uiProps} />);
      fireEvent.click(screen.getByRole("button", { name: /raw/i }));
      expect(screen.getByTestId("json-editor")).toBeInTheDocument();
      expect(screen.queryByTestId("tool-result-renderer")).toBeNull();
    });

    it("switches back to preview when Preview button is clicked", () => {
      render(<ResultsPanel {...uiProps} />);
      fireEvent.click(screen.getByRole("button", { name: /raw/i }));
      fireEvent.click(screen.getByRole("button", { name: /preview/i }));
      expect(screen.getByTestId("tool-result-renderer")).toBeInTheDocument();
    });

    it("falls back to raw mode when result is cleared", () => {
      const { rerender } = render(<ResultsPanel {...uiProps} />);
      expect(screen.getByTestId("tool-result-renderer")).toBeInTheDocument();

      mockDetectUIType.mockReturnValue(null);
      rerender(<ResultsPanel {...uiProps} result={null} />);
      expect(screen.queryByTestId("tool-result-renderer")).toBeNull();
    });
  });

  describe("validation errors", () => {
    it("shows validation errors panel when validationErrors is provided", () => {
      render(
        <ResultsPanel
          {...baseProps}
          result={plainResult}
          validationErrors={[{ message: "required field missing", instancePath: "/name" }]}
        />,
      );
      expect(screen.getByText(/required field missing/i)).toBeInTheDocument();
    });

    it("shows valid badge when validationErrors is null", () => {
      render(
        <ResultsPanel {...baseProps} result={plainResult} validationErrors={null} />,
      );
      expect(screen.getByText("Valid")).toBeInTheDocument();
    });

    it("shows invalid badge when validationErrors is a non-empty array", () => {
      render(
        <ResultsPanel
          {...baseProps}
          result={plainResult}
          validationErrors={[{ message: "bad" }]}
        />,
      );
      expect(screen.getByText("Invalid")).toBeInTheDocument();
    });
  });

  describe("response time", () => {
    it("shows milliseconds for fast responses", () => {
      render(
        <ResultsPanel {...baseProps} result={plainResult} responseDurationMs={42} />,
      );
      expect(screen.getByText("42 ms")).toBeInTheDocument();
    });

    it("shows seconds for slow responses", () => {
      render(
        <ResultsPanel {...baseProps} result={plainResult} responseDurationMs={2500} />,
      );
      expect(screen.getByText("2.50 s")).toBeInTheDocument();
    });

    it("hides response time when not provided", () => {
      render(<ResultsPanel {...baseProps} result={plainResult} />);
      expect(screen.queryByText(/ms|s$/)).toBeNull();
    });
  });
});
