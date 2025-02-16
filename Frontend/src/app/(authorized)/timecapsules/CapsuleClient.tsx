"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CloudinaryImage } from "@/components/cloudinary-image";
import { LockClosedIcon, LockOpenIcon } from "@heroicons/react/24/solid";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

interface Capsule {
  id: number;
  albums: string;
  album_name: string;
  unlock_time: string;
  theme: string;
  reminders: boolean;
  reminderfreq: string;
  passwordtoggle: boolean;
  password?: string;
  images: string[];
}

const THEME_COLORS = {
  classic: "bg-zinc-100",
  vintage: "bg-amber-100",
  modern: "bg-blue-100",
  dark: "bg-zinc-900 text-white",
  nature: "bg-green-100",
  sunset: "bg-orange-100",
  ocean: "bg-cyan-100",
  royal: "bg-purple-100",
};

export default function CapsuleClient({ userEmail }: { userEmail: string }) {
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCapsule, setSelectedCapsule] = useState<Capsule | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    fetchCapsules();
  }, []);

  const fetchCapsules = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/timecapsules");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch capsules");
      }

      setCapsules(data.capsules);
    } catch (error) {
      console.error("Error fetching capsules:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch capsules",
      );
    } finally {
      setLoading(false);
    }
  };

  const canOpenCapsule = (unlockTime: string) => {
    return new Date(unlockTime) <= new Date();
  };

  const handleCapsuleClick = (capsule: Capsule) => {
    if (!canOpenCapsule(capsule.unlock_time)) {
      return;
    }

    if (capsule.passwordtoggle) {
      setSelectedCapsule(capsule);
      setIsPasswordModalOpen(true);
      setPassword("");
      setPasswordError("");
    } else {
      window.location.href = `/albums/${capsule.albums}`;
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCapsule && password === selectedCapsule.password) {
      setIsPasswordModalOpen(false);
      window.location.href = `/albums/${selectedCapsule.albums}`;
    } else {
      setPasswordError("Incorrect password");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-purple-500"></div>
      </div>
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
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Time Capsules</h1>
        <Link
          href="/albums"
          className="rounded bg-purple-500 px-4 py-2 text-white hover:bg-purple-600"
        >
          Create New Capsule
        </Link>
      </div>

      {capsules.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-zinc-500">
            No time capsules yet. Create your first one!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {capsules.map((capsule) => {
            const isLocked = !canOpenCapsule(capsule.unlock_time);
            const themeColor =
              THEME_COLORS[capsule.theme as keyof typeof THEME_COLORS] ||
              THEME_COLORS.classic;

            return (
              <div
                key={capsule.id}
                className={`overflow-hidden rounded-lg shadow-md ${themeColor} transition-all duration-300 hover:shadow-lg ${
                  !isLocked && !capsule.passwordtoggle ? "cursor-pointer" : ""
                }`}
                onClick={() => !isLocked && handleCapsuleClick(capsule)}
                role="button"
                tabIndex={0}
              >
                <div className="aspect-w-16 aspect-h-9 relative">
                  {capsule.images[0] && (
                    <div className="relative">
                      <CloudinaryImage
                        src={capsule.images[0]}
                        alt={capsule.album_name}
                        width={400}
                        height={300}
                        className={`h-full w-full object-cover ${isLocked ? "blur-lg" : ""}`}
                      />
                      {isLocked && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <LockClosedIcon className="h-12 w-12 text-white" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="mb-1 text-lg font-semibold">
                    {capsule.album_name}
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm">
                      {isLocked ? (
                        <>
                          <LockClosedIcon className="mr-1 inline h-4 w-4" />
                          Opens {new Date(capsule.unlock_time).toLocaleString()}
                        </>
                      ) : (
                        <>
                          <LockOpenIcon className="mr-1 inline h-4 w-4" />
                          Ready to open!
                        </>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-white bg-opacity-50 px-2 py-1">
                        Theme: {capsule.theme}
                      </span>
                      {capsule.reminders && (
                        <span className="rounded-full bg-white bg-opacity-50 px-2 py-1">
                          Reminders: {capsule.reminderfreq}
                        </span>
                      )}
                      {capsule.passwordtoggle && (
                        <span className="flex items-center rounded-full bg-white bg-opacity-50 px-2 py-1">
                          <LockClosedIcon className="mr-1 h-3 w-3" />
                          Password Protected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Password Modal */}
      <Transition appear show={isPasswordModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsPasswordModalOpen(false)}
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
                    Enter Password
                  </Dialog.Title>
                  <form onSubmit={handlePasswordSubmit}>
                    <div className="mt-2">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500"
                        placeholder="Enter capsule password"
                        required
                      />
                      {passwordError && (
                        <p className="mt-2 text-sm text-red-600">
                          {passwordError}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex justify-end space-x-3">
                      <button
                        type="button"
                        className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
                        onClick={() => setIsPasswordModalOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-md bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600"
                      >
                        Open Capsule
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
