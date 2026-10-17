import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const BASE_TITLE = "GOLDEN PIRATES — Royaume 1023 | Call of Dragons";
const BASE_DESC =
  "GOLDEN PIRATES — L'alliance souveraine du Royaume 1023 (Call of Dragons). Recrutement pour la fin de la Saison 2 : rejoignez l'équipage.";

const ROUTES = {
  "/suivi": {
    title: "Suivre ma candidature — GOLDEN PIRATES",
    desc: "Consultez l'état de votre dossier avec votre code de suivi GP-1023-XXXX. Code perdu ? Retrouvez-le avec votre pseudo et votre Discord, ou votre puissance exacte.",
  },
  "/admin": {
    title: "Espace Conseil — GOLDEN PIRATES",
    desc: "Espace privé du Conseil des Capitaines : registre des candidatures, messagerie et exports. Accès réservé.",
    noindex: true,
  },
};

const setMeta = (name, content) => {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

export default function Seo() {
  const { pathname } = useLocation();
  useEffect(() => {
    const m = ROUTES[pathname] || {};
    document.title = m.title || BASE_TITLE;
    setMeta("description", m.desc || BASE_DESC);
    setMeta(
      "robots",
      m.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1"
    );
  }, [pathname]);
  return null;
}
