import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "../lib/wallet";
import { ModalHost } from "../components/ModalHost";

export const metadata: Metadata = {
  title: "Tributary — Programmable USDC flows on Arc",
  description:
    "Stream USDC by the second and split payments by percentage. Built on Arc, where gas is USDC.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <ModalHost>{children}</ModalHost>
        </WalletProvider>
      </body>
    </html>
  );
}
