"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TesterBottomNav() {
  const pathname = usePathname();

  const menuItems = [
    {
      label: "Live",
      href: "/tester/campaigns/live",
      icon: "bi-megaphone",
    },
    {
      label: "My Apps",
      href: "/tester/campaigns/applications",
      icon: "bi-send-check",
    },
    {
      label: "Ongoing",
      href: "/tester/campaigns/ongoing",
      icon: "bi-hourglass-split",
    },
    {
      label: "Completed",
      href: "/tester/campaigns/history",
      icon: "bi-check-circle",
    },
  ];

  return (
    <nav
      className="tester-mobile-bottom-nav"
      aria-label="Tester mobile navigation"
    >
      {menuItems.map((item) => {
        const isActive =
          pathname === item.href ||
          pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`tester-mobile-bottom-nav-item ${
              isActive ? "active" : ""
            }`}
          >
            <i
              className={`bi ${item.icon} tester-mobile-bottom-nav-icon`}
            ></i>

            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}