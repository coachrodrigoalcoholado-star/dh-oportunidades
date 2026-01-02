import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"], // Added more weights for design flexibility
});

export const metadata: Metadata = {
  title: "DH OPORTUNIDADES | Préstamos",
  description: "Simulador de Préstamos Premium",
};

import { AuthProvider } from "@/contexts/AuthContext";

// ... (existing imports)

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} antialiased bg-dh-dark text-white`}
      >
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <main className="flex-grow">
              {children}
            </main>
            <footer className="py-6 text-center text-[10px] text-gray-700 font-mono tracking-[0.2em] uppercase opacity-40 hover:opacity-100 transition-opacity select-none cursor-default">
              Powered by DH OPORTUNIDADES v2.6
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
