import React from "react";
import Script from "next/script";
import PublicMobileMenu from "@/components/layout/PublicMobileMenu";

import "../../../public/assets/css/vendors.min.css";
import "../../../public/assets/css/icon.min.css";
import "../../../public/assets/css/style.css";
import "../../../public/assets/css/responsive.css";
import "../../../public/assets/css/custom.css";
import "../../../public/assets/css/toggle.css";
import "../../../public/assets/demos/data-analysis/data-analysis.css";
import Link from "next/link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/*
        IMPORTANT:
        Do NOT put data-mobile-nav-style="full-screen-menu" here.

        Crafto main.js detects that attribute and clones the navbar/collapse
        into a second mobile navbar. That behavior conflicts with Next.js and
        our React-controlled mobile menu.
      */}
      <div className="custom-cursor" style={{ overflowX: "clip" }}>
        <div className="cursor-page-inner">
          <div className="circle-cursor circle-cursor-inner" />
          <div className="circle-cursor circle-cursor-outer" />
        </div>

        {/* Sticky Header: Entire Top Bar + Navbar stays fixed together when scrolling */}
        <header
          className="revtail-sticky-header"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 1000,
            width: "100%",
          }}
        >
          {/* Minimalist Top Announcement Bar (Desktop & Tablet) */}
          <div
            className="d-none d-md-block"
            style={{
              backgroundColor: "#012977",
              color: "#94a3b8",
              fontSize: "12px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
              padding: "7px 0",
            }}
          >
            <div className="container-fluid px-lg-5">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <span
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.12)",
                      color: "#f8fafc",
                      fontSize: "10.5px",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      textTransform: "uppercase",
                    }}
                  >
                    BRAND PARTNERSHIP
                  </span>
                  <span style={{ color: "#cbd5e1" }}>
                    Are you a brand looking for verified tester reviews?
                  </span>
                  <a
                    href="/brand/signup"
                    style={{
                      color: "#ffffff",
                      fontWeight: 600,
                      textDecoration: "underline",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Register company &rarr;
                  </a>
                </div>

                <div className="d-flex align-items-center gap-3" style={{ fontSize: "12px", color: "#94a3b8" }}>
                  <a
                    href="tel:+918341675736"
                    style={{ color: "#cbd5e1", textDecoration: "none" }}
                  >
                    <i className="feather icon-feather-phone me-1" />
                    +91-8341675736
                  </a>
                  <span style={{ opacity: 0.3 }}>|</span>
                  <a
                    href="mailto:support@revtail.in"
                    style={{ color: "#cbd5e1", textDecoration: "none" }}
                  >
                    <i className="feather icon-feather-mail me-1" />
                    support@revtail.in
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Compact 1-Line Strip for Mobile View (No awkward text wrapping) */}
          <div
            className="d-block d-md-none text-center"
            style={{
              backgroundColor: "#012977",
              color: "#cbd5e1",
              fontSize: "11.5px",
              padding: "6px 12px",
              lineHeight: "1.3",
              borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
            }}
          >
            <span>Are you a brand?</span>{" "}
            <a
              href="/brand/signup"
              style={{
                color: "#ffffff",
                fontWeight: 600,
                textDecoration: "underline",
                marginLeft: "4px",
              }}
            >
              Register now &rarr;
            </a>
          </div>

          <nav
            className="navbar navbar-expand-lg"
            style={{
              backgroundColor: "#ffffff",
              borderBottom: "1px solid #e2e8f0",
              minHeight: "64px",
              padding: "0",
              boxShadow: "0 2px 10px rgba(15, 23, 42, 0.06)",
            }}
          >
            <div className="container-fluid px-3 px-lg-5 d-flex align-items-center justify-content-between" style={{ minHeight: "64px" }}>
              {/* Brand Logo (Left) */}
              <div className="d-flex align-items-center">
                <a
                  className="navbar-brand d-flex align-items-center m-0 p-0"
                  href="/"
                  aria-label="Revtail home"
                  style={{ lineHeight: 1 }}
                >
                  <img
                    src="/assets/images/logo2.png"
                    alt="Revtail"
                    width={125}
                    height={36}
                    style={{ width: "auto", height: "36px", display: "block" }}
                  />
                </a>
              </div>

              {/* Desktop Menu Links (Centered) */}
              <div className="d-none d-lg-flex align-items-center mx-auto">
                <ul className="navbar-nav d-flex flex-row align-items-center gap-2 mb-0 p-0 list-unstyled">
                  <li className="nav-item">
                    <a
                      href="/"
                      style={{
                        fontSize: "14.5px",
                        fontWeight: 500,
                        color: "#334155",
                        padding: "7px 14px",
                        borderRadius: "6px",
                        textDecoration: "none",
                        display: "inline-block",
                        transition: "all 0.15s ease",
                      }}
                    >
                      Home
                    </a>
                  </li>
                  <li className="nav-item">
                    <a
                      href="/about"
                      style={{
                        fontSize: "14.5px",
                        fontWeight: 500,
                        color: "#334155",
                        padding: "7px 14px",
                        borderRadius: "6px",
                        textDecoration: "none",
                        display: "inline-block",
                        transition: "all 0.15s ease",
                      }}
                    >
                      About
                    </a>
                  </li>
                  <li className="nav-item">
                    <a
                      href="/how-we-work"
                      style={{
                        fontSize: "14.5px",
                        fontWeight: 500,
                        color: "#334155",
                        padding: "7px 14px",
                        borderRadius: "6px",
                        textDecoration: "none",
                        display: "inline-block",
                        transition: "all 0.15s ease",
                      }}
                    >
                      How It Works
                    </a>
                  </li>
                  <li className="nav-item">
                    <a
                      href="/contact"
                      style={{
                        fontSize: "14.5px",
                        fontWeight: 500,
                        color: "#334155",
                        padding: "7px 14px",
                        borderRadius: "6px",
                        textDecoration: "none",
                        display: "inline-block",
                        transition: "all 0.15s ease",
                      }}
                    >
                      Contact
                    </a>
                  </li>
                </ul>
              </div>

              {/* Desktop Action CTAs (Right) */}
              <div className="d-none d-lg-flex align-items-center gap-2">
                <a
                  href="/login"
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#334155",
                    padding: "7px 14px",
                    borderRadius: "8px",
                    textDecoration: "none",
                  }}
                >
                  <i className="bi bi-box-arrow-in-right me-1"></i> Log in
                </a>

                <a
                  href="/brand/signup"
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 600,
                    color: "#012977",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    padding: "7px 14px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  For Brands
                </a>

                <a
                  href="/tester/signup"
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 600,
                    color: "#ffffff",
                    backgroundColor: "#012977",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    boxShadow: "0 2px 6px rgba(1, 41, 119, 0.25)",
                    transition: "all 0.2s ease",
                  }}
                >
                  Join as Tester
                </a>
              </div>

              {/* Mobile Navigation Toggle */}
              <div className="d-flex align-items-center d-lg-none ms-auto">
                <PublicMobileMenu />
              </div>
            </div>
          </nav>
        </header>

        <main>{children}</main>

        <footer>
            <div className="container py-4">
              <div className="row align-items-center">
                <div className="col-12 col-lg-auto text-center text-lg-start mb-3 mb-lg-0"> 
                  <a href="/" className="footer-logo">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/assets/images/logo2.png" alt="Revtail" width={135} style={{ height: "38px", width: "auto" }} />
                  </a>
                </div>

              <div className="col-12 col-lg"> 
                <ul className="d-flex flex-wrap justify-content-center justify-content-lg-end align-items-center gap-3 gap-md-4 mb-0 p-0 list-unstyled text-center"> 
                  <li><a href="/how-we-work" className="text-secondary text-decoration-none fw-medium" style={{ fontSize: "14px" }}>How we Work</a></li>
                  <li><a href="/why-choose-us" className="text-secondary text-decoration-none fw-medium" style={{ fontSize: "14px" }}>Why Choose Us</a></li>
                  <li><a href="/privacy" className="text-secondary text-decoration-none fw-medium" style={{ fontSize: "14px" }}>Privacy Policy</a></li>
                  <li><a href="/terms" className="text-secondary text-decoration-none fw-medium" style={{ fontSize: "14px" }}>Terms</a></li>
                  <li><a href="/refund-cancellation-policy" className="text-secondary text-decoration-none fw-medium" style={{ fontSize: "14px" }}>Refund Policy</a></li>
                  <li><a href="/rewards-reimbursement-policy" className="text-secondary text-decoration-none fw-medium" style={{ fontSize: "14px" }}>Rewards</a></li>
                  <li><a href="/faq" className="text-secondary text-decoration-none fw-medium" style={{ fontSize: "14px" }}>FAQs</a></li>
                </ul>
              </div>
            </div>

            <div className="row justify-content-center align-items-center pt-30px">
              <div className="col-12 mb-30px">
                <div className="divider-style-03 divider-style-03-01 border border-color-extra-medium-gray" />
              </div>

              <div className="col-12 col-md-7 fs-14 lh-24 text-center text-md-start mb-3 mb-md-0">
                <p className="mb-0 text-muted">&copy; 2026 Revtail. All Rights Reserved.</p>
              </div>

              <div className="col-12 col-md-5 text-center text-md-end">
                <div className="d-inline-flex align-items-center justify-content-center justify-content-md-end gap-2">
                  <a
                    className="footer-social-btn"
                    href="https://www.facebook.com/share/19FkYiJGnN/"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Facebook"
                  >
                    <i className="bi bi-facebook" />
                  </a>

                  <a
                    className="footer-social-btn"
                    href="https://www.instagram.com/revtail.in?utm_source=qr&igsi=MTR0M2J6Y3VrbHY1OA=="
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                  >
                    <i className="bi bi-instagram" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>

        <div className="scroll-progress d-none d-xxl-block">
          <a href="#" className="scroll-top" aria-label="Scroll to top">
            <span className="scroll-text">Scroll</span>
            <span className="scroll-line">
              <span className="scroll-point" />
            </span>
          </a>
        </div>

        {/*
          Keep the original theme libraries for page animations/widgets.
          The mobile menu no longer depends on any of these scripts.
        */}
        <Script src="/assets/js/jquery.js" strategy="beforeInteractive" />

        <Script
          id="vendors-js"
          src="/assets/js/vendors.min.js"
          strategy="afterInteractive"
        />

        <Script
          id="main-js"
          src="/assets/js/main.js"
          strategy="afterInteractive"
        />
      </div>
    </>
  );
}
