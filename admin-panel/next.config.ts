import type { NextConfig } from "next";

// Admin panel, backend ile ayni sunucudan "/admin" altinda sunulur:
// `npm run build` -> out/ -> backend/static/admin/ (main.py oradan servis eder).
// Ayni origin oldugu icin API cagrilari "/api" ile gider, CORS gerekmez.
const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/admin',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
