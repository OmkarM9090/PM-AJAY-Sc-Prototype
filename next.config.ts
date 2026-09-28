import type { NextConfig } from "next";

/** Keep browser requests relative; Next proxies them to FastAPI in local/preview use. */
const nextConfig: NextConfig = {
  async rewrites() {
    const apiBase = process.env.JEEVIKASETU_API_URL || "http://127.0.0.1:8000";
    return [{ source: "/api/:path*", destination: `${apiBase}/api/:path*` }];
  },
};

export default nextConfig;
