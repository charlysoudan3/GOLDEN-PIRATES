import { useEffect, useState } from "react";
import api from "@/lib/api";

// Session du Conseil partagée par TOUT le site (Nav, Footer, …) :
// vérifiée UNE SEULE FOIS puis mise en cache — plus jamais de requête à chaque
// changement de page, donc plus aucun bouton qui vacille en plein clic.
let isAdminCached = false;
let checkedOnce = false;
const listeners = new Set();

export function refreshAdminSession() {
  return api
    .get("/auth/me")
    .then(() => { isAdminCached = true; checkedOnce = true; })
    .catch(() => { isAdminCached = false; checkedOnce = true; })
    .finally(() => listeners.forEach((l) => l()));
}

export default function useAdminSession() {
  const [, force] = useState(0);

  useEffect(() => {
    const listener = () => force((n) => n + 1);
    listeners.add(listener);
    if (!checkedOnce) refreshAdminSession();
    // Connexion / déconnexion ailleurs dans le site → tout le monde se met à jour
    const onAuth = () => refreshAdminSession();
    window.addEventListener("gp-auth-changed", onAuth);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("gp-auth-changed", onAuth);
    };
  }, []);

  return isAdminCached;
}
