"use client";
import { SidebarProvider } from "@/context/SidebarContext";
import React from "react";
export default function TicketsLayout({ children }: { children: React.ReactNode }) {
  return <SidebarProvider>{children}</SidebarProvider>;
}
