import Link from "next/link";
import Script from "next/script";
import React from "react";
import Image from "next/image";
import DashboardScriptLoader from "../../components/DashboardScriptLoader";
import DashboardSidebarController from "../../components/DashboardSidebarController";
import "./dashboard.css";
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';
import LogoutButton from "@/components/auth/LogoutButton";

export default async function BrandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ============================================================
  // 1. GET CURRENT LOGGED-IN USER
  // ============================================================

  const currentUser = await getCurrentUser();
  // ============================================================
  // 2. LOAD BRAND PROFILE
  // ============================================================

  let brandProfile = null;

  if (
    currentUser &&
    currentUser.role === 'BRAND'
  ) {
    brandProfile =
      await prisma.brandProfile.findUnique({
        where: {
          userId: currentUser.userId,
        },

        select: {
          id: true,           //added 24/9
          companyName: true,
          companyType: true,
           category: {
            select: {
              id: true,
              name: true,
            },
          },

          pocFullName: true,
          pocMobile: true,
          designation: true,

          website: true,
        },
      });
  }

  // ============================================================
  // 3. CHECK PROFILE COMPLETION
  // ============================================================

  const requiredFields = [
    brandProfile?.companyName,
    brandProfile?.companyType,
    brandProfile?.category,
    brandProfile?.pocFullName,
    brandProfile?.pocMobile,
    brandProfile?.designation,
  ];

  const completedFields =
    requiredFields.filter((field) => {
      if (field === null || field === undefined) {
        return false;
      }

      if (
        typeof field === 'string' &&
        field.trim() === ''
      ) {
        return false;
      }

      return true;
    }).length;

  const totalRequiredFields =
    requiredFields.length;

  const profileCompletionPercentage =
    totalRequiredFields > 0
      ? Math.round(
          (completedFields /
            totalRequiredFields) *
            100
        )
      : 0;

  const isProfileComplete =
    brandProfile !== null &&
    completedFields ===
      totalRequiredFields;
  // ============================================================
  // 5. Brand DISPLAY NAME
  // ============================================================

  const brandName =
    brandProfile?.companyName ||
    "Brand";
  return (
    <>
      <div className="sidebar-wrapper" id="sidebar">
        {/* Logo & Mobile Close */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <Link href="/brand" className="sidebar-brand mb-0">
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
          <div className="sidebar-menu-section">
            <div className="sidebar-menu-title">Menu</div>
            <ul className="sidebar-menu-list">
              <li className="sidebar-menu-item">
                 <Link href="/brand"  className="sidebar-menu-link active" id="menu-overview" title="Overview">
                  <i className="bi bi-grid-fill"></i>
                    <span>Dashboard</span>
                </Link>
                
              </li>
            </ul>
          </div>

          <div className="sidebar-menu-section">
            <div className="sidebar-menu-title">Campaigns</div>
            <ul className="sidebar-menu-list">
              <li className="sidebar-menu-item">
                <Link href="/brand/campaigns/list"  className="sidebar-menu-link" id="menu-basictables" title=" ">
                  <i className="bi bi-table"></i>
                    <span>Active Campaigns</span>
                </Link>
                
              </li>
              <li className="sidebar-menu-item">
                 <Link href="/brand/campaigns/list/history"  className="sidebar-menu-link" id="menu-basictables" title=" ">
                  <i className="bi bi-table"></i>
                    <span>Campaigns History</span>
                </Link>
              </li>
              <li className="sidebar-menu-item">
                <Link href="/brand/campaigns/rejected" className="sidebar-menu-link" id="menu-basictables" title=" ">
                  <i className="bi bi-x-circle"></i>
                   <span>Rejected Campaigns</span>
                </Link>
              </li>
              <li className="sidebar-menu-item">
                 <Link href="/brand/analytics"  className="sidebar-menu-link" id="menu-basictables" title=" ">
                  <i className="bi bi-table"></i>
                    <span>Analytics</span>
                </Link>
              </li>
              <li className="sidebar-menu-item">
                 <Link href="#"  className="sidebar-menu-link" id="menu-basictables" title=" "
                 style={{ pointerEvents: 'none'}}>
                  <i className="bi bi-table"></i>
                    <span>Contact Us</span>
                </Link>
                <div className="sidebar-menu-item-details" style={{ opacity: 0.6,marginLeft: "45px", fontSize: "14px", color: "#fff" }}>
                  Mobile: +91 8341675736 <br />
                  Email:  info@revtail.in
                </div>
              </li>
            </ul>
          </div>

          {/* <div className="sidebar-menu-section">
            <div className="sidebar-menu-title">Invitations</div>
            <ul className="sidebar-menu-list">
              <li className="sidebar-menu-item">
                <a
                  href="page-blank.html"
                  className="sidebar-menu-link"
                  id="menu-blankpage"
                  title="Blank Page"
                >
                  <i className="bi bi-file-earmark"></i>
                  <span>Brand</span>
                </a>
              </li>
              <li className="sidebar-menu-item">
                <a
                  href="page-login.html"
                  className="sidebar-menu-link"
                  id="menu-loginpage"
                  title="Login Page"
                >
                  <i className="bi bi-box-arrow-in-right"></i>
                  <span>Tester</span>
                </a>
              </li>
              <li className="sidebar-menu-item">
                <a
                  href="page-404.html"
                  className="sidebar-menu-link"
                  id="menu-404"
                  title="404 Page"
                >
                  <i className="bi bi-slash-circle"></i>
                  <span>Campaigns</span>
                </a>
              </li>
              <li className="sidebar-menu-item">
                <a
                  href="page-404.html"
                  className="sidebar-menu-link"
                  id="menu-404"
                  title="404 Page"
                >
                  <i className="bi bi-slash-circle"></i>
                  <span>Tester Campaigns</span>
                </a>
              </li>
              <li className="sidebar-menu-item">
                <a
                  href="page-404.html"
                  className="sidebar-menu-link"
                  id="menu-404"
                  title="404 Page"
                >
                  <i className="bi bi-slash-circle"></i>
                  <span>Payments</span>
                </a>
              </li>
            </ul>
          </div> */}
        </div>

        <div className="sidebar-profile mt-auto">
          <div className="sidebar-profile-avatar me-2">
            <i className="bi bi-building-check text-white fs-5"></i>
          </div>
          <div className="sidebar-profile-info overflow-hidden">
            <div className="sidebar-profile-name text-truncate">Hi, {brandName}!</div>
            <div className="text-white-50" style={{ fontSize: "11px" }}>Brand Partner</div>
          </div>
        </div>
      </div>

      <div className="main-wrapper">
        <header className="navbar-custom">
          <div className="navbar-left">
            <button
              className="sidebar-toggle-btn me-2"
              id="sidebar-toggle"
              aria-label="Toggle Navigation"
              type="button"
            >
              <i className="bi bi-list"></i>
            </button>

            <Link
              href="/brand"
              className="d-flex d-xl-none align-items-center m-0 p-0 text-decoration-none me-2"
              aria-label="Revtail Home"
            >
              <Image
                src="/assets/images/logo2.png"
                alt="Revtail"
                width={110}
                height={30}
                style={{ height: "26px", width: "auto" }}
                priority
              />
            </Link>

            <div className="dropdown ms-2">
              <button
                className="btn-quick-action dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                id="quick-actions-dropdown"
              >
                <i className="bi bi-plus-lg"></i>
                <span>Create</span>
              </button>
              <ul
                className="dropdown-menu dropdown-menu-quick-action"
                aria-labelledby="quick-actions-dropdown"
              >
                <li className="dropdown-header">Quick Action Shortcuts</li>
                <li>
                  <Link className="dropdown-item" href="/brand/campaigns/create">
                    <i className="bi bi-file-earmark-plus"></i> New Campaign
                  </Link>
                </li>
                {/* <li>
                  <a className="dropdown-item" href="#">
                    <i className="bi bi-person-plus"></i> New Fixed Questions
                  </a>
                </li> */}
              </ul>
            </div>
          </div>

          <div className="navbar-search-wrapper">
            {/* <input
              type="text"
              className="navbar-search-input"
              placeholder="Search.."
              id="main-search"
            />
            <button
              className="navbar-search-btn"
              aria-label="Search"
              type="button"
            >
              <i className="bi bi-search"></i>
            </button> */}
          </div>

          <div className="navbar-actions ms-auto">
           
            <div className="dropdown ms-2">
              <button
                className="navbar-profile-btn dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                id="profile-dropdown"
              >
                <i className="bi bi-person-circle me-2 fs-5"></i>
                <span className="navbar-profile-name d-none d-md-inline">
                  {brandName}
                </span>
                <i className="bi bi-chevron-down navbar-profile-caret"></i>
              </button>
              <ul
                className="dropdown-menu dropdown-menu-end dropdown-menu-profile"
                aria-labelledby="profile-dropdown"
              >
                <li className="dropdown-profile-header">
                  <div className="user-name text-truncate">{brandName}</div>
                  <div className="user-role">Brand Partner</div>
                </li>
                <li>
                  <Link
                    className="dropdown-item"
                    href="/brand/account">
                    <i className="bi bi-person"></i>
                    My Account
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

        <div className="row g-4">{children}</div>

        <footer className="footer-custom">
          <div className="footer-left">
            <span className="footer-logo">
              {brandName}
            </span>
            <span className="footer-separator">|</span>
            <span className="footer-copy">
              &copy; 2026 Revtail. All Rights Reserved.
            </span>
          </div>
        </footer>
      </div>
      {/* Vendor Scripts */}
       <Script
        src="/assets/libs/bootstrap/js/bootstrap.bundle.min.js"
        strategy="afterInteractive"
      />
      {/* <Script
        src="/assets/libs/apexcharts/apexcharts.min.js"
        strategy="afterInteractive"
      />
      <Script
        src="/assets/libs/flatpickr/flatpickr.min.js"
        strategy="afterInteractive"
      />  */}

      <DashboardScriptLoader />
      <DashboardSidebarController />
    </>
  );
}
