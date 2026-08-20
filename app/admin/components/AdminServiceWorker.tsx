"use client";

import { useEffect } from "react";

export default function AdminServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    void navigator.serviceWorker
      .register("/admin/sw.js", { scope: "/admin/" })
      .catch((error: unknown) => {
        console.error("Unable to register the admin service worker", error);
      });
  }, []);

  return null;
}
