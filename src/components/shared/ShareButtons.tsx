"use client";

import { useState, useRef, useEffect } from "react";
import {
  ShareNetwork,
  WhatsappLogo,
  LinkSimple,
  Check,
  SpinnerGap,
} from "@phosphor-icons/react";
import { openWhatsApp, copyToClipboard } from "@/lib/share";
import { trackEvent } from "@/lib/analytics-client";

interface ShareButtonProps {
  getShareUrl: () => string | Promise<string>;
  getWhatsAppMessage: (url: string) => string;
  context: "product" | "cart";
  trackingData?: Record<string, unknown>;
}

export default function ShareButton({
  getShareUrl,
  getWhatsAppMessage,
  context,
  trackingData,
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const resolveUrl = async (): Promise<string | null> => {
    setLoading(true);
    try {
      return await getShareUrl();
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = async () => {
    const url = await resolveUrl();
    if (!url) return;
    trackEvent("share_whatsapp", { context, ...trackingData });
    openWhatsApp(getWhatsAppMessage(url));
    setOpen(false);
  };

  const handleCopy = async () => {
    const url = await resolveUrl();
    if (!url) return;
    const ok = await copyToClipboard(url);
    if (ok) {
      trackEvent("share_copy_link", { context, ...trackingData });
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1200);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg p-2 text-muted transition-colors hover:bg-surface hover:text-foreground"
        aria-label="Compartir"
      >
        <ShareNetwork className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
          <button
            onClick={handleWhatsApp}
            disabled={loading}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-surface disabled:opacity-60"
          >
            {loading ? (
              <SpinnerGap className="h-4 w-4 animate-spin text-muted" />
            ) : (
              <WhatsappLogo className="h-4 w-4 text-[#25D366]" weight="fill" />
            )}
            WhatsApp
          </button>
          <button
            onClick={handleCopy}
            disabled={loading}
            className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-sm transition-colors hover:bg-surface disabled:opacity-60"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-success" />
                <span className="text-success">Copiado!</span>
              </>
            ) : loading ? (
              <SpinnerGap className="h-4 w-4 animate-spin text-muted" />
            ) : (
              <>
                <LinkSimple className="h-4 w-4 text-muted" />
                Copiar link
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
