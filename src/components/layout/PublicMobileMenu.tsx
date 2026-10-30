"use client";

import { useEffect, useState } from "react";

const navLinks = [
  { label: "Home", href: "/", icon: "bi-house" },
  { label: "About", href: "/about", icon: "bi-info-circle" },
  { label: "How It Works", href: "/how-we-work", icon: "bi-diagram-3" },
  { label: "Contact", href: "/contact", icon: "bi-chat-dots" },
];

export default function PublicMobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const body = document.body;
    const html = document.documentElement;

    const oldBodyOverflow = body.style.overflow;
    const oldHtmlOverflow = html.style.overflow;

    body.style.overflow = "hidden";
    html.style.overflow = "hidden";

    return () => {
      body.style.overflow = oldBodyOverflow;
      html.style.overflow = oldHtmlOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 992) {
        setOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      {/* Mobile Hamburger Toggle Button */}
      <button
        type="button"
        className="mobile-nav-toggle-btn"
        aria-label="Toggle navigation menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span className="hamburger-line" />
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>

      {/* Drawer Overlay & Panel */}
      {open && (
        <div
          className="mobile-drawer-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          {/* Backdrop */}
          <div
            className="mobile-drawer-backdrop"
            onClick={() => setOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="mobile-drawer-panel">
            {/* Drawer Header */}
            <div className="mobile-drawer-header">
              <a href="/" className="d-flex align-items-center" onClick={() => setOpen(false)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/images/logo2.png"
                  alt="Revtail"
                  style={{ height: "36px", width: "auto" }}
                />
              </a>

              {/* Single Close Button */}
              <button
                type="button"
                className="mobile-drawer-close-btn"
                aria-label="Close navigation menu"
                onClick={() => setOpen(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {/* Navigation Links */}
            <div className="mobile-drawer-body">
              <nav className="mobile-drawer-nav">
                <p className="mobile-section-label">Navigation</p>
                <ul className="list-unstyled p-0 m-0">
                  {navLinks.map((item) => (
                    <li key={item.href} className="mobile-nav-item">
                      <a
                        href={item.href}
                        className="mobile-nav-link"
                        onClick={() => setOpen(false)}
                      >
                        <span className="d-flex align-items-center gap-3">
                          <i className={`bi ${item.icon} text-secondary`}></i>
                          <span>{item.label}</span>
                        </span>
                        <i className="bi bi-chevron-right mobile-nav-arrow"></i>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Action Buttons */}
              <div className="mobile-drawer-actions">
                <p className="mobile-section-label">Get Started</p>
                <div className="d-flex flex-column gap-2">
                  <a
                    href="/tester/signup"
                    className="btn w-100 py-2 fw-semibold text-white"
                    style={{ backgroundColor: "#012977", borderRadius: "8px", fontSize: "14px" }}
                    onClick={() => setOpen(false)}
                  >
                    <i className="bi bi-person-check me-2"></i> Join as Tester
                  </a>

                  <a
                    href="/brand/signup"
                    className="btn btn-outline-secondary w-100 py-2 fw-semibold"
                    style={{ borderRadius: "8px", fontSize: "14px", color: "#012977", borderColor: "#cbd5e1" }}
                    onClick={() => setOpen(false)}
                  >
                    <i className="bi bi-briefcase me-2"></i> For Brands
                  </a>

                  <a
                    href="/login"
                    className="btn btn-light w-100 py-2 fw-semibold text-secondary"
                    style={{ borderRadius: "8px", fontSize: "14px", backgroundColor: "#f1f5f9" }}
                    onClick={() => setOpen(false)}
                  >
                    <i className="bi bi-box-arrow-in-right me-2"></i> Sign In to Account
                  </a>
                </div>
              </div>
            </div>

            {/* Drawer Footer Contact */}
            <div className="mobile-drawer-footer">
              <p className="mobile-section-label mb-2">Need Help?</p>
              <div className="d-flex flex-column gap-2" style={{ fontSize: "13px" }}>
                <a
                  href="tel:+918341675736"
                  className="d-flex align-items-center gap-2 text-decoration-none text-dark"
                >
                  <i className="bi bi-telephone text-primary"></i>
                  <span>+91-8341675736</span>
                </a>
                <a
                  href="mailto:support@revtail.in"
                  className="d-flex align-items-center gap-2 text-decoration-none text-dark"
                >
                  <i className="bi bi-envelope text-primary"></i>
                  <span>support@revtail.in</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
