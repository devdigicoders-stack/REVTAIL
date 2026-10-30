import Link from "next/link";
import Script from "next/script";
import React from "react";
import Image from "next/image";
import { redirect } from "next/navigation";

import DashboardScriptLoader from "../../components/DashboardScriptLoader";
import DashboardSidebarController from "../../components/DashboardSidebarController";
import LogoutButton from "@/components/auth/LogoutButton";
import TesterBottomNav from "@/components/tester/TesterBottomNav";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

import "./tester-dashboard.css";

export default async function TesterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ============================================================
  // 1. GET CURRENT LOGGED-IN USER
  // ============================================================

  const currentUser = await getCurrentUser();

  // ============================================================
  // 2. PROTECT TESTER ROUTES
  // ============================================================

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "TESTER") {
    redirect("/");
  }

  // ============================================================
  // 3. LOAD TESTER PROFILE
  // ============================================================

  const testerProfile =
    await prisma.testerProfile.findUnique({
      where: {
        userId: currentUser.userId,
      },

      select: {
        id: true,

        fullName: true,
        gender: true,
        ageCategory: true,

        pinCode: true,
        city: true,
        state: true,

        profileImage: true,
        instagramId: true,

        approvalStatus: true,

        interests: {
          select: {
            id: true,

            interest: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },

        bankDetails: {
          select: {
            id: true,
            accountHolderName: true,
            bankName: true,
            accountNumberLast4: true,
            ifscCode: true,
            isActive: true,
          },
        },

        user: {
          select: {
            email: true,
            mobile: true,
            status: true,
          },
        },
      },
    });

  // ============================================================
  // 4. TESTER DISPLAY NAME
  // ============================================================

  const testerName =
    testerProfile?.fullName ||
    "Tester";

  return (
    <>
      {/* ========================================================
          SIDEBAR
      ======================================================== */}

      <div
        className="sidebar-wrapper"
        id="sidebar"
      >
        {/* Logo & Mobile Close */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <Link
            href="/tester"
            className="sidebar-brand mb-0"
          >
            <Image
              src="/assets/images/logo-admin.png"
              alt="Revtail Logo"
              width={140}
              height={38}
              priority
            />
          </Link>

          <button
            type="button"
            className="btn btn-sm d-xl-none text-white p-1"
            id="sidebar-close-btn"
            aria-label="Close navigation"
          >
            <i className="bi bi-x-lg fs-5"></i>
          </button>
        </div>

        <div className="grow overflow-y-auto">

          {/* =========================
              DASHBOARD
          ========================= */}

          <div className="sidebar-menu-section">

            <div className="sidebar-menu-title">
              Menu
            </div>

            <ul className="sidebar-menu-list">

              <li className="sidebar-menu-item">
                <Link
                  href="/tester"
                  className="sidebar-menu-link"
                  title="Dashboard"
                >
                  <i className="bi bi-grid-fill"></i>

                  <span>
                    Dashboard
                  </span>
                </Link>
              </li>

            </ul>

          </div>

          {/* =========================
              CAMPAIGNS
          ========================= */}

          <div className="sidebar-menu-section">

            <div className="sidebar-menu-title">
              Campaigns
            </div>

            <ul className="sidebar-menu-list">

              {/* Live Campaigns */}

              <li className="sidebar-menu-item">
                <Link
                  href="/tester/campaigns/live"
                  className="sidebar-menu-link"
                  title="Live Campaigns"
                >
                  <i className="bi bi-megaphone"></i>

                  <span>
                    Live Campaigns
                  </span>
                </Link>
              </li>

              {/* My Applications */}

              <li className="sidebar-menu-item">
                <Link
                  href="/tester/campaigns/applications"
                  className="sidebar-menu-link"
                  title="My Applications"
                >
                  <i className="bi bi-send-check"></i>

                  <span>
                    My Campaigns
                  </span>
                </Link>
              </li>

              {/* Ongoing Campaigns */}

              <li className="sidebar-menu-item">
                <Link
                  href="/tester/campaigns/ongoing"
                  className="sidebar-menu-link"
                  title="Ongoing Campaigns"
                >
                  <i className="bi bi-hourglass-split"></i>

                  <span>
                    Ongoing Active Campaigns
                  </span>
                </Link>
              </li>

              {/* Campaign History */}

              <li className="sidebar-menu-item">
                <Link
                  href="/tester/campaigns/history"
                  className="sidebar-menu-link"
                  title="Campaign History"
                >
                  <i className="bi bi-clock-history"></i>

                  <span>
                    Campaign History
                  </span>
                </Link>
              </li>

              {/* <li className="sidebar-menu-item">
                <Link
                  href="/tester/campaigns/stopped"
                  className="sidebar-menu-link"
                >
                  <i className="bi bi-stop-circle me-2" />

                  <span>
                    Stopped Campaigns
                  </span>
                </Link>
              </li> */}

            </ul>

          </div>

          {/* =========================
              ACCOUNT
          ========================= */}

          <div className="sidebar-menu-section">

            <div className="sidebar-menu-title">
              Account
            </div>

            <ul className="sidebar-menu-list">

              {/* Wallet */}

              <li className="sidebar-menu-item">
                <Link
                  href="/tester/wallet"
                  className="sidebar-menu-link"
                  title="Wallet"
                >
                  <i className="bi bi-wallet2"></i>

                  <span>
                    Wallet
                  </span>
                </Link>
              </li>

              {/* Payments */}

              {/* <li className="sidebar-menu-item">
                <Link
                  href="/tester/payments"
                  className="sidebar-menu-link"
                  title="Payments"
                >
                  <i className="bi bi-cash-stack"></i>

                  <span>
                    Payments
                  </span>
                </Link>
              </li> */}

              {/* Profile */}

              <li className="sidebar-menu-item">
                <Link
                  href="/tester/profile"
                  className="sidebar-menu-link"
                  title="My Profile"
                >
                  <i className="bi bi-person-circle"></i>

                  <span>
                    My Profile
                  </span>
                </Link>
              </li>
              <li className="sidebar-menu-item">
                <Link
                  href="https://chat.whatsapp.com/JLDLEwZWJTPJKhPl5XzWQD"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sidebar-menu-link"
                >
                  <i className="bi bi-whatsapp"></i>
                  WhatsApp Community
                </Link>
              </li>
              <li className="sidebar-menu-item">
                <Link
                    href="tel:+91-8341675736"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sidebar-menu-link"
                  >
                    <i className="bi bi-telephone text-primary"></i>
                    Contact Us
                  </Link>
              </li>             

            </ul>

          </div>

        </div>

        {/* ======================================================
            SIDEBAR PROFILE
        ====================================================== */}

        <div className="sidebar-profile mt-auto">
          <div className="sidebar-profile-avatar me-2">
            <i className="bi bi-person-check text-white fs-5"></i>
          </div>
          <div className="sidebar-profile-info overflow-hidden">
            <div className="sidebar-profile-name text-truncate">
              Hi, {testerName}!
            </div>
            <div className="text-white-50" style={{ fontSize: "11px" }}>Revtail Tester</div>
          </div>
        </div>

      </div>

      {/* ========================================================
          MAIN WRAPPER
      ======================================================== */}

      <div className="main-wrapper">

        {/* ======================================================
            NAVBAR
        ====================================================== */}

        <header className="navbar-custom">

          <div className="navbar-left d-flex align-items-center">

            <button
              className="sidebar-toggle-btn me-2"
              id="sidebar-toggle"
              aria-label="Toggle Navigation"
              type="button"
            >
              <i className="bi bi-list fs-4"></i>
            </button>

            <Link
              href="/tester"
              className="navbar-brand d-flex align-items-center m-0 p-0 text-decoration-none"
              aria-label="Revtail Home"
            >
              <Image
                src="/assets/images/logo2.png"
                alt="Revtail Logo"
                width={120}
                height={34}
                style={{ height: "30px", width: "auto", display: "block" }}
                priority
              />
            </Link>

          </div>

          {/* ====================================================
              USER MENU (Always pushed to far right)
          ==================================================== */}

          <div className="navbar-actions ms-auto">

            <div className="dropdown">

              <button
                className="navbar-profile-btn dropdown-toggle d-flex align-items-center gap-2"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                id="profile-dropdown"
              >
                {testerProfile?.profileImage ? (
                  <Image
                    src={testerProfile.profileImage}
                    alt={testerName}
                    width={36}
                    height={36}
                    className="rounded-circle object-fit-cover"
                    style={{ border: "2px solid #e2e8f0" }}
                  />
                ) : (
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-primary"
                    style={{
                      width: "36px",
                      height: "36px",
                      backgroundColor: "#eff6ff",
                      border: "1px solid #dbeafe",
                      color: "#012977",
                    }}
                  >
                    <i className="bi bi-person-fill fs-5" style={{ color: "#012977" }}></i>
                  </div>
                )}

                <span className="navbar-profile-name d-none d-md-inline fw-semibold text-dark">
                  {testerName}
                </span>

                <i className="bi bi-chevron-down navbar-profile-caret text-muted" style={{ fontSize: "11px" }}></i>

              </button>

              <ul
                className="dropdown-menu dropdown-menu-end dropdown-menu-profile"
                aria-labelledby="profile-dropdown"
              >

                <li className="dropdown-profile-header">
                  <div className="user-name text-truncate">{testerName}</div>
                  <div className="user-role">Verified Tester</div>
                </li>

                <li>
                  <Link
                    className="dropdown-item"
                    href="/tester/profile"
                  >
                    <i className="bi bi-person"></i>
                    My Profile
                  </Link>
                </li>

                <li>
                  <Link
                    className="dropdown-item"
                    href="/tester/wallet"
                  >
                    <i className="bi bi-wallet2"></i>
                    Wallet
                  </Link>
                </li>

                <li>
                  <hr className="dropdown-divider" />
                </li>

                <li>
                  <LogoutButton />
                </li>

              </ul>

            </div>

          </div>

        </header>

        {/* ======================================================
            PAGE CONTENT
        ====================================================== */}

        <div className="row g-4">
          {children}
        </div>

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <footer className="footer-custom">

          <div className="footer-left">

            <span className="footer-logo">
              Revtail
            </span>

            <span className="footer-separator">
              |
            </span>

            <span className="footer-copy">
              &copy; 2026 Revtail.
              All rights reserved.
            </span>

          </div>

        </footer>

      </div>
      {/* ========================================================
          MOBILE BOTTOM NAVIGATION
      ======================================================== */}

      <TesterBottomNav />
      
      {/* ========================================================
          VENDOR SCRIPTS
      ======================================================== */}

      <Script
        src="/assets/libs/bootstrap/js/bootstrap.bundle.min.js"
        strategy="afterInteractive"
      />

      <DashboardScriptLoader />
      <DashboardSidebarController />
    </>
  );
}