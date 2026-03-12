"use client";

import { ReactNode } from "react";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import TelegramButton from "@/components/shared/TelegramButton";
import QuoteCart from "@/components/quote/QuoteCart";
import Toast from "@/components/shared/Toast";
import AddToCartDrawer from "@/components/shared/AddToCartDrawer";
import AdvisorDrawer from "@/components/advisor/AdvisorDrawer";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <TelegramButton />
      <QuoteCart />
      <Toast />
      <AddToCartDrawer />
      <AdvisorDrawer />
    </>
  );
}
