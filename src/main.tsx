import React from "react";
import { createRoot } from "react-dom/client";

import { AdminApp } from "@/admin/AdminApp";
import { Index } from "@/routes";
import { AdattoPage } from "@/routes/ventures/adatto";
import { Delhi6Page } from "@/routes/ventures/delhi-6";
import { MasaiPage } from "@/routes/ventures/masai";
import { Sr18GamingPage } from "@/routes/ventures/sr18-gaming";
import { Volt50000Page } from "@/routes/ventures/volt-50000";
import { ArnikaTextilesPage } from "@/routes/ventures/arnika-textiles";
import { PrivacyPage } from "@/routes/privacy";
import { initPageTransitions } from "@/lib/pageTransition";
import "./styles.css";

function App() {
  const currentPath =
    window.location.pathname.length > 1
      ? window.location.pathname.replace(/\/+$/, "")
      : window.location.pathname;
  if (currentPath.startsWith("/admin")) {
    return <AdminApp />;
  }

  if (currentPath === "/privacy") {
    return <PrivacyPage />;
  }

  if (currentPath === "/ventures/sr18-gaming") {
    return <Sr18GamingPage />;
  }

  if (currentPath === "/ventures/delhi-6") {
    return <Delhi6Page />;
  }

  if (currentPath === "/ventures/masai") {
    return <MasaiPage />;
  }

  if (currentPath === "/ventures/adatto") {
    return <AdattoPage />;
  }

  if (currentPath === "/ventures/volt-50000") {
    return <Volt50000Page />;
  }

  if (currentPath === "/ventures/arnika-textiles") {
    return <ArnikaTextilesPage />;
  }

  return <Index />;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if (!window.location.pathname.startsWith("/admin")) initPageTransitions();
