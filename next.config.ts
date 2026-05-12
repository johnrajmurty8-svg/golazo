import type { NextConfig } from "next";
import path from "path";

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-eval/inline needed by Next.js dev mode; tighten post-launch
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  // Pin Turbopack's workspace root to this project so it doesn't climb up into
  // the parent "AI Projects" folder (where it can't find a package.json or
  // node_modules and ends up failing to resolve workspace-level deps like
  // tailwindcss).
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Same idea for the standard webpack file-tracing root used by the build /
  // production runtime.
  outputFileTracingRoot: path.resolve(__dirname),
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // The document-viewer proxy must be embeddable in our own iframe.
        // The global rule above blocks all framing (X-Frame-Options: DENY +
        // frame-ancestors 'none'); this override relaxes both to same-origin
        // for this single endpoint only.
        source: "/api/trips/:tripId/vault/:docId/url",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
