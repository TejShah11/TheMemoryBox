"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { CloudinaryImage } from "@/components/cloudinary-image";
import { LockClosedIcon, LockOpenIcon } from "@heroicons/react/24/solid";
import confetti from 'canvas-confetti';

interface Album {
  id: string;
  name: string;
  description: string;
  images: string[];
}

interface TimeCapsule {
  id: string;
  albums: string[];
  album_name: string;
  unlock_time: string;
  created_at: string;
  theme: string;
  reminders: boolean;
  reminderfreq: string;
  passwordtoggle: boolean;
  password?: string;
  images: string[];
}

const THEMES = [
  { id: "classic", name: "Classic", bgColor: "bg-zinc-100", textColor: "text-gray-900" },
  { id: "vintage", name: "Vintage", bgColor: "bg-amber-100", textColor: "text-amber-900" },
  { id: "modern", name: "Modern", bgColor: "bg-blue-100", textColor: "text-blue-900" },
  { id: "dark", name: "Dark", bgColor: "bg-zinc-900", textColor: "text-white" },
  { id: "nature", name: "Nature", bgColor: "bg-green-100", textColor: "text-green-900" },
  { id: "sunset", name: "Sunset", bgColor: "bg-orange-100", textColor: "text-orange-900" },
  { id: "ocean", name: "Ocean", bgColor: "bg-cyan-100", textColor: "text-cyan-900" },
  { id: "royal", name: "Royal", bgColor: "bg-purple-100", textColor: "text-purple-900" },
];

export default function TimeCapsuleClient({
  userEmail,
}: {
  userEmail: string;
}) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [capsules, setCapsules] = useState<TimeCapsule[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState("");
  const [openingDate, setOpeningDate] = useState("");
  const [openingTime, setOpeningTime] = useState("");
  const [theme, setTheme] = useState("classic");
  const [reminders, setReminders] = useState(false);
  const [reminderFreq, setReminderFreq] = useState("never");
  const [passwordToggle, setPasswordToggle] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchAlbums();
    fetchCapsules();
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

  const fetchCapsules = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/timecapsules");
      const data = await response.json();
      if (response.ok) {
        setCapsules(data.capsules);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError("Failed to fetch time capsules");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCapsule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlbumId || !openingDate || !openingTime) {
      setNotification({
        type: "error",
        message: "Please fill in all fields",
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
          albumId: selectedAlbumId,
          openAt: openAtDate.toISOString(),
          theme,
          reminders,
          reminderfreq: reminderFreq,
          passwordtoggle: passwordToggle,
          password: passwordToggle ? password : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create time capsule");
      }

      setNotification({
        type: "success",
        message: "Time capsule created successfully!",
      });
      setIsCreateModalOpen(false);
      fetchCapsules();

      // Reset form
      setSelectedAlbumId("");
      setOpeningDate("");
      setOpeningTime("");
      setTheme("classic");
      setReminders(false);
      setReminderFreq("never");
      setPasswordToggle(false);
      setPassword("");
    } catch (error) {
      setNotification({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to create time capsule",
      });
    }
  };

  const canOpenCapsule = useCallback((openAt: string) => {
    return new Date(openAt) <= new Date();
  }, []);

  const triggerConfetti = useCallback(() => {
    const duration = 3000;
    const defaults = { 
      startVelocity: 45, 
      spread: 360, 
      ticks: 100, 
      zIndex: 9999,
      shapes: ['square', 'circle'],
      colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF']
    };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    // Initial burst
    confetti({
      ...defaults,
      particleCount: 150,
      origin: { x: 0.5, y: 0.7 }
    });

    // Continuous side bursts
    const interval: any = setInterval(function() {
      const timeLeft = duration - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 30;

      // Left side burst
      confetti({
        ...defaults,
        particleCount,
        angle: 60,
        origin: { x: 0, y: 0.7 }
      });

      // Right side burst
      confetti({
        ...defaults,
        particleCount,
        angle: 120,
        origin: { x: 1, y: 0.7 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check for newly unlocked capsules
    capsules.forEach(capsule => {
      const now = new Date();
      const unlockTime = new Date(capsule.unlock_time);
      const timeDiff = Math.abs(now.getTime() - unlockTime.getTime());
      
      // If a capsule was unlocked within the last minute, trigger confetti
      if (timeDiff < 60000 && now >= unlockTime) {
        triggerConfetti();
      }
    });
  }, [capsules, triggerConfetti]);

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-2">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white-800">Time Capsules</h1>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={loading}
          >
            Create Time Capsule
          </button>
        </div>
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-b-4 border-t-4 border-transparent border-b-pink-500 border-t-pink-500"></div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold text-white-800">Your Time Capsules</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          disabled={loading}
        >
          Create New Capsule
        </button>
      </div>

      {error ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
          </div>
        </div>
      ) : capsules.length === 0 ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-4">No time capsules found. Create one to get started!</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:from-blue-500 hover:to-indigo-500"
            >
              Create Your First Capsule
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {capsules.map((capsule) => {
            const isUnlocked = canOpenCapsule(capsule.unlock_time);

            const handleUnlock = (e: React.MouseEvent) => {
              e.preventDefault(); // Prevent the Link navigation
              
              // First trigger confetti
              triggerConfetti();

              // Show success notification
              setNotification({
                type: "success",
                message: " Time Capsule Unlocked! Redirecting to album..."
              });

              // Wait for confetti and notification before redirecting
              setTimeout(() => {
                window.location.href = `/albums/${capsule.albums[0]}`;
              }, 3000);
            };

            return (
              <div
                key={capsule.id}
                className="group relative overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 hover:shadow-xl"
              >
                <div className="relative aspect-[4/3]">
                  {capsule.images && capsule.images[0] ? (
                    <CloudinaryImage
                      src={capsule.images[0]}
                      alt={capsule.album_name}
                      height={300}
                      width={400}
                      className={`h-full w-full object-cover transition-all duration-500 ${
                        !isUnlocked ? 'blur-sm' : ''
                      } group-hover:scale-105`}
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-gray-100 to-gray-200" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-80" />
                  
                  {/* Lock Icon with Background */}
                  <div className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow-lg">
                    {isUnlocked ? (
                      <LockOpenIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <LockClosedIcon className="h-5 w-5 text-red-500" />
                    )}
                  </div>

                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="mb-1 text-lg font-semibold text-white">
                      {capsule.album_name}
                    </h3>
                    <p className="text-sm text-white/90">
                      {isUnlocked ? (
                        <span className="flex items-center gap-1">
                          <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                          Ready to Open!
                        </span>
                      ) : (
                        <span>
                          Opens {new Date(capsule.unlock_time).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                    {isUnlocked ? (
                      <button
                        onClick={handleUnlock}
                        className="mt-3 w-full animate-pulse rounded-md bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:from-green-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      >
                         Open Time Capsule
                      </button>
                    ) : (
                      <Link href={`/capsule/${capsule.id}`} className="mt-3 block w-full">
                        <p className="w-full rounded-md bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:from-blue-600 hover:to-indigo-600">
                          Locked
                        </p>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Time Capsule Modal */}
      <Transition appear show={isCreateModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsCreateModalOpen(false)}
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
                    className="text-lg font-medium leading-6 text-zinc-900"
                  >
                    Create Time Capsule
                  </Dialog.Title>
                  <form onSubmit={handleCreateCapsule}>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700">
                          Select Album
                        </label>
                        <select
                          value={selectedAlbumId}
                          onChange={(e) => setSelectedAlbumId(e.target.value)}
                          className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select an album</option>
                          {albums.map((album) => (
                            <option key={album.id} value={album.id}>
                              {album.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700">
                          Opening Date
                        </label>
                        <input
                          type="date"
                          value={openingDate}
                          onChange={(e) => setOpeningDate(e.target.value)}
                          className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                          className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700">
                          Theme
                        </label>
                        <select
                          value={theme}
                          onChange={(e) => setTheme(e.target.value)}
                          className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        >
                          {THEMES.map((theme) => (
                            <option key={theme.id} value={theme.id}>
                              {theme.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="reminders"
                            checked={reminders}
                            onChange={(e) => setReminders(e.target.checked)}
                            className="h-4 w-4 rounded border-zinc-300 text-blue-500 focus:ring-blue-500"
                          />
                          <label
                            htmlFor="reminders"
                            className="ml-2 block text-sm text-zinc-700"
                          >
                            Enable Reminders
                          </label>
                        </div>
                        {reminders && (
                          <select
                            value={reminderFreq}
                            onChange={(e) => setReminderFreq(e.target.value)}
                            className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="never">Never</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="passwordToggle"
                            checked={passwordToggle}
                            onChange={(e) =>
                              setPasswordToggle(e.target.checked)
                            }
                            className="h-4 w-4 rounded border-zinc-300 text-blue-500 focus:ring-blue-500"
                          />
                          <label
                            htmlFor="passwordToggle"
                            className="ml-2 block text-sm text-zinc-700"
                          >
                            Password Protection
                          </label>
                        </div>
                        {passwordToggle && (
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required={passwordToggle}
                          />
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                        onClick={() => setIsCreateModalOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        Create
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
