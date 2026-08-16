import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@libsql/client",
    "@prisma/adapter-libsql",
    "@prisma/client",
  ],
  outputFileTracingIncludes: {
    "*": ["./prisma/**/*"],
  },
};

export default nextConfig;
