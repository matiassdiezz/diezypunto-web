"use client";

import { ReactNode } from "react";
import Navbar from "@/components/shared/Navbar";
import TopBar from "@/components/shared/TopBar";
import Footer from "@/components/shared/Footer";
import QuoteCart from "@/components/quote/QuoteCart";
import Toast from "@/components/shared/Toast";
import AddToCartDrawer from "@/components/shared/AddToCartDrawer";
import ChatFAB from "@/components/chat/ChatFAB";
import ChatModal from "@/components/chat/ChatDrawer";
import { AuthProvider } from "@/lib/auth-context";
import { useCartSync } from "@/lib/hooks/use-cart-sync";

function CartSyncProvider() {
  useCartSync();
  return null;
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartSyncProvider />
      <Navbar />
      <TopBar />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <QuoteCart />
      <Toast />
      <AddToCartDrawer />
      <ChatModal />
      <ChatFAB />
    </AuthProvider>
  );
}
