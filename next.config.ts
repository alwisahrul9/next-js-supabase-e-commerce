import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: `tfkmuhzmkuzqqguguqyp.supabase.co`,
        pathname: "/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
