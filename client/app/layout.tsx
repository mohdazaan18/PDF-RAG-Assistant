import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  ClerkProvider,
  Show,
  SignUp,
  UserButton,
} from '@clerk/nextjs'
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChatPDF | Interact with your Documents using AI",
  description: "Upload any PDF document and instantly chat with it using advanced AI. Extract insights, summarize long texts, and find answers in seconds.",
  keywords: ["chat pdf", "ai pdf reader", "pdf assistant", "document ai", "rag chatbot", "summarize pdf", "llama 3", "groq"],
  openGraph: {
    title: "ChatPDF | Interact with your Documents using AI",
    description: "Upload any PDF document and instantly chat with it using advanced AI. Extract insights, summarize long texts, and find answers in seconds.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChatPDF | AI Assistant for your Documents",
    description: "Upload any PDF and chat with it instantly.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <Show when="signed-out">
            <section className="min-h-screen w-full flex items-center justify-center">
              <SignUp />
            </section>
          </Show>
          <Show when="signed-in">
            {children}
          </Show>
        </body>
      </html>
    </ClerkProvider >
  );
}
