import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond, DM_Mono, EB_Garamond, IM_Fell_DW_Pica } from "next/font/google";
import "./globals.css";

// Riksprotokollen v2 font-stabel. Hver font får en CSS-variabel som
// brukes av tokens i globals.css (--font-display, --font-sans osv.).
const cinzel = Cinzel({
  variable: "--font-display-cinzel",
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  display: "swap",
});

const ebGaramond = EB_Garamond({
  variable: "--font-body-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-numerals-cormorant",
  subsets: ["latin"],
  weight: ["300", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const imFell = IM_Fell_DW_Pica({
  variable: "--font-italic-im-fell",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--font-mono-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Geotia",
    template: "%s | Geotia",
  },
  description:
    "Geotias private riksregister for SlowGeo, kattometer, GeoTinget og de offisielle annaler.",
  metadataBase: new URL("https://geotia.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="no"
      className={`${cinzel.variable} ${ebGaramond.variable} ${cormorant.variable} ${imFell.variable} ${dmMono.variable}`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
