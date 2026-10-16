"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import {
  api,
  clearAccessToken,
  getAccessToken,
  type AuthUser,
} from "../lib/api";

export default function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (isLoginPage) return;

    let active = true;

    if (!getAccessToken()) {
      router.replace("/login");
      return () => {
        active = false;
      };
    }

    api
      .getCurrentUser()
      .then(({ user: currentUser }) => {
        if (active) {
          setUser(currentUser);
          setChecking(false);
        }
      })
      .catch(() => {
        clearAccessToken();
        if (active) {
          setUser(null);
          setChecking(false);
        }
        router.replace("/login");
      });

    return () => {
      active = false;
    };
  }, [isLoginPage, pathname, router]);

  useEffect(() => {
    function handleUnauthorized() {
      clearAccessToken();
      setUser(null);
      setChecking(false);
      router.replace("/login");
    }

    window.addEventListener("retailsync:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("retailsync:unauthorized", handleUnauthorized);
  }, [router]);

  if (isLoginPage) return <>{children}</>;

  if (checking || !user) {
    return (
      <div className="auth-loading" role="status">
        Checking your RetailSync session…
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-shell">
        <Topbar />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
