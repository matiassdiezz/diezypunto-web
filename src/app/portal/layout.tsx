import { ReactNode } from "react";
import PortalSidebar from "@/components/portal/PortalSidebar";
import PortalHeader from "@/components/portal/PortalHeader";

export const metadata = {
  title: "Portal de Clientes | Diezypunto",
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface pt-16">
      <PortalSidebar />
      <div className="flex flex-1 flex-col">
        <PortalHeader />
        <div className="flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}
