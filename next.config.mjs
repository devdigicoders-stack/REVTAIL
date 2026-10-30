// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
//   images: {
//     remotePatterns: [
//       {
//         protocol: "https",
//         hostname: "pub-501eba8c4e974d04b63a1d47ce290bde.r2.dev",
//       },
//       {
//       protocol: "https",
//       hostname: "yt3.ggpht.com",
//     },
//     ],
//   },
// };

// export default nextConfig;


/** @type {import('next').NextConfig} */
const nextConfig = {
   /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-501eba8c4e974d04b63a1d47ce290bde.r2.dev",
      },
      {
      protocol: "https",
      hostname: "yt3.ggpht.com",
    },
    ],
  },
};

export default nextConfig;