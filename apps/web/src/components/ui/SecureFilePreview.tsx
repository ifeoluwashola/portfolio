"use client";

import { useEffect, useState } from "react";
import { Download, FileText, Loader2, Image as ImageIcon, AlertTriangle } from "lucide-react";

interface SecureFilePreviewProps {
  fileKey: string;
  fileName: string;
  /**
   * "student" uses academy_token via /api/v1/media/download-url
   * "admin" uses auth_token via /api/admin/proxy/v1/admin/media/download-url
   */
  mode?: "student" | "admin";
}

function getFileType(fileName: string): "image" | "pdf" | "other" {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext ?? "")) return "image";
  if (ext === "pdf") return "pdf";
  return "other";
}

export function SecureFilePreview({ fileKey, fileName, mode = "student" }: SecureFilePreviewProps) {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUrl() {
      setLoading(true);
      setError(null);
      try {
        const endpoint =
          mode === "admin"
            ? `/api/admin/proxy/v1/admin/media/download-url?key=${encodeURIComponent(fileKey)}`
            : `/api/academy/proxy/v1/media/download-url?key=${encodeURIComponent(fileKey)}`;

        const res = await fetch(endpoint, { cache: "no-store" });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to fetch download URL");
        }
        const data = await res.json() as { download_url: string };
        setDownloadUrl(data.download_url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchUrl();
  }, [fileKey, mode]);

  const fileType = getFileType(fileName);

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
        <span className="text-xs font-mono tracking-widest uppercase">Loading preview...</span>
      </div>
    );
  }

  if (error || !downloadUrl) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-red-400">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span className="text-xs font-mono">Preview unavailable: {error}</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-yellow-500/10 bg-slate-900/40 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-black/20">
        <div className="flex items-center gap-2">
          {fileType === "image" && <ImageIcon className="w-3.5 h-3.5 text-yellow-500" />}
          {fileType === "pdf"   && <FileText   className="w-3.5 h-3.5 text-yellow-500" />}
          {fileType === "other" && <Download   className="w-3.5 h-3.5 text-yellow-500" />}
          <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase truncate max-w-[200px]">
            {fileName}
          </span>
        </div>
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          download={fileName}
          className="flex items-center gap-1.5 text-[10px] font-bold text-yellow-500 hover:text-yellow-400 transition-colors uppercase tracking-widest"
        >
          <Download className="w-3 h-3" />
          Download
        </a>
      </div>

      {/* Content area */}
      <div className="p-4">
        {fileType === "image" && (
          <img
            src={downloadUrl}
            alt={fileName}
            className="w-full max-h-[400px] object-contain rounded-lg border border-slate-800"
          />
        )}
        {fileType === "pdf" && (
          <iframe
            src={downloadUrl}
            title={fileName}
            width="100%"
            height="500px"
            className="rounded-lg border border-slate-800"
          />
        )}
        {fileType === "other" && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-300 mb-1">{fileName}</p>
              <p className="text-xs text-slate-500">Preview not available for this file type.</p>
            </div>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={fileName}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold text-sm rounded-xl transition-all"
            >
              <Download className="w-4 h-4" />
              Download File
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
