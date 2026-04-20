import type { JSX } from "react";
import { Geist_Mono } from "next/font/google";
import { FontWeightPreview } from "./font-weight-preview";
import { TypeScalePreview } from "./type-scale-preview";
import { satoshi, sentient, zodiak } from "@ui";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function PrismTypographyDemo(): JSX.Element {
  return (
    <>
      <FontWeightPreview
        satoshiVariableClass={satoshi.variable}
        sentientVariableClass={sentient.variable}
        zodiakVariableClass={zodiak.variable}
        geistMonoVariableClass={geistMono.variable}
      />
      <TypeScalePreview
        satoshiVariableClass={satoshi.variable}
        sentientVariableClass={sentient.variable}
        zodiakVariableClass={zodiak.variable}
        geistMonoVariableClass={geistMono.variable}
      />
    </>
  );
}
