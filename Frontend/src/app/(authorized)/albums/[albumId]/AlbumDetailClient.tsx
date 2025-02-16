"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { CloudinaryImage } from "@/components/cloudinary-image";
import { Button } from "@/components/ui/button";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

// Improved type definition with more robust validation
interface Album {
  id: string;
  name: string;
  description: string;
  images: string[];
  collab: { userid: string; permission: "editor" | "viewer" }[];
  mainowner: string;
}

interface Collaborator {
  userid: string;
  permission: "editor" | "viewer";
}

export default function AlbumDetailClient({
  album,
  userEmail,
}: {
  album: Album;
  userEmail: string;
}) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>(
    album.collab,
  );
  const [newCollaborator, setNewCollaborator] = useState<Collaborator>({
    userid: "",
    permission: "viewer",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For adding a collaborator
  const handleAddCollaborator = async () => {
    try {
      const response = await fetch("/api/albums/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          albumId: album.id,
          collaborator: {
            userid: newCollaborator.userid,
            permission: newCollaborator.permission,
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state with new collaborator
        setCollaborators([...collaborators, data.collaborator]);
        setNewCollaborator({ userid: "", permission: "viewer" });
        setError(null);
      } else {
        setError(data.error || "Failed to add collaborator");
      }
    } catch (error) {
      console.error("Error adding collaborator:", error);
      setError("Network error. Please try again.");
    }
  };

  // For removing a collaborator
  const handleRemoveCollaborator = async (userid: string) => {
    try {
      const response = await fetch("/api/albums/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          albumId: album.id,
          collaboratorEmail: userid,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state by removing the collaborator
        setCollaborators(
          collaborators.filter((collab) => collab.userid !== userid),
        );
        setError(null);
      } else {
        setError(data.error || "Failed to remove collaborator");
      }
    } catch (error) {
      console.error("Error removing collaborator:", error);
      setError("Network error. Please try again.");
    }
  };

  return (
    <main className="container mx-auto px-4 py-2">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/albums"
          className="flex items-center text-zinc-600 hover:text-zinc-700"
        >
          <ArrowLeftIcon className="mr-2 h-5 w-5" />
          Back to Albums
        </Link>
      </div>

      <div className="mb-8 flex w-full items-start justify-between sm:flex-row">
        <div>
          <h1 className="mb-2 text-3xl font-bold">{album.name}</h1>
          <h2 className="mb-2 text-sm font-bold text-pink-500">
            Created by {album.mainowner}
          </h2>
          {album.description && (
            <p className="mb-2 text-sm text-zinc-600">{album.description}</p>
          )}
          <p className="text-sm text-zinc-500">
            {album.images.length}{" "}
            {album.images.length === 1 ? "photo" : "photos"}
          </p>
        </div>
        {album.mainowner === userEmail && (
          <Button variant="outline" onClick={() => setIsShareOpen(true)}>
            SHARE{" "}
            <DotLottieReact
              src="/images/share.json"
              className="relative z-10 -mx-4 w-14"
              useFrameInterpolation
              autoplay
              loop
              speed={0.5}
            />
          </Button>
        )}
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {album.images.map((imageUrl) => (
          <div
            key={imageUrl}
            className="relative aspect-square cursor-pointer hover:opacity-90"
            onClick={() => setSelectedImage(imageUrl)}
          >
            <CloudinaryImage
              src={imageUrl}
              alt=""
              width={300}
              height={300}
              className="h-full w-full rounded-lg object-cover"
            />
          </div>
        ))}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-h-4xl relative h-full w-full max-w-4xl p-4">
            <CloudinaryImage
              src={selectedImage}
              alt=""
              className="mx-auto h-screen w-fit object-contain"
            />
          </div>
        </div>
      )}

      {/* Share Popup */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Collaborators</DialogTitle>
          </DialogHeader>

          {/* Error Message */}
          {error && (
            <div className="mb-2 rounded bg-red-100 p-2 text-red-700">
              {error}
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Permission</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            {collaborators?.length > 0 && (
              <TableBody>
                {collaborators.map((collaborator) => (
                  <TableRow key={collaborator.userid}>
                    <TableCell>{collaborator.userid}</TableCell>
                    <TableCell>{collaborator.permission}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        onClick={() =>
                          handleRemoveCollaborator(collaborator.userid)
                        }
                        disabled={isLoading}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            )}
          </Table>

          {/* Add Collaborator */}
          <div className="mt-4 space-y-2">
            <input
              type="email"
              placeholder="Collaborator Email"
              value={newCollaborator.userid}
              onChange={(e) =>
                setNewCollaborator((prev) => ({
                  ...prev,
                  userid: e.target.value,
                }))
              }
              className="w-full rounded border p-2"
            />
            <select
              value={newCollaborator.permission}
              onChange={(e) =>
                setNewCollaborator((prev) => ({
                  ...prev,
                  permission: e.target.value as "editor" | "viewer",
                }))
              }
              className="w-full rounded border p-2"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
            <Button
              onClick={handleAddCollaborator}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Adding..." : "Add Collaborator"}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
