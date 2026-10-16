"use client";

import { useRouter } from "next/navigation";
import { api } from "../lib/api";

export default function Topbar() {
  const router = useRouter();

  function handleLogout() {
    api.logout();
    router.replace("/login");
  }

  return (
    <header className="topbar">
      <div className="global-search">
        <span aria-hidden="true">⌕</span>
        <input
          type="search"
          placeholder="Search inventory, orders..."
          aria-label="Search inventory and orders"
        />
      </div>

      <div className="topbar-actions">
        <button
          className="secondary-button"
          type="button"
          onClick={handleLogout}
        >
          Log out
        </button>
      </div>
    </header>
  );
}
