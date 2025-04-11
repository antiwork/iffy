import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

function getAllowedDevOrigins() {
  const getOrigin = (url) => {
    const urlObj = new URL(url);
    return urlObj.host;
  };

  const allowedOrigins = ["http://localhost:3000", process.env.LOCAL_HOST_PROXY_URL];

  return allowedOrigins
    .map((origin) => {
      if (origin) {
        return getOrigin(origin);
      }
      return null;
    })
    .filter(Boolean);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/dashboard/records",
        destination: "/dashboard/moderations",
        permanent: false,
      },
    ];
  },
  transpilePackages: ["pg"],
  productionBrowserSourceMaps: true,
  allowedDevOrigins: getAllowedDevOrigins(),
  env: {
    NEXT_PUBLIC_SLACK_CLIENT_ID: process.env.NEXT_PUBLIC_SLACK_CLIENT_ID,
    ...(process.env.LOCAL_HOST_PROXY_URL && {
      NEXT_PUBLIC_LOCAL_HOST_PROXY_URL: process.env.LOCAL_HOST_PROXY_URL,
    }),
  },
};

export default withMDX(nextConfig);
