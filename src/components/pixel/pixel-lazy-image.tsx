import Image, { type ImageProps } from "next/image";

/** 18.4 统一懒加载与异步解码；远程图需在 next.config 配置 images.remotePatterns */
export function PixelLazyImage(props: ImageProps) {
  const { loading, decoding, ...rest } = props;
  return (
    <Image
      {...rest}
      loading={loading ?? "lazy"}
      decoding={decoding ?? "async"}
    />
  );
}
