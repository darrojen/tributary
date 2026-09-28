"use client";

import React, { createContext, useContext, useState } from "react";
import { WalletModal } from "./WalletModal";

const ModalCtx = createContext<{ openWalletModal: () => void }>({ openWalletModal: () => {} });

export function useWalletModal() {
  return useContext(ModalCtx);
}

export function ModalHost({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <ModalCtx.Provider value={{ openWalletModal: () => setOpen(true) }}>
      {children}
      <WalletModal open={open} onClose={() => setOpen(false)} />
    </ModalCtx.Provider>
  );
}
