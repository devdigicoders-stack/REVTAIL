import Link from "next/link";

import {
  redirect,
} from "next/navigation";

import prisma from "@/lib/prisma";

import {
  getCurrentUser,
} from "@/lib/current-user";

// ============================================================
// BRAND DASHBOARD
// /brand
// ============================================================

export default async function BrandDashboardPage() {
  // ==========================================================
  // 1. CURRENT USER
  // ==========================================================

  const currentUser =
    await getCurrentUser();

  if (!currentUser) {
    redirect(
      "/login"
    );
  }

  if (
    currentUser.role !==
    "BRAND"
  ) {
    if (
      currentUser.role ===
      "ADMIN"
    ) {
      redirect(
        "/admin"
      );
    }

    if (
      currentUser.role ===
      "TESTER"
    ) {
      redirect(
        "/tester"
      );
    }

    redirect(
      "/login"
    );
  }

  // ==========================================================
  // 2. BRAND PROFILE
  // ==========================================================

  const brandProfile =
    await prisma.brandProfile.findUnique({
      where: {
        userId:
          currentUser.userId,
      },

      select: {
        id: true,

        companyName:
          true,

        companyType:
          true,

        categoryId:
          true,

        category: {
          select: {
            id: true,

            name:
              true,
          },
        },

        pocFullName:
          true,

        pocMobile:
          true,

        designation:
          true,

        website:
          true,
      },
    });

  if (!brandProfile) {
    redirect(
      "/login"
    );
  }

  // ==========================================================
  // 3. PROFILE COMPLETION
  //
  // These are the important Brand profile fields.
  // ==========================================================

  const requiredFields = [
    brandProfile.companyName,

    brandProfile.companyType,

    brandProfile.categoryId,

    brandProfile.pocFullName,

    brandProfile.pocMobile,

    brandProfile.designation,
  ];

  const completedFields =
    requiredFields.filter(
      (
        field
      ) => {
        if (
          field ===
            null ||
          field ===
            undefined
        ) {
          return false;
        }

        if (
          typeof field ===
            "string" &&
          field.trim() ===
            ""
        ) {
          return false;
        }

        return true;
      }
    ).length;

  const totalRequiredFields =
    requiredFields.length;

  const profileCompletionPercentage =
    totalRequiredFields >
    0
      ? Math.round(
          (completedFields /
            totalRequiredFields) *
            100
        )
      : 0;

  const isProfileComplete =
    completedFields ===
    totalRequiredFields;

  // ==========================================================
  // 4. DASHBOARD COUNTS
  //
  // All counts are restricted to this Brand.
  // Pending Approval = submitted Task 3 items waiting for
  // Brand approval.
  // ==========================================================

  const [
    totalCampaigns,
    liveCampaigns,
    pendingApprovals,
  ] =
    await Promise.all([
      // --------------------------------------------------------
      // TOTAL CAMPAIGNS
      // --------------------------------------------------------

      prisma.campaign.count({
        where: {
          brandId:
            brandProfile.id,
        },
      }),

      // --------------------------------------------------------
      // LIVE CAMPAIGNS
      // --------------------------------------------------------

      prisma.campaign.count({
        where: {
          brandId:
            brandProfile.id,

          status:
            "LIVE",
        },
      }),

      // --------------------------------------------------------
      // PENDING TASK 3 APPROVALS
      // --------------------------------------------------------

      prisma.testerCampaignTask.count({
        where: {
          taskNumber:
            3,

          status:
            "SUBMITTED",

          testerCampaign: {
            campaign: {
              brandId:
                brandProfile.id,
            },
          },
        },
      }),
    ]);

  // ==========================================================
  // 5. DASHBOARD
  // ==========================================================

  return (
    <>
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="col-12">

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">

          <div>

            <h3 className="fw-bold mb-1">

              Brand Dashboard

            </h3>

            <p className="text-muted mb-0">

              Welcome back,{" "}

              <strong>
                {
                  brandProfile.companyName
                }
              </strong>

              . Manage your campaigns and account from here.

            </p>

          </div>

          <Link
            href="/brand/campaigns/create"
            className="btn btn-primary"
          >

            <i className="bi bi-plus-circle me-2" />

            Create Campaign

          </Link>

        </div>

      </div>

      {/* ======================================================
          COMPLETE PROFILE

          IMPORTANT:
          This panel is now inside /brand/page.tsx.
          Therefore it is shown ONLY on /brand.
      ====================================================== */}

      {!isProfileComplete && (

        <div className="col-12">

          <div className="alert alert-warning border-0 shadow-sm mb-0">

            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">

              {/* LEFT */}

              <div className="d-flex align-items-start gap-3 flex-grow-1">

                <div className="fs-3 text-warning-emphasis">

                  <i className="bi bi-person-circle" />

                </div>

                <div className="flex-grow-1">

                  <h6 className="fw-bold mb-1">

                    Complete your brand profile

                  </h6>

                  <p className="mb-2 small">

                    Please complete your company and
                    contact information to get the best
                    experience on Revtail.

                  </p>

                  {/* PROGRESS */}

                  <div
                    className="progress"
                    style={{
                      height:
                        "6px",

                      maxWidth:
                        "400px",
                    }}
                  >

                    <div
                      className="progress-bar bg-warning"
                      role="progressbar"
                      style={{
                        width:
                          `${profileCompletionPercentage}%`,
                      }}
                      aria-valuenow={
                        profileCompletionPercentage
                      }
                      aria-valuemin={
                        0
                      }
                      aria-valuemax={
                        100
                      }
                    />

                  </div>

                  <div className="small text-muted mt-1">

                    {
                      profileCompletionPercentage
                    }
                    % profile completed

                  </div>

                </div>

              </div>

              {/* RIGHT */}

              <div>

                <Link
                  href="/brand/account"
                  className="btn btn-warning fw-semibold px-4 text-nowrap"
                >

                  <i className="bi bi-person-gear me-2" />

                  Complete Profile

                </Link>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* ======================================================
          CAMPAIGN STATISTICS
      ====================================================== */}

      <div className="col-12">

        <div className="row g-4">

          {/* ==================================================
              TOTAL CAMPAIGNS
          ================================================== */}

          <div className="col-md-4">

            <Link
              href="/brand/campaigns"
              className="text-decoration-none"
            >

              <div className="card border-0 shadow-sm h-100">

                <div className="card-body">

                  <div className="d-flex justify-content-between align-items-start">

                    <div>

                      <div className="text-muted small mb-2">

                        Total Campaigns

                      </div>

                      <div className="display-6 fw-bold text-dark">

                        {
                          totalCampaigns
                        }

                      </div>

                      <div className="small text-muted mt-2">

                        All campaigns created by your Brand

                      </div>

                    </div>

                    <div
                      className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center"
                      style={{
                        width:
                          52,

                        height:
                          52,
                      }}
                    >

                      <i className="bi bi-megaphone fs-4" />

                    </div>

                  </div>

                </div>

                <div className="card-footer bg-transparent border-0 pt-0">

                  <span className="text-primary small fw-semibold">

                    View Campaigns

                    <i className="bi bi-arrow-right ms-2" />

                  </span>

                </div>

              </div>

            </Link>

          </div>

          {/* ==================================================
              LIVE CAMPAIGNS
          ================================================== */}

          <div className="col-md-4">

            <Link
              href="/brand/campaigns/list"
              className="text-decoration-none"
            >

              <div className="card border-0 shadow-sm h-100">

                <div className="card-body">

                  <div className="d-flex justify-content-between align-items-start">

                    <div>

                      <div className="text-muted small mb-2">

                        Live Campaigns

                      </div>

                      <div className="display-6 fw-bold text-success">

                        {
                          liveCampaigns
                        }

                      </div>

                      <div className="small text-muted mt-2">

                        Campaigns currently available to testers

                      </div>

                    </div>

                    <div
                      className="rounded-circle bg-success-subtle text-success d-flex align-items-center justify-content-center"
                      style={{
                        width:
                          52,

                        height:
                          52,
                      }}
                    >

                      <i className="bi bi-broadcast fs-4" />

                    </div>

                  </div>

                </div>

                <div className="card-footer bg-transparent border-0 pt-0">

                  <span className="text-success small fw-semibold">

                    View Live Campaigns

                    <i className="bi bi-arrow-right ms-2" />

                  </span>

                </div>

              </div>

            </Link>

          </div>

          {/* ==================================================
              PENDING TASK 3 APPROVALS
          ================================================== */}

          <div className="col-md-4">

            <Link
              href="/brand/approvals"
              className="text-decoration-none"
            >

              <div className="card border-0 shadow-sm h-100">

                <div className="card-body">

                  <div className="d-flex justify-content-between align-items-start">

                    <div>

                      <div className="text-muted small mb-2">

                        Pending Approval

                      </div>

                      <div className="display-6 fw-bold text-warning">

                        {
                          pendingApprovals
                        }

                      </div>

                      <div className="small text-muted mt-2">

                        Task 3 submissions waiting for your approval

                      </div>

                    </div>

                    <div
                      className="rounded-circle bg-warning-subtle text-warning d-flex align-items-center justify-content-center"
                      style={{
                        width:
                          52,

                        height:
                          52,
                      }}
                    >

                      <i className="bi bi-hourglass-split fs-4" />

                    </div>

                  </div>

                </div>

                <div className="card-footer bg-transparent border-0 pt-0">

                  <span className="text-warning-emphasis small fw-semibold">

                    Review Pending Approvals

                    <i className="bi bi-arrow-right ms-2" />

                  </span>

                </div>

              </div>

            </Link>

          </div>

        </div>

      </div>

      {/* ======================================================
          QUICK ACTIONS
      ====================================================== */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body">

            <h5 className="fw-bold mb-4">

              Quick Actions

            </h5>

            <div className="row g-3">

              {/* CREATE */}

              <div className="col-md-4">

                <Link
                  href="/brand/campaigns/create"
                  className="btn btn-outline-primary w-100 py-3"
                >

                  <i className="bi bi-plus-circle fs-4 d-block mb-2" />

                  Create Campaign

                </Link>

              </div>

              {/* CAMPAIGNS */}

              <div className="col-md-4">

                <Link
                  href="/brand/campaigns/list"
                  className="btn btn-outline-primary w-100 py-3"
                >

                  <i className="bi bi-megaphone fs-4 d-block mb-2" />

                  My Campaigns

                </Link>

              </div>

              {/* ACCOUNT */}

              <div className="col-md-4">

                <Link
                  href="/brand/account"
                  className="btn btn-outline-primary w-100 py-3"
                >

                  <i className="bi bi-person-gear fs-4 d-block mb-2" />

                  My Account

                </Link>

              </div>

            </div>

          </div>

        </div>

      </div>
    </>
  );
}