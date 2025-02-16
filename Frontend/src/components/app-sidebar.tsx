"use client";

import * as React from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  GalleryVerticalEnd,
  GiftIcon,
  Sparkle,
  SquareTerminal,
} from "lucide-react";
import Image from "next/image";

import { NavMain } from "@/components/calendars";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { ModeToggle } from "./ui/mode-toggle";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Home",
      url: "/home",
      icon: "home",
      items: [],
    },
    {
      title: "Albums",
      url: "/albums",
      icon: "album",
      items: [],
    },
    {
      title: "Capsules",
      url: "/timecapsules",
      icon: "capsule",
      items: [],
    },
    {
      title: "Gifts",
      url: "/gifts",
      icon: "gifting",
      items: [],
    },
    {
      title: "Notifs",
      url: "/notifs",
      icon: "notifs",
      items: [],
    },
    {
      title: "Template",
      url: "http://localhost:3001",
      icon: "gifting",
      items: [],
    },
  ],
};
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  session: any;
}

export function AppSidebar({ session, ...props }: AppSidebarProps) {
  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-b border-sidebar-border">
        <Image
          src="/images/logo-dark-nobg.png"
          alt="logo"
          height="216"
          width="216"
          className="mx-auto"
          style={{
            filter: "drop-shadow(0px 0px 2px rgba(0, 0, 0, 0.75))",
          }}
        />
      </SidebarHeader>
      <SidebarContent>
        {/* <DatePicker /> */}
        <SidebarSeparator className="mx-0" />
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center">
              <span className="ml-1">
                <ModeToggle />
              </span>
              <span className="ml-3 text-sm">Change Theme</span>
            </div>
            <SidebarMenuButton>
              <div className="ml-1 mr-2">
                <GiftIcon />
              </div>
              <span className="text-sm">Gift Someone! </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <NavUser user={session.user} />
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
