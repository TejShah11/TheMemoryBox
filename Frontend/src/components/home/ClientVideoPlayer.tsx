'use client';

import { CldVideoPlayer } from "next-cloudinary"
import 'next-cloudinary/dist/cld-video-player.css';

interface ClientVideoPlayerProps {
  publicId: string;
}

export default function ClientVideoPlayer({ publicId }: ClientVideoPlayerProps) {
  // console.log(publicId)
  return (
    <div className="aspect-video">
      <CldVideoPlayer
        width="400"
        height="300"
        src={publicId}
        className="w-full h-auto rounded-lg"
      />
    </div>
  );
}