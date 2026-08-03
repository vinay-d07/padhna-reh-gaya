import { Bebas_Neue, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { GlobalProvider } from "@/providers/GlobalProvider";

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata = {
  title: "padhle — chat with your documents",
  description: "Create a workspace, drop in your PDFs, and chat with them using RAG-powered answers you can turn into short notes.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${bebasNeue.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <GlobalProvider>
        <body className="min-h-full flex flex-col bg-warm-canvas">{children}</body>
      </GlobalProvider>
    </html>
  );
}
