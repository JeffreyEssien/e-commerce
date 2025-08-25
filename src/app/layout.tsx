import "./globals.css";
import { Toaster } from "react-hot-toast";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Prime Stores - Campus Marketplace",
  description: "The ultimate campus marketplace connecting students, vendors, and administrators in a seamless digital ecosystem",
  keywords: ["campus", "marketplace", "students", "vendors", "university", "e-commerce"],
  authors: [{ name: "Prime Stores Team" }],
  openGraph: {
    title: "Prime Stores - Campus Marketplace",
    description: "The ultimate campus marketplace connecting students, vendors, and administrators",
    type: "website",
    siteName: "Prime Stores",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#667eea",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="antialiased font-sans">
        <main className="relative min-h-screen">
          {children}
        </main>
        
        <Toaster 
          position="top-right" 
          containerClassName="z-[9999]"
          toastOptions={{
            duration: 4000,
            style: {
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "12px",
              color: "rgba(255, 255, 255, 0.9)",
              fontWeight: "500",
              fontSize: "14px",
              padding: "12px 16px",
              boxShadow: "0 8px 32px rgba(31, 38, 135, 0.37)",
            },
            success: {
              iconTheme: {
                primary: "#10b981",
                secondary: "white",
              },
              style: {
                border: "1px solid rgba(16, 185, 129, 0.3)",
                background: "rgba(16, 185, 129, 0.15)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "white",
              },
              style: {
                border: "1px solid rgba(239, 68, 68, 0.3)",
                background: "rgba(239, 68, 68, 0.15)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
              },
            },
            loading: {
              iconTheme: {
                primary: "#3b82f6",
                secondary: "white",
              },
              style: {
                border: "1px solid rgba(59, 130, 246, 0.3)",
                background: "rgba(59, 130, 246, 0.15)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
              },
            },
          }} 
        />
      </body>
    </html>
  );
}
