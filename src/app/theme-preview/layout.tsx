import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "主题预览",
  description: "四款主题的色板与切换器验收页",
};

export default function ThemePreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
