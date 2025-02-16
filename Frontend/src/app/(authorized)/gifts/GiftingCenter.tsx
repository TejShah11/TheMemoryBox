"use client";

import { useState, useEffect } from "react";
import { CloudinaryImage } from "@/components/cloudinary-image";
import { GiftIcon } from "@heroicons/react/24/solid";
import GiftCapsuleModal from "./GiftModal";

interface TimeCapsule {
  id: string;
  albums: string[];
  album_name: string;
  unlock_time: string;
  images: string[];
}

export default function GiftingCenter({ userEmail }: { userEmail: string }) {
  const [capsules, setCapsules] = useState<TimeCapsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCapsule, setSelectedCapsule] = useState<TimeCapsule | null>(
    null,
  );
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);

  const handleGift = (capsule: TimeCapsule) => {
    setSelectedCapsule(capsule);
    setIsGiftModalOpen(true);
  };

  const handleCloseGiftModal = () => {
    setSelectedCapsule(null);
    setIsGiftModalOpen(false);
  };

  useEffect(() => {
    fetchCapsules();
  }, []);

  const fetchCapsules = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/timecapsules");
      const data = await response.json();

      if (response.ok) {
        // Filter only locked capsules that have not yet been unlocked
        const lockedCapsules = data.capsules.filter(
          (capsule: TimeCapsule) => new Date(capsule.unlock_time) > new Date(),
        );
        setCapsules(lockedCapsules);
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

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-2">
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
      <h1 className="text-white-800 mb-6 text-2xl font-bold">
        The Gift Center 🎁
      </h1>

      {capsules.length === 0 ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-center text-gray-500">
            No locked time capsules at the moment.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {capsules.map((capsule) => (
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
                    className="h-full w-full object-cover blur-sm transition-all duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-gray-100 to-gray-200" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-80" />

                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="mb-1 text-lg font-semibold text-white">
                    {capsule.album_name}
                  </h3>
                  <p className="text-sm text-white/90">
                    Opens {new Date(capsule.unlock_time).toLocaleDateString()}
                  </p>

                  <button
                    onClick={() => handleGift(capsule)}
                    className="mt-3 flex w-full items-center justify-center rounded-md bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:from-yellow-600 hover:to-orange-600"
                  >
                    <GiftIcon className="mr-2 h-5 w-5" /> Gift To Someone!
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedCapsule && (
        <GiftCapsuleModal
          open={isGiftModalOpen}
          onClose={handleCloseGiftModal}
          capsuleId={selectedCapsule.id}
        />
      )}
    </main>
  );
}
