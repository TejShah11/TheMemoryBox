import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import CloudinaryImageUploader from "@/components/home/uploader";
import { SignOut } from "@/components/auth/signout-button";

export default async function Page({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <SidebarProvider>
      <AppSidebar session={session} />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-2 border-b bg-background px-4 sm:justify-start">
          <SidebarTrigger className="-ml-1 mr-3" />
          <h1></h1>
          <div className="ml-auto flex items-center gap-2">
            <CloudinaryImageUploader session={session} />
            <SignOut />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
