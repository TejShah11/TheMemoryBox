"use client";
import React, { useCallback, useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { Button } from "../ui/button";
import { Session } from "next-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { PlusIcon } from "lucide-react";

const CloudinaryImageUploader = ({ session }: { session: Session | null }) => {
  const [isUploading, setIsUploading] = useState(false);

  // Handle Image Upload Success
  const handleUploadSuccess = async (result: any) => {
    const { public_id, secure_url } = result?.info;
    const userEmail = session?.user?.email;

    if (!public_id || !secure_url || !userEmail) {
      console.error("Missing required fields to update the database.");
      return;
    }

    // Call the API to save the image record in the database
    try {
      const response = await fetch("/api/images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          public_id,
          public_url: secure_url,
          owner: userEmail,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save image record in the database.");
      }

      const data = await response.json();
      console.log("Image record saved:", data);
    } catch (error) {
      console.error("Error saving image record:", error);
    }
  };

  return (
    <div>
      <CldUploadWidget
        uploadPreset="raiseume" // Replace with your Cloudinary preset
        onClose={() => setIsUploading(false)}
        onSuccess={(result) => {
          handleUploadSuccess(result);
          setIsUploading(false);
        }}
      >
        {({ widget, open }) => {
          const handleOnClick = () => {
            setIsUploading(true);
            open(widget);
          };

          return (
            <Button
              onClick={handleOnClick}
              disabled={isUploading}
              className="rounded-full px-4 py-2 font-bold"
            >
              {useIsMobile() ? (
                <PlusIcon size={24} />
              ) : isUploading ? (
                "Uploading..."
              ) : (
                "Upload a Memory"
              )}
            </Button>
          );
        }}
      </CldUploadWidget>
    </div>
  );
};

export default CloudinaryImageUploader;
