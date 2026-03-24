"use client";

import { useTheme } from "@/themes/useTheme";
import { HomeHeroApple } from "./home-hero-apple";
import { HomeHeroInk } from "./home-hero-ink";
import { HomeHeroPixel } from "./home-hero-pixel";
import { HomeHeroSketch } from "./home-hero-sketch";

/** 首页 Hero 右上角装饰：按主题切换动画（像素 / 苹果 / 手绘 / 素描） */
export function HomeHeroDecor() {
  const { themeId, mounted } = useTheme();

  if (!mounted) {
    return <HomeHeroPixel />;
  }

  switch (themeId) {
    case "apple":
      return <HomeHeroApple />;
    case "sketch":
      return <HomeHeroSketch />;
    case "ink":
      return <HomeHeroInk />;
    default:
      return <HomeHeroPixel />;
  }
}
