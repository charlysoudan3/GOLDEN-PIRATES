import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "@/lib/api";

export default function useAdminSession() {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let stop = false;
    const check = () => {
      api
        .get("/auth/me")
        .then(() => { if (!stop) setIsAdmin(true); })
        .catch(() => { if (!stop) setIsAdmin(false); });
    };
    check();
    window.addEventListener("gp-auth-changed", check);
    return () => {
      stop = true;
      window.removeEventListener("gp-auth-changed", check);
    };
  }, [location.pathname]);

  return isAdmin;
}