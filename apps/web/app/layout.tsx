import type { Metadata } from "next";
import { satoshi, sentient, zodiak } from "@ui";
import "../ui/styles/globals.css";

export const metadata: Metadata = {
  title: "web",
  description: "Generated with Prism",
  other: {
    "material-symbols-font":
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=optional",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=optional"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${satoshi.variable} ${sentient.variable} ${zodiak.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
