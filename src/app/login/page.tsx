"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SpinnerGap } from "@phosphor-icons/react";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "verifying" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const clientId = searchParams.get("client");
  const token = searchParams.get("token");

  useEffect(() => {
    if (!clientId || !token) return;

    setStatus("verifying");

    fetch("/api/portal/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, token }),
    })
      .then(async (res) => {
        if (res.ok) {
          router.replace("/portal");
        } else {
          setStatus("error");
          setErrorMsg("Link invalido o expirado. Contacta a Diezypunto.");
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("Error de conexion. Intenta de nuevo.");
      });
  }, [clientId, token, router]);

  if (clientId && token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          {status === "verifying" && (
            <div className="flex flex-col items-center gap-4">
              <SpinnerGap className="h-8 w-8 animate-spin text-accent" />
              <p className="text-muted">Verificando acceso...</p>
            </div>
          )}
          {status === "error" && (
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-red-50 p-4">
                <span className="text-3xl">!</span>
              </div>
              <p className="text-lg font-medium text-foreground">{errorMsg}</p>
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "541162345062"}`}
                className="mt-2 inline-block py-2 text-sm text-accent hover:underline"
              >
                Contactar por WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  const handleDevLogin = () => {
    setStatus("verifying");
    fetch("/api/portal/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: "test", token: "dev" }),
    })
      .then(async (res) => {
        if (res.ok) {
          router.replace("/portal");
        } else {
          setStatus("error");
          setErrorMsg("Error en login de prueba.");
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("Error de conexion.");
      });
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-4 max-w-md text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Portal de Clientes
        </h1>
        <p className="mt-3 text-muted">
          Accede con el link que te enviamos por WhatsApp.
        </p>
        <p className="mt-6 text-sm text-muted">
          ¿No tenes el link?{" "}
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "541162345062"}`}
            className="inline-block py-2 text-accent hover:underline"
          >
            Contacta a Diezypunto
          </a>
        </p>
        {process.env.NODE_ENV === "development" && (
          <button
            onClick={handleDevLogin}
            className="mt-8 rounded-lg border border-dashed border-amber-500/50 bg-amber-500/10 px-6 py-3 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-500/20"
          >
            Entrar como usuario de prueba
          </button>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <SpinnerGap className="h-8 w-8 animate-spin text-accent" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
