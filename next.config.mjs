import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

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
};

export default withMDX(nextConfig);
