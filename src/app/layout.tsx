import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kalpa Slideshow Generator Tool",
  description: "Generate Kalpa-branded business decks with OpenAI and export editable Google Slides."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
