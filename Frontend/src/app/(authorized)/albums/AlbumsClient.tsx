"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CloudinaryImage } from "@/components/cloudinary-image";
import { ClockIcon } from "@heroicons/react/24/outline";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { Separator } from "@/components/ui/separator";

interface Album {
  id: string;
  name: string;
  description?: string;
  images: string[];
  mainowner: string;
}

const THEMES = [
  { id: "classic", name: "Classic", color: "bg-zinc-100" },
  { id: "vintage", name: "Vintage", color: "bg-amber-100" },
  { id: "modern", name: "Modern", color: "bg-blue-100" },
  { id: "dark", name: "Dark", color: "bg-zinc-900" },
  { id: "nature", name: "Nature", color: "bg-green-100" },
  { id: "sunset", name: "Sunset", color: "bg-orange-100" },
  { id: "ocean", name: "Ocean", color: "bg-cyan-100" },
  { id: "royal", name: "Royal", color: "bg-purple-100" },
];

export default function AlbumsClient({ userEmail }: { userEmail: string }) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isCreateCapsuleOpen, setIsCreateCapsuleOpen] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [openingDate, setOpeningDate] = useState("");
  const [openingTime, setOpeningTime] = useState("");
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0].id);
  const [reminderFreq, setReminderFreq] = useState<
    "never" | "daily" | "weekly" | "monthly"
  >("never");
  const [passwordToggle, setPasswordToggle] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      const response = await fetch("/api/albums/get");
      const data = await response.json();
      if (response.ok) {
        setAlbums(data.albums);
      } else {
        console.error("Failed to fetch albums:", data.error);
      }
    } catch (error) {
      console.error("Error fetching albums:", error);
    }
  };

  const handleCreateCapsule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlbum || !openingDate || !openingTime || !selectedTheme) {
      setNotification({
        type: "error",
        message: "Please fill in all required fields",
      });
      return;
    }

    const openAtDate = new Date(openingDate + "T" + openingTime);
    if (openAtDate <= new Date()) {
      setNotification({
        type: "error",
        message: "Opening time must be in the future",
      });
      return;
    }

    try {
      const response = await fetch("/api/timecapsules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          albumId: selectedAlbum.id,
          openAt: openAtDate.toISOString(),
          theme: selectedTheme,
          reminders: reminderFreq !== "never",
          reminderfreq: reminderFreq,
          passwordtoggle: passwordToggle,
          password: passwordToggle ? password : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create capsule");
      }

      setNotification({
        type: "success",
        message: "Time capsule created successfully!",
      });
      setIsCreateCapsuleOpen(false);

      // Reset form
      setSelectedAlbum(null);
      setOpeningDate("");
      setOpeningTime("");
      setSelectedTheme(THEMES[0].id);
      setReminderFreq("never");
      setPasswordToggle(false);
      setPassword("");
    } catch (error) {
      setNotification({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to create capsule",
      });
    }
  };

  return (
    <main className="container mx-auto px-4 py-2">
      {notification && (
        <div
          className={`fixed right-4 top-4 z-50 rounded-md p-4 shadow-lg ${
            notification.type === "success" ? "bg-green-500" : "bg-red-500"
          } text-white`}
        >
          {notification.message}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Your Albums</h1>
        <div className="space-x-4">
          <Link
            href="/home"
            className="rounded-md bg-pink-500 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-pink-600"
          >
            Create New Album
          </Link>
          <Link
            href="/timecapsules"
            className="rounded-md bg-purple-500 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-purple-600"
          >
            View Capsules
          </Link>
        </div>
      </div>

      {albums.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-zinc-300">
          <p className="text-center text-zinc-500">
            No albums yet. Create your first one!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {albums.map((album) => (
            <div
              key={album.id}
              className="block overflow-hidden rounded-md bg-card shadow-lg transition-shadow duration-300 hover:shadow-xl"
            >
              <div className="relative h-[300px] w-[300px] overflow-hidden rounded-md">
                <Link href={`/albums/${album.id}`}>
                  {album.images[0] ? (
                    <CloudinaryImage
                      src={album.images[0]}
                      alt={album.name}
                      width={300}
                      height={300}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <span className="text-muted-foreground">No images</span>
                    </div>
                  )}
                </Link>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <Link href={`/albums/${album.id}`} className="flex-1">
                    <div>
                      <h3 className="mb-1 text-lg font-semibold text-foreground hover:text-pink-500">
                        {album.name}
                      </h3>
                      {album.description && (
                        <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
                          {album.description}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {album.images.length}{" "}
                        {album.images.length === 1 ? "photo" : "photos"}
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center space-x-2">
                    <div className="flex h-full w-full flex-col items-end justify-end">
                      <div className="rounded-full bg-pink-500 px-2 py-1 text-xs font-bold text-white">
                        {album.mainowner === userEmail
                          ? "Owner"
                          : "Collaborator"}
                      </div>
                      <button
                        className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedAlbum(album);
                          setIsCreateCapsuleOpen(true);
                        }}
                      >
                        <ClockIcon className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Capsule Modal */}
      <Transition appear show={isCreateCapsuleOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsCreateCapsuleOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="mb-4 text-lg font-medium leading-6 text-zinc-900"
                  >
                    Create Time Capsule
                  </Dialog.Title>
                  <form onSubmit={handleCreateCapsule}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700">
                          Album
                        </label>
                        <div className="mt-1 rounded-md border bg-zinc-50 p-2">
                          {selectedAlbum?.name}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-700">
                          Opening Date
                        </label>
                        <input
                          type="date"
                          value={openingDate}
                          onChange={(e) => setOpeningDate(e.target.value)}
                          className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-700">
                          Opening Time
                        </label>
                        <input
                          type="time"
                          value={openingTime}
                          onChange={(e) => setOpeningTime(e.target.value)}
                          className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-zinc-700">
                          Theme
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {THEMES.map((theme) => (
                            <button
                              key={theme.id}
                              type="button"
                              onClick={() => setSelectedTheme(theme.id)}
                              className={`rounded-md p-2 ${theme.color} hover:opacity-90 ${
                                selectedTheme === theme.id
                                  ? "ring-2 ring-purple-500"
                                  : ""
                              }`}
                            >
                              <span className="text-xs">{theme.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-zinc-700">
                          Reminders
                        </label>
                        <select
                          value={reminderFreq}
                          onChange={(e) =>
                            setReminderFreq(
                              e.target.value as
                                | "never"
                                | "daily"
                                | "weekly"
                                | "monthly",
                            )
                          }
                          className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                        >
                          <option value="never">Never</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-zinc-700">
                          Password Protection
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={passwordToggle}
                            onChange={(e) =>
                              setPasswordToggle(e.target.checked)
                            }
                            className="rounded-md border-zinc-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                          />
                          <span className="text-sm">
                            Require password to open
                          </span>
                        </div>
                        {passwordToggle && (
                          <div className="mt-2">
                            <input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Enter password"
                              className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                              required
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
                        onClick={() => setIsCreateCapsuleOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-md bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600"
                      >
                        Create Capsule
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </main>
  );
}
