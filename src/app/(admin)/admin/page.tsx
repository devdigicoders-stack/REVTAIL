import Link from "next/link";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // ============================================================
  // 1. AUTHENTICATION
  // ============================================================

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "ADMIN") {
    redirect("/login");
  }

  // ============================================================
  // 2. LOAD ADMIN PROFILE
  // ============================================================

  const adminProfile =
    await prisma.adminProfile.findUnique({
      where: {
        userId: currentUser.userId,
      },

      select: {
        fullName: true,
        designation: true,
      },
    });

  const adminName =
    adminProfile?.fullName || "Administrator";

  // ============================================================
  // 3. DASHBOARD COUNTS
  //
  // Promise.all is used so database queries execute in parallel.
  // This is better than awaiting every query one by one.
  // ============================================================

  const [
    pendingCampaignCount,
    liveCampaignCount,
    totalBrandCount,
    totalTesterCount,
    pendingApplicationCount,
    pendingTaskCount,
    pendingPaymentCount,
  ] = await Promise.all([
    // ----------------------------------------------------------
    // Campaigns waiting for Admin approval
    // ----------------------------------------------------------

    prisma.campaign.count({
      where: {
        status: "SUBMITTED",
      },
    }),

    // ----------------------------------------------------------
    // Currently LIVE campaigns
    // ----------------------------------------------------------

    prisma.campaign.count({
      where: {
        status: "LIVE",
      },
    }),

    // ----------------------------------------------------------
    // Total Brands
    // ----------------------------------------------------------

    prisma.user.count({
      where: {
        role: "BRAND",
        deletedAt: null,
      },
    }),

    // ----------------------------------------------------------
    // Total Testers
    // ----------------------------------------------------------

    prisma.user.count({
      where: {
        role: "TESTER",
        deletedAt: null,
      },
    }),

    // ----------------------------------------------------------
    // Tester applications waiting for approval
    // ----------------------------------------------------------

    prisma.campaignApplication.count({
      where: {
        status: "PENDING",
      },
    }),

    // ----------------------------------------------------------
    // Tester tasks submitted and waiting for review
    // ----------------------------------------------------------

    prisma.testerCampaignTask.count({
      where: {
        status: "SUBMITTED",
      },
    }),

    // ----------------------------------------------------------
    // Payment requests waiting for Admin approval
    // ----------------------------------------------------------
    // Promise.resolve(0),
    prisma.paymentRequest.count({
      where: {
        status: "PENDING",
      },
    }),
  ]);

  // ============================================================
  // 4. RECENT CAMPAIGNS WAITING FOR APPROVAL
  // ============================================================

  const recentPendingCampaigns =
    await prisma.campaign.findMany({
      where: {
        status: "SUBMITTED",
      },

      select: {
        id: true,
        campaignCode: true,
        productName: true,
        earningAmount: true,
        totalSlots: true,
        submittedAt: true,

        brand: {
          select: {
            companyName: true,
          },
        },
      },

      orderBy: {
        submittedAt: "desc",
      },

      take: 5,
    });

  // ============================================================
  // 5. RECENT TESTER APPLICATIONS
  // ============================================================

  const recentApplications =
    await prisma.campaignApplication.findMany({
      where: {
        status: "PENDING",
      },

      select: {
        id: true,
        appliedAt: true,

        campaign: {
          select: {
            id: true,
            campaignCode: true,
            productName: true,
          },
        },

        testerProfile: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },

      orderBy: {
        appliedAt: "desc",
      },

      take: 5,
    });

  // ============================================================
  // 6. RETURN DASHBOARD
  // ============================================================

  return (
    <>
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="col-12">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-2">
          <div>
            <h4 className="fw-bold mb-1">
              Admin Dashboard
            </h4>

            <p className="text-muted mb-0">
              Welcome back, {adminName}. Here&apos;s what is
              happening on Revtail.
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================
          SUMMARY CARDS
      ====================================================== */}

      {/* Pending Campaigns */}
      <div className="col-xl-3 col-md-6">
        <Link
          href="/admin/approvals/campaigns"
          className="text-decoration-none"
        >
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">

                <div>
                  <p className="text-muted mb-1 small">
                    Pending Campaigns
                  </p>

                  <h3 className="fw-bold mb-0 text-dark">
                    {pendingCampaignCount}
                  </h3>
                </div>

                <div
                  className="bg-warning-subtle text-warning rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "50px",
                    height: "50px",
                  }}
                >
                  <i className="bi bi-megaphone fs-4"></i>
                </div>

              </div>

              <div className="mt-3">
                <span className="small text-primary">
                  Review campaigns
                  <i className="bi bi-arrow-right ms-1"></i>
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Pending Tester Applications */}
      <div className="col-xl-3 col-md-6">
        <Link
          href="/admin/approvals/applications"
          className="text-decoration-none"
        >
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">

                <div>
                  <p className="text-muted mb-1 small">
                    Testers Apply for campaigns
                  </p>

                  <h3 className="fw-bold mb-0 text-dark">
                    {pendingApplicationCount}
                  </h3>
                </div>

                <div
                  className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "50px",
                    height: "50px",
                  }}
                >
                  <i className="bi bi-person-plus fs-4"></i>
                </div>

              </div>

              <div className="mt-3">
                <span className="small text-primary">
                  Review applications
                  <i className="bi bi-arrow-right ms-1"></i>
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Pending Tasks */}
      <div className="col-xl-3 col-md-6">
        <Link
          href="/admin/approvals/tasks"
          className="text-decoration-none"
        >
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">

                <div>
                  <p className="text-muted mb-1 small">
                    Pending Tasks
                  </p>

                  <h3 className="fw-bold mb-0 text-dark">
                    {pendingTaskCount}
                  </h3>
                </div>

                <div
                  className="bg-info-subtle text-info rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "50px",
                    height: "50px",
                  }}
                >
                  <i className="bi bi-list-check fs-4"></i>
                </div>

              </div>

              <div className="mt-3">
                <span className="small text-primary">
                  Review tasks
                  <i className="bi bi-arrow-right ms-1"></i>
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Pending Payments */}
      <div className="col-xl-3 col-md-6">
        <Link
          href="/admin/approvals/payments"
          className="text-decoration-none"
        >
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">

                <div>
                  <p className="text-muted mb-1 small">
                    Pending Payments
                  </p>

                  <h3 className="fw-bold mb-0 text-dark">
                    {pendingPaymentCount}
                  </h3>
                </div>

                <div
                  className="bg-danger-subtle text-danger rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "50px",
                    height: "50px",
                  }}
                >
                  <i className="bi bi-cash-stack fs-4"></i>
                </div>

              </div>

              <div className="mt-3">
                <span className="small text-primary">
                  Review payments
                  <i className="bi bi-arrow-right ms-1"></i>
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* ======================================================
          SECOND ROW
      ====================================================== */}

      {/* Live Campaigns */}
      <div className="col-xl-4 col-md-6">
        <Link
          href="/admin/campaigns"
          className="text-decoration-none"
        >
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">

              <div className="d-flex justify-content-between align-items-center">

                <div>
                  <p className="text-muted mb-1">
                    Live Campaigns
                  </p>

                  <h2 className="fw-bold mb-0 text-dark">
                    {liveCampaignCount}
                  </h2>
                </div>

                <div
                  className="bg-success-subtle text-success rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "55px",
                    height: "55px",
                  }}
                >
                  <i className="bi bi-broadcast fs-4"></i>
                </div>

              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Total Brands */}
      <div className="col-xl-4 col-md-6">
        <Link
          href="/admin/brands"
          className="text-decoration-none"
        >
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">

              <div className="d-flex justify-content-between align-items-center">

                <div>
                  <p className="text-muted mb-1">
                    Total Brands
                  </p>

                  <h2 className="fw-bold mb-0 text-dark">
                    {totalBrandCount}
                  </h2>
                </div>

                <div
                  className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "55px",
                    height: "55px",
                  }}
                >
                  <i className="bi bi-buildings fs-4"></i>
                </div>

              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Total Testers */}
      <div className="col-xl-4 col-md-6">
        <Link
          href="/admin/testers"
          className="text-decoration-none"
        >
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">

              <div className="d-flex justify-content-between align-items-center">

                <div>
                  <p className="text-muted mb-1">
                    Total Testers
                  </p>

                  <h2 className="fw-bold mb-0 text-dark">
                    {totalTesterCount}
                  </h2>
                </div>

                <div
                  className="bg-info-subtle text-info rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "55px",
                    height: "55px",
                  }}
                >
                  <i className="bi bi-people-fill fs-4"></i>
                </div>

              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* ======================================================
          RECENT PENDING CAMPAIGNS
      ====================================================== */}

      <div className="col-xl-8">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-header bg-white border-0 pt-4 px-4">
            <div className="d-flex justify-content-between align-items-center w-100 gap-3">

              <div className="me-2">
                <h5 className="fw-bold mb-1">
                  Campaigns Awaiting Approval
                </h5>

                <p className="text-muted small mb-0">
                  Latest campaigns submitted by brands.
                </p>
              </div>

              <Link
                href="/admin/approvals/campaigns"
                className="btn btn-sm btn-outline-primary flex-shrink-0"
              >
                View All
              </Link>

            </div>
          </div>

          <div className="card-body px-4">

            {recentPendingCampaigns.length === 0 ? (

              <div className="text-center py-5">
                <i className="bi bi-check-circle fs-1 text-success"></i>

                <h6 className="mt-3">
                  No pending campaigns
                </h6>

                <p className="text-muted small mb-0">
                  All campaign submissions have been reviewed.
                </p>
              </div>

            ) : (

              <div className="table-responsive">

                <table className="table align-middle">

                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th>Brand</th>
                      <th>Earning</th>
                      <th>Slots</th>
                      <th>Submitted</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>

                    {recentPendingCampaigns.map(
                      (campaign) => (

                        <tr key={campaign.id}>

                          <td>
                            <div className="fw-semibold">
                              {campaign.productName}
                            </div>

                            <small className="text-muted">
                              {campaign.campaignCode}
                            </small>
                          </td>

                          <td>
                            {campaign.brand.companyName}
                          </td>

                          <td>
                            ₹
                            {Number(
                              campaign.earningAmount
                            ).toLocaleString("en-IN")}
                          </td>

                          <td>
                            {campaign.totalSlots}
                          </td>

                          <td>
                            {campaign.submittedAt
                              ? campaign.submittedAt.toLocaleDateString(
                                  "en-IN"
                                )
                              : "-"}
                          </td>

                          <td>
                            <Link
                              href={`/admin/approvals/campaigns/${campaign.id}`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              Review
                            </Link>
                          </td>

                        </tr>
                      )
                    )}

                  </tbody>
                </table>

              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================
          RECENT TESTER APPLICATIONS
      ====================================================== */}

      <div className="col-xl-4">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-header bg-white border-0 pt-4 px-4">

            <div className="d-flex justify-content-between align-items-center w-100 gap-3">

              <div className="me-2">
                <h5 className="fw-bold mb-1">
                  Tester Applications
                </h5>

                <p className="text-muted small mb-0">
                  Waiting for approval.
                </p>
              </div>

              <Link
                href="/admin/approvals/applications"
                className="btn btn-sm btn-outline-primary flex-shrink-0"
              >
                View All
              </Link>

            </div>
          </div>

          <div className="card-body px-4">

            {recentApplications.length === 0 ? (

              <div className="text-center py-5">

                <i className="bi bi-check-circle fs-1 text-success"></i>

                <h6 className="mt-3">
                  No pending applications
                </h6>

                <p className="text-muted small">
                  All tester applications are reviewed.
                </p>

              </div>

            ) : (

              <div className="list-group list-group-flush">

                {recentApplications.map(
                  (application) => (

                    <div
                      key={application.id}
                      className="list-group-item px-0 py-3"
                    >

                      <div className="d-flex justify-content-between align-items-start">

                        <div>

                          <div className="fw-semibold">
                            {
                              application
                                .testerProfile
                                .fullName
                            }
                          </div>

                          <small className="text-muted d-block">
                            {
                              application
                                .campaign
                                .productName
                            }
                          </small>

                          <small className="text-muted">
                            {
                              application
                                .campaign
                                .campaignCode
                            }
                          </small>

                        </div>

                        <Link
                          href={`/admin/approvals/applications/${application.id}`}
                          className="btn btn-sm btn-outline-primary"
                        >
                          Review
                        </Link>

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}