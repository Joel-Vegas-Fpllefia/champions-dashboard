// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Importante para que funcione Tailwind

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ChampionsDash",
  description: "El mejor dashboard de la Champions League",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      {/* Añadimos un degradado radial de fondo que imita los focos de un estadio */}
      <body
        className={`${inter.className} bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/40 via-slate-950 to-slate-950 text-slate-100 antialiased min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
