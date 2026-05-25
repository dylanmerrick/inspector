import { useState, useMemo, useCallback } from "react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { MCPAppsRenderer } from "@/components/chat-v2/thread/mcp-apps/mcp-apps-renderer";
import { ChatGPTAppRenderer } from "@/components/chat-v2/thread/chatgpt-app-renderer";
import {
  detectUIType,
  getUIResourceUri,
  UIType,
} from "@/lib/mcp-ui/mcp-apps-utils";
import { callTool } from "@/lib/apis/mcp-tools-api";
import type { DisplayMode } from "@/stores/ui-playground-store";

interface ToolResultRendererProps {
  serverId: string;
  toolName: string;
  toolInput: Record<string, unknown>;
  toolOutput: CallToolResult;
  toolMeta?: Record<string, unknown>;
}

export function ToolResultRenderer({
  serverId,
  toolName,
  toolInput,
  toolOutput,
  toolMeta,
}: ToolResultRendererProps) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>("inline");
  const [pipWidgetId, setPipWidgetId] = useState<string | null>(null);
  const [fullscreenWidgetId, setFullscreenWidgetId] = useState<string | null>(
    null,
  );

  const toolCallId = useMemo(() => crypto.randomUUID(), [toolOutput]);

  const uiType = detectUIType(toolMeta, toolOutput);
  const resourceUri = getUIResourceUri(uiType, toolMeta);

  const handleCallTool = useCallback(
    (name: string, params: Record<string, unknown>) =>
      callTool(serverId, name, params),
    [serverId],
  );

  const handleRequestPip = useCallback((id: string) => {
    setPipWidgetId(id);
    setDisplayMode("pip");
  }, []);

  const handleExitPip = useCallback((_id: string) => {
    setPipWidgetId(null);
    setDisplayMode("inline");
  }, []);

  const handleRequestFullscreen = useCallback((id: string) => {
    setFullscreenWidgetId(id);
    setDisplayMode("fullscreen");
  }, []);

  const handleExitFullscreen = useCallback((_id: string) => {
    setFullscreenWidgetId(null);
    setDisplayMode("inline");
  }, []);

  if (
    uiType === UIType.OPENAI_SDK ||
    uiType === UIType.OPENAI_SDK_AND_MCP_APPS
  ) {
    return (
      <ChatGPTAppRenderer
        serverId={serverId}
        toolCallId={toolCallId}
        toolName={toolName}
        toolState="output-available"
        toolInput={toolInput}
        toolOutput={toolOutput}
        toolMetadata={toolMeta}
        onCallTool={handleCallTool}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
        pipWidgetId={pipWidgetId}
        fullscreenWidgetId={fullscreenWidgetId}
        onRequestPip={handleRequestPip}
        onExitPip={handleExitPip}
        onRequestFullscreen={handleRequestFullscreen}
        onExitFullscreen={handleExitFullscreen}
        minimalMode
      />
    );
  }

  if (uiType === UIType.MCP_APPS && resourceUri) {
    return (
      <MCPAppsRenderer
        serverId={serverId}
        toolCallId={toolCallId}
        toolName={toolName}
        toolState="output-available"
        toolInput={toolInput}
        toolOutput={toolOutput}
        resourceUri={resourceUri}
        toolMetadata={toolMeta}
        onCallTool={handleCallTool}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
        pipWidgetId={pipWidgetId}
        fullscreenWidgetId={fullscreenWidgetId}
        onRequestPip={handleRequestPip}
        onExitPip={handleExitPip}
        onRequestFullscreen={handleRequestFullscreen}
        onExitFullscreen={handleExitFullscreen}
        minimalMode
      />
    );
  }

  return null;
}
