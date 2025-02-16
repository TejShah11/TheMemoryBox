"use client";

import React from "react";
import { AuthButton } from "@/components/auth/auth-button";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | undefined>();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#111111] px-6 text-[#b4b4b4]">
      <Image
        src="/images/logo-dark-nobg.png"
        alt="logo"
        height="256"
        width="256"
      />
      <div className="w-full max-w-md">
        <h1 className="mb-3 text-2xl font-medium text-[#eeeeee]">Sign up</h1>
        <form
          className="flex flex-col gap-3"
          action={async (formData) => {
            try {
              const response = await fetch("/api/signup", {
                method: "POST",
                body: formData,
              });

              if (!response.ok) {
                const responseBody = await response.json();
                throw new Error(responseBody.message || "Unknown error");
              }

              router.push("/home");
            } catch (error: unknown) {
              if (error instanceof Error) {
                setError(error.message);
              } else {
                setError("Something went wrong");
              }
            }
          }}
        >
          <div className="space-y-1">
            <label className="text-sm" htmlFor="name">
              Name
            </label>
            <input
              className="flex h-10 w-full rounded-lg border border-[#3A3A3A] bg-[#222222] px-3 py-2 text-sm ring-offset-[#111111] transition-colors placeholder:text-[#b4b4b4]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ec4899] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              id="name"
              name="name"
              required
              placeholder="Your name"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm" htmlFor="email">
              Email
            </label>
            <input
              className="flex h-10 w-full rounded-lg border border-[#3A3A3A] bg-[#222222] px-3 py-2 text-sm ring-offset-[#111111] transition-colors placeholder:text-[#b4b4b4]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ec4899] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm" htmlFor="password">
              Password
            </label>
            <input
              className="flex h-10 w-full rounded-lg border border-[#3A3A3A] bg-[#222222] px-3 py-2 text-sm ring-offset-[#111111] transition-colors placeholder:text-[#b4b4b4]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ec4899] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              id="password"
              name="password"
              type="password"
              placeholder="•••••••••••"
              required
            />
          </div>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <AuthButton>Sign up</AuthButton>
        </form>

        <div className="mt-4 text-sm text-[#b4b4b4]">
          Already have an account?{" "}
          <a href="/signin" className="text-[#ec4899] hover:underline">
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
