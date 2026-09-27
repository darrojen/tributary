import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "../lib/wallet";

export const metadata: Metadata = {
  title: "Tributary — programmable USDC flows on Arc",
  description:
    "Stream USDC by the second and split payments by percentage. Built on Arc, where gas is USDC.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
