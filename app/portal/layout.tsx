"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import React from "react";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      const role = (session?.user as { role?: string })?.role;
      if (role === "USER" || role === "ADMIN") router.push("/dashboard");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F9F3EF" }}>
        <div className="w-8 h-8 rounded-full border-4 animate-spin"
          style={{ borderColor: "#1B3C53", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return <>{children}</>;
}
