"use client";

import React, { useEffect, useId, useState } from "react";
import { useTheme } from "next-themes";

interface MermaidProps {
  chart: string;
}

export const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const [svg, setSvg] = useState<string>("");
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { resolvedTheme } = useTheme();
  const rawId = useId();
  // Strip characters like colons from React 19 useId() to ensure valid DOM id
  const id = `mermaid-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    let isMounted = true;

    async function renderDiagram() {
      if (!chart) return;
      try {
        const mermaid = (await import("mermaid")).default;
        const isDark = resolvedTheme === "dark";

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: isDark ? "dark" : "neutral",
          fontFamily: "var(--font-sans), ui-sans-serif, system-ui, sans-serif",
          themeVariables: isDark
            ? {
                darkMode: true,
                background: "#1e293b",
                primaryColor: "#334155",
                primaryTextColor: "#f8fafc",
                primaryBorderColor: "#475569",
                lineColor: "#94a3b8",
                secondaryColor: "#1e293b",
                tertiaryColor: "#0f172a",
                noteBkgColor: "#1e293b",
                noteTextColor: "#f8fafc",
                mainBkg: "#1e293b",
                nodeBorder: "#475569",
              }
            : {
                darkMode: false,
                background: "#ffffff",
                primaryColor: "#f1f5f9",
                primaryTextColor: "#0f172a",
                primaryBorderColor: "#cbd5e1",
                lineColor: "#64748b",
                secondaryColor: "#f8fafc",
                tertiaryColor: "#ffffff",
                mainBkg: "#f8fafc",
                nodeBorder: "#cbd5e1",
              },
        });

        // Remove any stale temporary elements Mermaid might have left in document
        const stale = document.getElementById(id);
        if (stale) stale.remove();

        const { svg: renderedSvg } = await mermaid.render(id, chart);
        if (isMounted) {
          setSvg(renderedSvg);
          setHasError(false);
          setErrorMessage("");
        }
      } catch (err: any) {
        console.error("Failed to render Mermaid chart:", err);
        // Clean up error element created by mermaid if any
        const errEl = document.getElementById(`d${id}`);
        if (errEl) errEl.remove();

        if (isMounted) {
          setHasError(true);
          setErrorMessage(err?.message || "Failed to render chart");
        }
      }
    }

    renderDiagram();

    return () => {
      isMounted = false;
      const el = document.getElementById(id);
      if (el) el.remove();
      const errEl = document.getElementById(`d${id}`);
      if (errEl) errEl.remove();
    };
  }, [chart, resolvedTheme, id]);

  if (hasError) {
    return (
      <div className="my-8 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
        <p className="mb-2 text-xs font-semibold text-destructive">Mermaid syntax error: {errorMessage}</p>
        <pre className="overflow-x-auto rounded-lg bg-kn-card p-3 text-xs font-mono text-kn-heading">
          <code>{chart}</code>
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-8 flex w-full items-center justify-center rounded-xl border border-border bg-card/40 p-8">
        <div className="h-28 w-full max-w-md animate-pulse rounded-lg bg-muted/40" />
      </div>
    );
  }

  return (
    <div
      className="my-8 flex w-full justify-center overflow-x-auto rounded-xl border border-border bg-card/60 p-6 shadow-sm backdrop-blur-xs [&>svg]:max-w-full [&>svg]:h-auto transition-all"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};
