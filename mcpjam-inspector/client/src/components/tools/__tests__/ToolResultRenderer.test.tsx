import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { ToolResultRenderer } from "../ToolResultRenderer";
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

vi.mock("@/lib/apis/mcp-tools-api", () => ({
  callTool: vi.fn(),
}));

vi.mock("@/components/chat-v2/thread/mcp-apps/mcp-apps-renderer", () => ({
  MCPAppsRenderer: (props: Record<string, unknown>) => (
    <div data-testid="mcp-apps-renderer" data-server-id={props.serverId as string} />
  ),
}));

vi.mock("@/components/chat-v2/thread/chatgpt-app-renderer", () => ({
  ChatGPTAppRenderer: (props: Record<string, unknown>) => (
    <div data-testid="chatgpt-app-renderer" data-server-id={props.serverId as string} />
  ),
}));

import {
  detectUIType,
  getUIResourceUri,
} from "@/lib/mcp-ui/mcp-apps-utils";

const mockDetectUIType = detectUIType as ReturnType<typeof vi.fn>;
const mockGetUIResourceUri = getUIResourceUri as ReturnType<typeof vi.fn>;

const baseProps = {
  serverId: "server-1",
  toolName: "my-tool",
  toolInput: { foo: "bar" },
  toolOutput: { content: [{ type: "text", text: "ok" }] } as any,
};

describe("ToolResultRenderer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUIResourceUri.mockReturnValue(null);
  });

  it("renders nothing for a plain tool result", () => {
    mockDetectUIType.mockReturnValue(null);

    const { container } = render(<ToolResultRenderer {...baseProps} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders ChatGPTAppRenderer for OPENAI_SDK type", () => {
    mockDetectUIType.mockReturnValue(UIType.OPENAI_SDK);
    mockGetUIResourceUri.mockReturnValue("template-string");

    const { getByTestId } = render(<ToolResultRenderer {...baseProps} />);
    expect(getByTestId("chatgpt-app-renderer")).toBeInTheDocument();
  });

  it("renders ChatGPTAppRenderer for OPENAI_SDK_AND_MCP_APPS type", () => {
    mockDetectUIType.mockReturnValue(UIType.OPENAI_SDK_AND_MCP_APPS);
    mockGetUIResourceUri.mockReturnValue("ui://resource");

    const { getByTestId } = render(<ToolResultRenderer {...baseProps} />);
    expect(getByTestId("chatgpt-app-renderer")).toBeInTheDocument();
  });

  it("renders MCPAppsRenderer for MCP_APPS type when resourceUri is present", () => {
    mockDetectUIType.mockReturnValue(UIType.MCP_APPS);
    mockGetUIResourceUri.mockReturnValue("ui://my-widget");

    const { getByTestId } = render(<ToolResultRenderer {...baseProps} />);
    expect(getByTestId("mcp-apps-renderer")).toBeInTheDocument();
  });

  it("renders nothing for MCP_APPS type when resourceUri is absent", () => {
    mockDetectUIType.mockReturnValue(UIType.MCP_APPS);
    mockGetUIResourceUri.mockReturnValue(null);

    const { container } = render(<ToolResultRenderer {...baseProps} />);
    expect(container.firstChild).toBeNull();
  });

  it("passes serverId to the renderer", () => {
    mockDetectUIType.mockReturnValue(UIType.OPENAI_SDK);
    mockGetUIResourceUri.mockReturnValue("template");

    const { getByTestId } = render(
      <ToolResultRenderer {...baseProps} serverId="my-server" />,
    );
    expect(getByTestId("chatgpt-app-renderer").dataset.serverId).toBe(
      "my-server",
    );
  });
});
