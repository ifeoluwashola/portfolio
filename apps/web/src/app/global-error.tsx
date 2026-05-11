"use client";

// global-error.tsx catches errors thrown inside the root layout itself.
// It MUST include its own <html> and <body> tags because the root layout has crashed.

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[Kybern Global Error Boundary]", error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <title>Critical Error — Kybern Nexus</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background-color: #0f172a;
            color: #f8fafc;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
          }
          .container {
            text-align: center;
            max-width: 500px;
            width: 100%;
          }
          .icon-ring {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 80px;
            height: 80px;
            border-radius: 9999px;
            border: 1px solid rgba(239, 68, 68, 0.3);
            background-color: rgba(239, 68, 68, 0.1);
            margin-bottom: 1.5rem;
          }
          .label {
            font-family: ui-monospace, "Cascadia Code", monospace;
            font-size: 0.7rem;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: #f87171;
            margin-bottom: 1rem;
          }
          h1 {
            font-size: 1.75rem;
            font-weight: 800;
            margin-bottom: 0.75rem;
            line-height: 1.2;
          }
          p {
            color: #94a3b8;
            font-size: 0.9rem;
            line-height: 1.6;
            margin-bottom: 2.5rem;
          }
          .actions {
            display: flex;
            gap: 0.75rem;
            justify-content: center;
            flex-wrap: wrap;
          }
          .btn-primary {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.75rem 1.5rem;
            border-radius: 0.75rem;
            font-size: 0.875rem;
            font-weight: 600;
            background-color: #ef4444;
            color: #fff;
            border: none;
            cursor: pointer;
            transition: background-color 0.15s;
            text-decoration: none;
          }
          .btn-primary:hover { background-color: #dc2626; }
          .btn-secondary {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.75rem 1.5rem;
            border-radius: 0.75rem;
            font-size: 0.875rem;
            font-weight: 600;
            background: transparent;
            color: #f8fafc;
            border: 1px solid #334155;
            cursor: pointer;
            transition: background-color 0.15s;
            text-decoration: none;
          }
          .btn-secondary:hover { background-color: #1e293b; }
          .footer-note {
            margin-top: 3rem;
            font-family: ui-monospace, monospace;
            font-size: 0.65rem;
            color: rgba(148, 163, 184, 0.4);
            letter-spacing: 0.1em;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="icon-ring">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>

          <p className="label">Critical System Error</p>

          <h1>The app encountered a fatal error</h1>
          <p>
            Something broke at the root level of the application. This is unusual —
            our team has been notified. You can try reloading the page.
          </p>

          <div className="actions">
            <button onClick={reset} className="btn-primary">
              Reload App
            </button>
            <a href="/" className="btn-secondary">
              ← Go Home
            </a>
          </div>

          <p className="footer-note">KYBERN NEXUS · CRITICAL ERROR</p>
        </div>
      </body>
    </html>
  );
}
