"use client";

import { useEffect, useState } from "react";

/** true solo en el cliente después del primer paint — alinea SSR con hidratación (stores persistidos, etc.). */
export function useHasMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
