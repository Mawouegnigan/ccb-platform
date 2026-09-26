import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import FeedbackWidget from "@/components/FeedbackWidget";
import RegisterServiceWorker from "@/components/RegisterServiceWorker";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CCB Platform — Coordination des Cours Bibliques",
  description:
    "Registre des moniteurs et assistants — Coordination des Cours Bibliques.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <meta name="theme-color" content="#1B2A4A" />
      </head>
      <body className={`${inter.variable} ${sourceSerif.variable} font-sans`}>
        {children}
        <FeedbackWidget />
        <RegisterServiceWorker />
      </body>
    </html>
  );
}