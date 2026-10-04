"use client";

import { AuthProvider } from "@/lib/auth";
import { StoreProvider } from "@/lib/store";
import { ToastProvider } from "./Toast";
import { UIProvider } from "./UIContext";
import ActionsProvider from "./ActionsProvider";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <StoreProvider>
        <ToastProvider>
          <UIProvider>
            <ActionsProvider>{children}</ActionsProvider>
          </UIProvider>
        </ToastProvider>
      </StoreProvider>
    </AuthProvider>
  );
}
