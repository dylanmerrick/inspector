import { useState, useEffect } from "react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock3,
  Code,
  Eye,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { detectUIType, UIType } from "@/lib/mcp-ui/mcp-apps-utils";
import { JsonEditor } from "@/components/ui/json-editor";
import { ToolResultRenderer } from "./ToolResultRenderer";

type UnstructuredStatus = "not_applicable" | "schema_mismatch";

interface ResultsPanelProps {
  error: string;
  result: CallToolResult | null;
  validationErrors: any[] | null | undefined;
  unstructuredValidationResult: UnstructuredStatus;
  toolMeta?: Record<string, any>;
  responseDurationMs?: number | null;
  serverId?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
}

export function ResultsPanel({
  error,
  result,
  validationErrors,
  unstructuredValidationResult,
  toolMeta,
  responseDurationMs,
  serverId,
  toolName,
  toolInput,
}: ResultsPanelProps) {
  const rawResult = result as unknown as Record<string, unknown> | null;
  const uiType = detectUIType(toolMeta, rawResult);
  const hasUIComponent =
    uiType === UIType.OPENAI_SDK ||
    uiType === UIType.MCP_APPS ||
    uiType === UIType.OPENAI_SDK_AND_MCP_APPS;

  const canRenderWidget =
    hasUIComponent && !!serverId && !!toolName && !!result;
  const [viewMode, setViewMode] = useState<"preview" | "raw">("raw");

  useEffect(() => {
    setViewMode(canRenderWidget ? "preview" : "raw");
  }, [canRenderWidget]);

  const formattedResponseTime =
    responseDurationMs == null
      ? null
      : responseDurationMs < 1000
        ? `${Math.round(responseDurationMs)} ms`
        : `${(responseDurationMs / 1000).toFixed(2)} s`;

  return (
    <div className="h-full flex flex-col bg-background break-all">
      {/* Header - fixed height */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <h2 className="text-xs font-semibold text-foreground">Response</h2>
          {validationErrors !== undefined &&
            (validationErrors === null ? (
              <Badge
                variant="default"
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-3 w-3 mr-1.5" />
                Valid
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1.5" />
                Invalid
              </Badge>
            ))}
          {formattedResponseTime && (
            <span className="inline-flex items-center text-xs font-medium text-muted-foreground">
              <Clock3 className="h-3 w-3 mr-1" />
              {formattedResponseTime}
            </span>
          )}
        </div>
        {canRenderWidget && (
          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === "preview" ? "secondary" : "ghost"}
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => setViewMode("preview")}
            >
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </Button>
            <Button
              variant={viewMode === "raw" ? "secondary" : "ghost"}
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => setViewMode("raw")}
            >
              <Code className="h-3 w-3 mr-1" />
              Raw
            </Button>
          </div>
        )}
      </div>

      {/* Content - fills remaining space */}
      {error ? (
        <div className="flex-1 p-4">
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-xs font-medium">
            {error}
          </div>
        </div>
      ) : validationErrors ? (
        <div className="flex-1 p-4">
          <h3 className="text-sm font-semibold text-destructive mb-2">
            Validation Errors
          </h3>
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <JsonEditor
              height="100%"
              value={validationErrors}
              readOnly
              showToolbar={false}
            />
            {Array.isArray(validationErrors) && validationErrors.length > 0 && (
              <span className="text-sm font-semibold text-destructive mb-2">{`${validationErrors[0].instancePath?.slice(1) ?? ""} ${validationErrors[0].message ?? ""}`}</span>
            )}
          </div>
        </div>
      ) : rawResult ? (
        <div className="flex-1 min-h-0 p-4 flex flex-col gap-4">
          {unstructuredValidationResult === "schema_mismatch" && (
            <Badge
              variant="destructive"
              className="flex-shrink-0 w-fit bg-amber-600 hover:bg-amber-700"
            >
              <AlertTriangle className="h-3 w-3 mr-1.5" />
              Warning: Tool declares an output schema but returned no
              structuredContent.
            </Badge>
          )}

          {canRenderWidget && viewMode === "preview" ? (
            <div className="flex-1 min-h-0 overflow-auto">
              <ToolResultRenderer
                serverId={serverId!}
                toolName={toolName!}
                toolInput={toolInput ?? {}}
                toolOutput={result!}
                toolMeta={toolMeta}
              />
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-hidden">
              <JsonEditor
                value={rawResult}
                readOnly
                showToolbar={false}
                height="100%"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-muted-foreground font-medium">
            Execute a tool to see results here
          </p>
        </div>
      )}
    </div>
  );
}
