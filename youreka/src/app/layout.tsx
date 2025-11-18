import type { Metadata } from "next";
import "./globals.css";
import { ReactNode } from "react";
import Providers from "./Providers";

export const metadata: Metadata = {
  title: "YOUREKA by QUAZENTA",
  description: "Web-based accounting app with IndexedDB",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
