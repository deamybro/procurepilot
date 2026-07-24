import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const base = new URL(host ? `${protocol}://${host}` : "http://localhost:3000");
  return {
    metadataBase: base,
    title: {
      default: "ProcurePilot",
      template: "%s · ProcurePilot",
    },
    description:
      "Tell the agent what you need. It finds, buys and coordinates the services required to deliver it.",
    applicationName: "ProcurePilot",
    openGraph: {
      title: "ProcurePilot",
      description:
        "From a goal to a finished deliverable — planned, paid and coordinated.",
      type: "website",
      images: [{ url: "/og.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "ProcurePilot",
      description: "AI procurement for agent-delivered digital services.",
      images: ["/og.png"],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0d0d",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
