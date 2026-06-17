import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // povolené hodnoty `quality` pro <Image quality={...}>
    qualities: [75, 90, 92],
  },
};

export default nextConfig;
