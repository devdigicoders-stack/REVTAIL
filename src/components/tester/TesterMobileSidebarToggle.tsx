"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function TesterMobileSidebarToggle() {
  const pathname = usePathname();

  const [isOpen, setIsOpen] =
    useState(false);

  // ============================================================
  // SYNC SIDEBAR CLASS
  // Existing tester-dashboard.css already uses:
  //
  // .sidebar-wrapper.show {
  //   transform: translateX(0);
  // }
  // ============================================================

  useEffect(() => {
    const sidebar =
      document.getElementById("sidebar");

    if (!sidebar) {
      return;
    }

    sidebar.classList.toggle(
      "show",
      isOpen
    );

    document.body.style.overflow =
      isOpen
        ? "hidden"
        : "";

    return () => {
      document.body.style.overflow =
        "";
    };
  }, [isOpen]);

  // ============================================================
  // CLOSE AFTER NAVIGATION
  // ============================================================

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // ============================================================
  // CLOSE ON ESCAPE
  // ============================================================

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (
        event.key === "Escape"
      ) {
        setIsOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  return (
    <>
      <button
        className="sidebar-toggle-btn me-2"
        id="sidebar-toggle"
        aria-label={
          isOpen
            ? "Close Navigation"
            : "Open Navigation"
        }
        aria-expanded={
          isOpen
        }
        aria-controls="sidebar"
        type="button"
        onClick={() =>
          setIsOpen(
            (current) =>
              !current
          )
        }
      >
        <i
          className={
            isOpen
              ? "bi bi-x-lg"
              : "bi bi-list"
          }
        ></i>
      </button>

      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() =>
            setIsOpen(false)
          }
          className="d-xl-none"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1029,
            border: 0,
            padding: 0,
            margin: 0,
            background:
              "rgba(0, 0, 0, 0.45)",
          }}
        />
      )}
    </>
  );
}
