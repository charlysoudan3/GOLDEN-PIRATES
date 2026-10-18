import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const BASE_TITLE = "GOLDEN PIRATES — Royaume 1023 | Call of Dragons";
const BASE_DESC =
  "GOLDEN PIRATES — L'alliance souveraine du Royaume 1023 (Call of Dragons). Recrutement pour la fin de la Saison 2 : rejoignez l'équipage.";
const CANONICAL_BASE = "https://golden-pirates.com";
const OG_IMAGE = "https://golden-pirates.com/og-image.png";

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

const setProp = (prop, content) => {
  let el = document.querySelector(`meta[property="${prop}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", prop);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const setCanonical = (path) => {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", `${CANONICAL_BASE}${path === "/" ? "/" : path}`);
};

export default function Seo() {
  const { pathname } = useLocation();
  useEffect(() => {
    const m = ROUTES[pathname] || {};
    const title = m.title || BASE_TITLE;
    const desc = m.desc || BASE_DESC;
    const url = `${CANONICAL_BASE}${pathname === "/" ? "/" : pathname}`;
    document.title = title;
    setMeta("description", desc);
    setMeta(
      "robots",
      m.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1"
    );
    setCanonical(pathname);
    setProp("og:url", url);
    setProp("og:title", title);
    setProp("og:description", desc);
    setProp("og:image", OG_IMAGE);
  }, [pathname]);
  return null;
}
