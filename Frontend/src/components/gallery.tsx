"use client";

import { CloudinaryImage } from "./cloudinary-image";

export interface GalleryImage {
  id: string;
  public_id: string;
  title: string;
  user_id: string;
  created_at: string;
}

interface GalleryProps {
  images: GalleryImage[];
}

export function Gallery({ images }: GalleryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {images.map((image) => (
        <div key={image.id} className="group relative overflow-hidden rounded-lg">
          <CloudinaryImage
            src={image.public_id}
            alt={image.title || "Gallery image"}
            className="group-hover:scale-105 group-hover:opacity-75"
          />
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4">
            <p className="text-white text-sm font-medium truncate">
              {image.title || "Untitled"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
