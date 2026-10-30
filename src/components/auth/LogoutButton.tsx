"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      /*
       * Replace the current page so the user cannot simply
       * press Back and return to the authenticated page.
       */
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      alert("Unable to logout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (

    <a  className="dropdown-item text-danger" href="#"
      onClick={(e) => {
        e.preventDefault();
        handleLogout();
      }}
    >
        <i className="bi bi-box-arrow-right"></i>
        Logout
    </a>
  );
}