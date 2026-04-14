import os from "node:os";
import path from "node:path";
import type { NextConfig } from "next";

function collectAllowedDevOrigins() {
  const hosts = new Set(["localhost", "127.0.0.1"]);

  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4" && !entry.internal && entry.address) {
        hosts.add(entry.address);
      }
    }
  }

  const extra = process.env.NEXT_ALLOWED_DEV_ORIGINS?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  for (const host of extra ?? []) {
    hosts.add(host.replace(/^https?:\/\//, ""));
  }

  return Array.from(hosts);
}

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
  /** 将 Next 自己需要的 .next/types 校验隔离到专用 tsconfig，避免日常 `tsc` 被生成产物噪音干扰 */
  typescript: {
    tsconfigPath: "./tsconfig.next.json",
  },
  /**
   * 开发环境允许通过局域网 IP 访问 dev server，避免 HMR / 字体等 dev 资源被 403 拦截。
   * Next 官方支持通过 allowedDevOrigins 配置附加来源。
   */
  allowedDevOrigins: collectAllowedDevOrigins(),
  /** 固定 Turbopack 工作区根目录，避免多 lockfile 场景下错误上浮到用户主目录 */
  turbopack: {
    root: path.resolve(__dirname),
  },
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
