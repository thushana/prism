import localFont from "next/font/local";

// Satoshi Variable Font
export const satoshi = localFont({
  src: [
    {
      path: "../../fonts/Satoshi-Variable.woff2",
      weight: "300 900",
      style: "normal",
    },
    {
      path: "../../fonts/Satoshi-VariableItalic.woff2",
      weight: "300 900",
      style: "italic",
    },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

// Sentient Variable Font
export const sentient = localFont({
  src: [
    {
      path: "../../fonts/Sentient-Variable.woff2",
      weight: "200 800",
      style: "normal",
    },
    {
      path: "../../fonts/Sentient-VariableItalic.woff2",
      weight: "200 800",
      style: "italic",
    },
  ],
  variable: "--font-sentient",
  display: "swap",
});

// Zodiak Variable Font
export const zodiak = localFont({
  src: [
    {
      path: "../../fonts/Zodiak-Variable.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../../fonts/Zodiak-VariableItalic.woff2",
      weight: "100 900",
      style: "italic",
    },
  ],
  variable: "--font-zodiak",
  display: "swap",
});

// Gambarino Font (Regular only)
export const gambarino = localFont({
  src: "../../fonts/Gambarino-Regular.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-gambarino",
  display: "swap",
});
