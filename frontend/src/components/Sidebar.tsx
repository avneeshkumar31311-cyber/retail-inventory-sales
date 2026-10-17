
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard", icon: "▦" },
  { href: "/products", label: "Products", icon: "▤" },
  { href: "/inventory", label: "Inventory", icon: "↕" },
  { href: "/sales/new", label: "Create Sale", icon: "▣" },
  { href: "/sales", label: "Sales History", icon: "▤" },
  { href: "/reports", label: "Reports", icon: "▥" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <Link className="brand" href="/">
        <span className="brand-mark">R</span>
        <span>RetailSync</span>
      </Link>

      <nav className="side-nav" aria-label="Main navigation">
        {links.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname === link.href ||
                pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link${active ? " active" : ""}`}
            >
              <span className="nav-icon" aria-hidden="true">
                {link.icon}
              </span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <span className="status-dot" />
        Inventory workspace
      </div>
    </aside>
  );
}