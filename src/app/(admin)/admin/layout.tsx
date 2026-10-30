import Link from "next/link";
import Script from "next/script";
import React from "react";
import Image from "next/image";
import { redirect } from "next/navigation";

import DashboardScriptLoader from "../../components/DashboardScriptLoader";
import AdminSidebarController from "../../components/admin/AdminSidebarController";
import "./admin-dashboard.css";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import LogoutButton from "@/components/auth/LogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ============================================================
  // 1. GET CURRENT LOGGED-IN USER
  // ============================================================

  const currentUser = await getCurrentUser();

  // ============================================================
  // 2. AUTHENTICATION / ROLE CHECK
  // ============================================================

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "ADMIN") {
    if (currentUser.role === "BRAND") {
      redirect("/brand");
    }

    if (currentUser.role === "TESTER") {
      redirect("/tester");
    }

    redirect("/login");
  }

  // ============================================================
  // 3. LOAD ADMIN PROFILE
  // ============================================================

  const adminProfile =
    await prisma.adminProfile.findUnique({
      where: {
        userId: currentUser.userId,
      },

      select: {
        fullName: true,
        designation: true,
        profileImage: true,
      },
    });

  // ============================================================
  // 4. ADMIN DISPLAY INFORMATION
  // ============================================================

  const adminName =
    adminProfile?.fullName || "Administrator";

  const adminDesignation =
    adminProfile?.designation || "Administrator";

  const adminProfileImage =
    adminProfile?.profileImage || null;

  // ============================================================
  // 5. SIDEBAR PENDING APPROVAL COUNTS
  // ============================================================

  const [
    pendingTaskApprovals,
    pendingPaymentRequests,
    newInquiriesCount,
  ] = await Promise.all([
    prisma.testerCampaignTask.count({
      where: {
        status: "SUBMITTED",
        taskNumber: {
          in: [1, 2, 3, 4],
        },
      },
    }),

    prisma.paymentRequest.count({
      where: {
        status: "PENDING",
      },
    }),

    prisma.contactInquiry.count({
      where: {
        status: "NEW",
      },
    }),
  ]);

  return (
    <>
      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <div
        className="sidebar-wrapper"
        id="sidebar"
      >
        {/* Logo & Mobile Close */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <Link
            href="/admin"
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

        {/* ====================================================
            SIDEBAR MENU
        ==================================================== */}

        <div className="grow overflow-y-auto">

          {/* ==================================================
              DASHBOARD
          ================================================== */}

          <div className="sidebar-menu-section">
            <div className="sidebar-menu-title">
              Menu
            </div>

            <ul className="sidebar-menu-list">
              <li className="sidebar-menu-item">
                <Link
                  href="/admin"
                  className="sidebar-menu-link active"
                  id="menu-overview"
                  title="Dashboard"
                >
                  <i className="bi bi-grid-fill"></i>

                  <span>Dashboard</span>
                </Link>
              </li>
            </ul>
          </div>

                    {/* ==================================================
              USERS
          ================================================== */}

          <div className="sidebar-menu-section">
            <div className="sidebar-menu-title">
              Users
            </div>

            <ul className="sidebar-menu-list">

              {/* Brands */}
              <li className="sidebar-menu-item">
                <Link
                  href="/admin/brands"
                  className="sidebar-menu-link"
                  title="Brands"
                >
                  <i className="bi bi-buildings"></i>

                  <span>Brands</span>
                </Link>
              </li>

              {/* Testers */}
              <li className="sidebar-menu-item">
                <Link
                  href="/admin/testers"
                  className="sidebar-menu-link"
                  title="Testers"
                >
                  <i className="bi bi-people"></i>

                  <span>Testers</span>
                </Link>
              </li>
            </ul>
          </div>


          {/* ==================================================
              APPROVALS
          ================================================== */}

          {/* <div className="sidebar-menu-section">
            <div className="sidebar-menu-title">
              Approvals
            </div>

            <ul className="sidebar-menu-list">

              <li className="sidebar-menu-item">
                <Link
                  href="/admin/approvals/brands"
                  className="sidebar-menu-link"
                  title="Brand Approvals"
                >
                  <i className="bi bi-building-check"></i>

                  <span>Brand Approvals</span>
                </Link>
              </li>

              <li className="sidebar-menu-item">
                <Link
                  href="/admin/approvals/testers"
                  className="sidebar-menu-link"
                  title="Tester Approvals"
                >
                  <i className="bi bi-person-check"></i>

                  <span>Tester Approvals</span>
                </Link>
              </li>

              <li className="sidebar-menu-item">
                <Link
                  href="/admin/approvals/campaigns"
                  className="sidebar-menu-link"
                  title="Campaign Approvals"
                >
                  <i className="bi bi-megaphone"></i>

                  <span>Campaign Approvals</span>
                </Link>
              </li>

              <li className="sidebar-menu-item">
                <Link
                  href="/admin/approvals/applications"
                  className="sidebar-menu-link"
                  title="Tester Applications"
                >
                  <i className="bi bi-person-plus"></i>

                  <span>Tester Applications</span>
                </Link>
              </li>

              <li className="sidebar-menu-item">
                <Link
                  href="/admin/approvals/tasks"
                  className="sidebar-menu-link"
                  title="Task Review"
                >
                  <i className="bi bi-list-check"></i>

                  <span>Task Review</span>

                  {pendingTaskApprovals > 0 && (
                    <span className="badge rounded-pill bg-danger ms-auto">
                      {pendingTaskApprovals > 99
                        ? "99+"
                        : pendingTaskApprovals}
                    </span>
                  )}
                </Link>
              </li>

              <li className="sidebar-menu-item">
                <Link
                  href="/admin/approvals/payments"
                  className="sidebar-menu-link"
                  title="Payment Requests"
                >
                  <i className="bi bi-cash-stack"></i>

                  <span>Payment Requests</span>

                  {pendingPaymentRequests > 0 && (
                    <span className="badge rounded-pill bg-danger ms-auto">
                      {pendingPaymentRequests > 99
                        ? "99+"
                        : pendingPaymentRequests}
                    </span>
                  )}
                </Link>
              </li>
            </ul>
          </div> */}

          {/* ==================================================
              CAMPAIGNS
          ================================================== */}

          <div className="sidebar-menu-section">
            <div className="sidebar-menu-title">
              Campaigns
            </div>

            <ul className="sidebar-menu-list">

              {/* Live Campaigns */}
              <li className="sidebar-menu-item">
                <Link
                  href="/admin/campaigns"
                  className="sidebar-menu-link"
                  title="Live Campaigns"
                >
                  <i className="bi bi-broadcast"></i>

                  <span>Live Campaigns</span>
                </Link>
              </li>

              {/* Campaign History */}
              <li className="sidebar-menu-item">
                <Link
                  href="/admin/campaigns/history"
                  className="sidebar-menu-link"
                  title="Campaign History"
                >
                  <i className="bi bi-clock-history"></i>

                  <span>Campaign History</span>
                </Link>
              </li>
              <li className="sidebar-menu-item">
                <Link
                  href="/admin/invitations"
                  className="sidebar-menu-link"
                  title="Invitation"
                >
                  <i className="bi bi-send"></i>

                  <span>Invitation</span>
                </Link>
              </li>
              <li className="sidebar-menu-item">
                <Link
                  href="/admin/approvals/payments"
                  className="sidebar-menu-link"
                  title="Payment Requests"
                >
                  <i className="bi bi-cash-stack"></i>

                  <span>Payment Requests</span>

                  {pendingPaymentRequests > 0 && (
                    <span className="badge rounded-pill bg-danger ms-auto">
                      {pendingPaymentRequests > 99
                        ? "99+"
                        : pendingPaymentRequests}
                    </span>
                  )}
                </Link>  
              </li>

            </ul>
          </div>

          {/* ==================================================
              INVITATIONS
          ================================================== */}
          {/* 
          <div className="sidebar-menu-section">
            <div className="sidebar-menu-title">
              Invitations
            </div>

            <ul className="sidebar-menu-list">

              <li className="sidebar-menu-item">
                <Link
                  href="/admin/invitations"
                  className="sidebar-menu-link"
                  title="Invitation Management"
                >
                  <i className="bi bi-send"></i>

                  <span>Manage Invitations</span>
                </Link>
              </li>
            </ul>
          </div> */}


          {/* ==================================================
              MANAGEMENT
          ================================================== */}

          <div className="sidebar-menu-section">
            <div className="sidebar-menu-title">
              Management
            </div>

            <ul className="sidebar-menu-list">

              {/* Questionnaire */}
              <li className="sidebar-menu-item">
                <Link
                  href="/admin/questions"
                  className="sidebar-menu-link"
                  title="Questionnaire"
                >
                  <i className="bi bi-question-circle"></i>

                  <span>Questionnaire</span>
                </Link>
              </li>

              {/* Analytics */}
              <li className="sidebar-menu-item">
                <Link
                  href="/admin/analytics"
                  className="sidebar-menu-link"
                  title="Analytics"
                >
                  <i className="bi bi-bar-chart-fill"></i>

                  <span>Analytics</span>
                </Link>
              </li>

              {/* Contact Messages */}
              <li className="sidebar-menu-item">
                <Link
                  href="/admin/inquiries"
                  className="sidebar-menu-link"
                  title="Contact Messages"
                >
                  <i className="bi bi-chat-left-text"></i>

                  <span>Contact Messages</span>

                  {newInquiriesCount > 0 && (
                    <span className="badge rounded-pill bg-danger ms-auto">
                      {newInquiriesCount > 99
                        ? "99+"
                        : newInquiriesCount}
                    </span>
                  )}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* ====================================================
            SIDEBAR ADMIN PROFILE
        ==================================================== */}

        <div className="sidebar-profile">
          <div className="sidebar-profile-avatar">
            {adminProfileImage ? (
              <Image
                src={adminProfileImage}
                alt={adminName}
                width={36}
                height={36}
                className="rounded-circle"
              />
            ) : (
              <i className="bi bi-person-circle fs-4 text-white"></i>
            )}
          </div>

          <div className="sidebar-profile-info ms-2">
            <div className="sidebar-profile-name text-white fw-bold">
              {adminName}
            </div>
            <div className="sidebar-profile-role text-info" style={{ fontSize: "11px" }}>
              {adminDesignation}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          MAIN WRAPPER
      ====================================================== */}

      <div className="main-wrapper">

        {/* ====================================================
            TOP NAVBAR
        ==================================================== */}

        <header className="navbar-custom">

          {/* LEFT SIDE */}
          <div className="navbar-left">

            {/* Mobile Sidebar Button */}
            <button
              className="sidebar-toggle-btn me-2"
              id="sidebar-toggle"
              aria-label="Toggle Navigation"
              type="button"
            >
              <i className="bi bi-list"></i>
            </button>

            <Link
              href="/admin"
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

            {/* ==================================================
                QUICK ACTIONS
            ================================================== */}

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
                <li className="dropdown-header">
                  Quick Action Shortcuts
                </li>
                <li>
                  <Link className="dropdown-item" href="/admin/campaigns/create" >
                    <i className="bi bi-plus-circle"></i>Create Campaign                    
                  </Link>
                </li>
              
                {/* Question */}
                <li>
                  <Link className="dropdown-item" href="/admin/questions/create">
                    <i className="bi bi-question-circle"></i> Fixed Questions
                  </Link>
                </li>

                {/* Invitation */}
                {/* <li>
                  <Link
                    className="dropdown-item"
                    href="/admin/invitations"
                  >
                    <i className="bi bi-send"></i>

                    Send Invitation
                  </Link>
                </li> */}
              </ul>
            </div>
          </div>

          {/* ==================================================
              SEARCH
          ================================================== */}
          {/* 
          <div className="navbar-search-wrapper">

            <input
              type="text"
              className="navbar-search-input"
              placeholder="Search..."
              id="main-search"
            />

            <button
              className="navbar-search-btn"
              aria-label="Search"
              type="button"
            >
              <i className="bi bi-search"></i>
            </button>
          </div> */}
          <div className="navbar-search-wrapper"> </div>
          {/* ==================================================
              NAVBAR RIGHT
          ================================================== */}

          <div className="navbar-actions ms-auto">

            {/* Notifications */}
            {/* <button
              type="button"
              className="btn position-relative me-2"
              title="Notifications"
            >
              <i className="bi bi-bell fs-5"></i>
            </button> */}

            {/* ==================================================
                ADMIN PROFILE DROPDOWN
            ================================================== */}

            <div className="dropdown ms-2">

              <button
                className="navbar-profile-btn dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                id="profile-dropdown"
              >
                {/* Profile Image */}

                {adminProfileImage ? (
                  <Image
                    src={adminProfileImage}
                    alt={adminName}
                    width={32}
                    height={32}
                    className="rounded-circle me-2"
                  />
                ) : (
                  <i className="bi bi-person-circle me-2"></i>
                )}

                <span className="navbar-profile-name d-none d-md-inline">
                  {adminName}
                </span>

                <i className="bi bi-chevron-down navbar-profile-caret"></i>
              </button>

              <ul
                className="dropdown-menu dropdown-menu-end dropdown-menu-profile"
                aria-labelledby="profile-dropdown"
              >
                <li className="dropdown-profile-header">
                  <div className="user-name text-truncate">{adminName}</div>
                  <div className="user-role">Super Admin</div>
                </li>

                {/* Profile */}
                <li>
                  <Link
                    className="dropdown-item"
                    href="/admin/account"
                  >
                    <i className="bi bi-person"></i>

                    My Account
                  </Link>
                </li>

                <li>
                  <hr className="dropdown-divider" />
                </li>

                {/* Logout */}
                <li>
                  <LogoutButton />
                </li>
              </ul>
            </div>
          </div>
        </header>

        {/* ====================================================
            MAIN PAGE CONTENT
        ==================================================== */}

        <div className="row g-4">
          {children}
        </div>

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <footer className="footer-custom">
          <div className="footer-left">

            <span className="footer-logo">
              Revtail Admin
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

      {/* ======================================================
          BOOTSTRAP SCRIPT
      ====================================================== */}

      <Script
        src="/assets/libs/bootstrap/js/bootstrap.bundle.min.js"
        strategy="afterInteractive"
      />

      {/* ======================================================
          DASHBOARD SCRIPT
      ====================================================== */}

      <DashboardScriptLoader />
      <AdminSidebarController />
    </>
  );
}