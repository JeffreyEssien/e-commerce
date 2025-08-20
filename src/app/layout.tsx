import "./globals.css";
import { Toaster } from "react-hot-toast";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Campus Market",
  description: "Student marketplace platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" toastOptions={{
          style: {
            background: "#4f46e5",
            color: "#fff",
            fontWeight: "500",
          },
        }} />
      </body>
    </html>
  );
}