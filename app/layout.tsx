import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Golazo — AI-Powered Trip Planning",
  description:
    "Upload your booking documents and let Golazo build your group trip itinerary automatically.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
