"use client";

import { CldImage } from "next-cloudinary";

interface CloudinaryImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export function CloudinaryImage({
  src,
  alt,
  width = 400,
  height = 300,
  className = "",
}: CloudinaryImageProps) {
  return (
    <CldImage
      src={src}
      width={width}
      height={height}
      alt={alt}
      className={`object-cover rounded-lg transition-all duration-300 ${className}`}
    />
  );
}
