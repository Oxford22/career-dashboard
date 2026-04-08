import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Career Dashboard — William Cahan",
    description: "AI-powered career opportunity tracker and analytics",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
          <html lang="en">
                <body className="font-sans antialiased bg-zinc-950">{children}</body>body>
          </html>html>
        );
}</html>
