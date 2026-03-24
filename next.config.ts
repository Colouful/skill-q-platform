import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** 18.4 现代格式；远程头像/封面请在环境变量中配置域名并追加到 remotePatterns */
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: (() => {
      const host = process.env.NEXT_PUBLIC_IMAGE_HOST?.trim();
      if (!host) return [];
      try {
        const u = new URL(host.startsWith("http") ? host : `https://${host}`);
        return [
          {
            protocol: u.protocol.replace(":", "") as "http" | "https",
            hostname: u.hostname,
            pathname: "/**",
            ...(u.port ? { port: u.port } : {}),
          },
        ];
      } catch {
        return [];
      }
    })(),
  },
  /** Docker 部署：生成 .next/standalone，配合根目录 Dockerfile */
  output: "standalone",
  /** 避免 Turbopack 将 Prisma 运行时错误打平，导致 `prisma.skill` 等 delegate 丢失 */
  serverExternalPackages: [
    "prisma",
    "@prisma/client",
    "@prisma/adapter-mariadb",
    "mariadb",
    "minio",
  ],
};

export default nextConfig;
