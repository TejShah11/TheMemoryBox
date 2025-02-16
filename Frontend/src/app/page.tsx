import { auth } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { MagicCard } from "@/components/ui/magic-card";
import { BoxReveal } from "@/components/ui/box-reveal";
import { ShimmerButton } from "@/components/ui/shimmer-button";

export const runtime = "edge";

export default async function Home() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {!session?.user && (
            <>
              <Image
                src="/images/logo-dark-nobg.png"
                alt="logo"
                height="64"
                width="64"
                style={{
                  filter: "drop-shadow(0px 0px 2px rgba(0, 0, 0, 0.75))",
                }}
              />
              <div className="flex items-center gap-4">
                <Link href="/signin">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button>Get Started</Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative">
        {session?.user ? (
          <div className="flex min-h-screen flex-col items-center justify-center">
            <Image
              src="/images/logo-dark-nobg.png"
              alt="logo"
              height="256"
              width="256"
              style={{
                filter: "drop-shadow(0px 0px 2px rgba(0, 0, 0, 0.75))",
              }}
            />
            <div className="space-y-3 text-center">
              <p className="text-2xl font-medium">
                Welcome back, {session.user.name}!
              </p>
              <Button>
                <Link href={"/home"}>Visit Home</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <div className="relative pt-16">
              <div className="relative mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
                <h1 className="flex flex-col items-center text-center text-5xl font-medium sm:text-8xl">
                  <span>Preserve Your</span>
                  <BoxReveal boxColor={"#ec4899"} duration={0.5}>
                    <span className="mx-auto py-4 text-primary">
                      Memories Digitally
                    </span>
                  </BoxReveal>
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-lg">
                  Create, store, and share your precious memories in a secure,
                  beautiful digital box.
                </p>
                <div className="mt-10">
                  <Link href="/signup">
                    <ShimmerButton className="hover:bg-primary-dark mx-auto rounded-full bg-primary px-8 py-4 text-lg font-semibold text-background shadow-lg shadow-pink-500">
                      <span className="text-white">Start Your Memory Box</span>
                    </ShimmerButton>
                  </Link>
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
              <h2 className="mb-12 text-center text-3xl font-bold text-primary">
                Why Choose Us?
              </h2>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                {[
                  {
                    title: "Secure Storage",
                    description:
                      "Your memories are encrypted and safely stored in the cloud.",
                    icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
                  },
                  {
                    title: "Easy Sharing",
                    description:
                      "Share memories with family and friends effortlessly.",
                    icon: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z",
                  },
                  {
                    title: "Smart Organization",
                    description:
                      "Automatically organize your memories by date, location, and more.",
                    icon: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z",
                  },
                ].map((feature, index) => (
                  <MagicCard
                    key={index}
                    className="bg-secondary"
                    gradientColor={"#262626"}
                  >
                    <CardContent className="pt-6 text-center">
                      <svg
                        className="mx-auto mb-4 h-12 w-12 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={feature.icon}
                        />
                      </svg>
                      <h3 className="mb-2 text-xl font-semibold text-foreground">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {feature.description}
                      </p>
                    </CardContent>
                  </MagicCard>
                ))}
              </div>
            </div>

            {/* Technologies Section */}
            <div className="bg-muted">
              <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <h2 className="text-center text-lg font-semibold text-primary">
                  Built with Modern Technologies
                </h2>
                <div className="mt-8 flex items-center justify-center gap-8">
                  {[
                    { src: "/neon.png", alt: "Neon" },
                    { src: "/next.svg", alt: "Next.js" },
                    {
                      src: "/drizzle.svg",
                      alt: "Drizzle",
                    },
                  ].map((tech, index) => (
                    <Image
                      key={index}
                      src={tech.src}
                      alt={tech.alt}
                      width={64}
                      height={64}
                      className={`} h-16 w-auto transition-transform duration-300 hover:scale-110`}
                      style={{
                        filter: "drop-shadow(0px 0px 4px #ec4899",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
