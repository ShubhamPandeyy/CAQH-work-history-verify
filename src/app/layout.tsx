import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Pandey's Work History Visualizer",
  description: 'Visually track and manage work and gap history with Pandey\'s Work History Visualizer.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
