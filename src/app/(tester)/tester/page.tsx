import Link from "next/link";
import { redirect } from "next/navigation";
import { Prisma, TargetGender } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import TesterInvitationWidget from "@/components/tester/TesterInvitationWidget";


type TesterDashboardPageProps = {
  searchParams?: Promise<{
    mobilePage?: string | string[];
  }>;
};

const MOBILE_CAMPAIGNS_PER_PAGE = 50;

export default async function TesterDashboardPage({
  searchParams,
}: TesterDashboardPageProps) {
  const params = await searchParams;
  const rawMobilePage = Array.isArray(params?.mobilePage)
    ? params.mobilePage[0]
    : params?.mobilePage;
  const requestedMobilePage = Number(rawMobilePage ?? "1");
  const mobilePage =
    Number.isSafeInteger(requestedMobilePage) && requestedMobilePage > 0
      ? Math.min(requestedMobilePage, 10000)
      : 1;

  // ============================================================
  // 1. GET CURRENT USER
  // ============================================================

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "TESTER") {
    redirect("/");
  }

  // ============================================================
  // 2. GET TESTER PROFILE
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
        state: true,
        city: true,
        approvalStatus: true,

        profileImage: true,
        instagramId: true,

        interests: {
          select: {
            interestId: true,
          },
        },

        bankDetails: {
          select: {
            id: true,
          },
        },

        user: {
          select: {
            email: true,
          },
        },
      },
    });

  if (!testerProfile) {
    redirect("/login");
  }

  // ============================================================
  // 3. PROFILE COMPLETION
  // ============================================================

  /*
   * Signup already contains:
   *
   * fullName
   * mobile
   * gender
   * ageCategory
   * pinCode
   * city
   * state
   *
   * Remaining profile fields:
   *
   * email
   * profile image
   * Instagram ID
   * interests
   * bank details
   */

  const profileChecks = [
    Boolean(
      testerProfile.user?.email?.trim()
    ),

    Boolean(
      testerProfile.profileImage?.trim()
    ),

    Boolean(
      testerProfile.instagramId?.trim()
    ),

    Boolean(
      testerProfile.interests &&
        testerProfile.interests.length >= 5
    ),

    Boolean(
      testerProfile.bankDetails
    ),
  ];

  const completedFields =
    profileChecks.filter(Boolean).length;

  const totalRequiredFields =
    profileChecks.length;

  const profileCompletionPercentage =
    totalRequiredFields > 0
      ? Math.round(
          (completedFields /
            totalRequiredFields) *
            100
        )
      : 0;

  const isProfileComplete =
    completedFields ===
    totalRequiredFields;

  const now = new Date();

  // ============================================================
  // 4. LIVE / ELIGIBLE CAMPAIGN COUNT
  // ============================================================

  const testerInterestIds = testerProfile.interests.map(
    (item) => item.interestId
  );

  const canCountLiveCampaigns =
    testerProfile.approvalStatus === "APPROVED" &&
    Boolean(testerProfile.state) &&
    Boolean(testerProfile.city) &&
    testerInterestIds.length > 0;

  // Run independent dashboard queries concurrently to reduce server wait time.
  // Keep the same eligibility rules, campaign statuses, and wallet calculation.
  // Reuse the exact same eligibility filter for the count and mobile list.
  const liveCampaignWhere: Prisma.CampaignWhereInput = {
    status: "LIVE",
    availableSlots: { gt: 0 },
    startDate: { lte: now },
    endDate: { gte: now },
    brand: {
      categoryId: { in: testerInterestIds },
    },
    AND: [
      {
        OR: [
          { targetState: "any" },
          { targetState: testerProfile.state! },
        ],
      },
      {
        OR: [
          { targetCity: "any" },
          { targetCity: testerProfile.city! },
        ],
      },
      {
        OR: [
          { targetGender: "ANY" },
          { targetGender: testerProfile.gender as TargetGender },
        ],
      },
    ],
  };

  const liveCampaignCountPromise = canCountLiveCampaigns
    ? prisma.campaign.count({ where: liveCampaignWhere })
    : Promise.resolve(0);

  // Only load the four campaigns needed for the requested mobile page.
  // The other dashboard queries continue running concurrently.
  const mobileLiveCampaignsPromise = canCountLiveCampaigns
    ? prisma.campaign.findMany({
        where: liveCampaignWhere,
        select: {
          id: true,
          productName: true,
          productImage: true,
          earningAmount: true,
          availableSlots: true,
          task4Required: true,
          brand: {
            select: { companyName: true },
          },
        },
        orderBy: [{ startDate: "desc" }, { id: "desc" }],
        skip: (mobilePage - 1) * MOBILE_CAMPAIGNS_PER_PAGE,
        take: MOBILE_CAMPAIGNS_PER_PAGE,
      })
    : Promise.resolve([]);

  // ============================================================
  // 5-9. APPLICATIONS, ONGOING, COMPLETED, WALLET, CURRENT TASKS
  // ============================================================

  const [
    liveCampaignCount,
    applicationCount,
    ongoingCampaignCount,
    completedCampaignCount,
    completedEarnings,
    ongoingCampaigns,
    mobileLiveCampaigns,
  ] = await Promise.all([
    liveCampaignCountPromise,

    prisma.campaignApplication.count({
      where: { testerProfileId: testerProfile.id },
    }),

    prisma.testerCampaign.count({
      where: {
        testerProfileId: testerProfile.id,
        status: "ONGOING",
      },
    }),

    prisma.testerCampaign.count({
      where: {
        testerProfileId: testerProfile.id,
        status: "COMPLETED",
      },
    }),

    // Same total as summing earningAmount from COMPLETED campaigns,
    // but the database returns only the sum instead of every row.
    prisma.testerCampaign.aggregate({
      where: {
        testerProfileId: testerProfile.id,
        status: "COMPLETED",
      },
      _sum: { earningAmount: true },
    }),

    prisma.testerCampaign.findMany({
      where: {
        testerProfileId: testerProfile.id,
        status: "ONGOING",
      },
      select: {
        id: true,
        currentTask: true,
        earningAmount: true,
        joinedAt: true,
        campaign: {
          select: {
            id: true,
            productName: true,
            productImage: true,
            brand: {
              select: { companyName: true },
            },
          },
        },
        tasks: {
          select: {
            id: true,
            taskNumber: true,
            status: true,
            rejectionReason: true,
          },
          orderBy: { taskNumber: "asc" },
        },
      },
      orderBy: { joinedAt: "desc" },
      take: 5,
    }),

    mobileLiveCampaignsPromise,
  ]);

  // Application statuses for the four visible mobile campaigns only.
  // Does not alter eligibility, campaign pagination or desktop data.
  const mobileCampaignApplications =
    mobileLiveCampaigns.length > 0
      ? await prisma.campaignApplication.findMany({
          where: {
            testerProfileId: testerProfile.id,
            campaignId: {
              in: mobileLiveCampaigns.map((campaign) => campaign.id),
            },
          },
          select: {
            campaignId: true,
            status: true,
          },
        })
      : [];

  const mobileApplicationStatusByCampaignId = new Map(
    mobileCampaignApplications.map((application) => [
      application.campaignId,
      application.status,
    ])
  );

  const totalMobilePages = Math.max(
    1,
    Math.ceil(liveCampaignCount / MOBILE_CAMPAIGNS_PER_PAGE)
  );

  // Prevent stale/invalid page links from displaying an empty page.
  if (mobilePage > totalMobilePages) {
    redirect(
      totalMobilePages === 1
        ? "/tester"
        : `/tester?mobilePage=${totalMobilePages}`
    );
  }

  // Preserve the existing dashboard's completed-campaign earnings meaning.
  const walletBalance = Number(completedEarnings._sum.earningAmount ?? 0);

  // ============================================================
  // 10. HELPERS
  // ============================================================

  function getTaskName(
    taskNumber: number
  ) {
    switch (taskNumber) {
      case 1:
        return "Buy Product";

      case 2:
        return "Product Received";

      case 3:
        return "Write Review & Rating";

      case 4:
        return "Copy/Paste Review";

      default:
        return `Task ${taskNumber}`;
    }
  }

  function getTaskBadgeClass(
    status: string
  ) {
    switch (status) {
      case "AVAILABLE":
        return "bg-primary";

      case "SUBMITTED":
        return "bg-warning text-dark";

      case "APPROVED":
        return "bg-success";

      case "REJECTED":
        return "bg-danger";

      case "LOCKED":
        return "bg-secondary";

      default:
        return "bg-secondary";
    }
  }

  // ============================================================
  // 11. UI
  // ============================================================

  return (
    <>
      {/* Phone-only enhancements; tablets and desktop keep their original layout. */}
      <style>{`
        @media (max-width: 575.98px) {
          .tester-wallet-card .card-body {
            padding: 1rem;
          }

          .tester-wallet-balance-amount {
            font-size: clamp(2.1rem, 9vw, 2.75rem);
            line-height: 1.15;
            letter-spacing: -0.025em;
            overflow-wrap: anywhere;
          }

          .tester-wallet-view-link {
            display: block;
            width: 100%;
            padding-top: 0.55rem;
            padding-bottom: 0.55rem;
          }
        }
      `}</style>

      {/* ======================================================
          PROFILE COMPLETION ALERT
      ====================================================== */}

      {!isProfileComplete && (
        <div className="col-12">
          <div
            id="tester-profile-completion-alert"
            className="card border-0 shadow-sm"
            style={{
              borderRadius: "16px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 12px rgba(15, 23, 42, 0.05)",
            }}
          >
            <div className="card-body p-3 p-sm-4">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                {/* Left */}
                <div className="d-flex align-items-start gap-3 flex-grow-1">
                  <div
                    className="flex-shrink-0 d-flex align-items-center justify-content-center text-white"
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #012977 0%, #1e40af 100%)",
                      boxShadow: "0 4px 10px rgba(1, 41, 119, 0.2)",
                    }}
                  >
                    <i className="bi bi-person-check fs-4"></i>
                  </div>

                  <div className="flex-grow-1">
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                      <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: "16px" }}>
                        Complete your tester profile
                      </h5>
                      <span
                        className="badge rounded-pill fw-semibold px-2 py-0.5"
                        style={{
                          backgroundColor: "#FEF3C7",
                          color: "#92400E",
                          fontSize: "11px",
                        }}
                      >
                        Action Required
                      </span>
                    </div>

                    <p className="text-muted mb-2 small" style={{ lineHeight: "1.5" }}>
                      Add your email, profile image, Instagram ID, interests and bank
                      details to complete your Revtail profile.
                    </p>

                    {/* Progress */}
                    <div className="d-flex align-items-center gap-2" style={{ maxWidth: "380px" }}>
                      <div
                        className="progress flex-grow-1"
                        style={{
                          height: "7px",
                          backgroundColor: "#e2e8f0",
                          borderRadius: "999px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          className="progress-bar"
                          role="progressbar"
                          style={{
                            width: `${profileCompletionPercentage}%`,
                            background: "linear-gradient(90deg, #012977 0%, #2563eb 100%)",
                            borderRadius: "999px",
                            transition: "width 0.4s ease",
                          }}
                          aria-valuenow={profileCompletionPercentage}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                      <span className="fw-semibold text-dark fs-12 text-nowrap">
                        {profileCompletionPercentage}% completed
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right */}
                <div className="w-100 w-md-auto flex-shrink-0 pt-1 pt-md-0">
                  <Link
                    href="/tester/profile"
                    className="btn d-flex align-items-center justify-content-center gap-2 fw-semibold px-4 py-2 text-nowrap w-100 w-md-auto"
                    style={{
                      backgroundColor: "#012977",
                      color: "#ffffff",
                      borderRadius: "10px",
                      fontSize: "14px",
                      boxShadow: "0 4px 12px rgba(1, 41, 119, 0.2)",
                    }}
                  >
                    <span>Complete Profile</span>
                    <i className="bi bi-arrow-right fs-6"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="col-12">

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">

          <div>
            <h3 className="fw-bold mb-1">
              Home
            </h3>

            <p className="text-muted mb-0 d-none d-sm-block">
              Welcome back,{" "}
              {testerProfile.fullName}.
              Manage campaigns and track your
              current tasks.
            </p>
          </div>

          <div className="d-none d-sm-block">
            <Link
              href="/tester/campaigns/live"
              className="btn btn-primary"
            >
              <i className="bi bi-search me-2"></i>
              Find Campaigns
            </Link>
          </div>

        </div>

      </div>

      {/* ======================================================
          CAMPAIGN INVITATIONS
      ====================================================== */}

      <div className="col-12 d-none d-sm-block">
        <TesterInvitationWidget />
      </div>

      {/* ======================================================
          SUMMARY CARDS
      ====================================================== */}

      <div className="col-xl-3 col-md-6 d-none d-sm-block">
     

        <Link
          href="/tester/campaigns/live"
          className="text-decoration-none"
        >
          <div className="card border-0 shadow-sm h-100">

            <div className="card-body">

              <div className="d-flex align-items-center justify-content-between">

                <div>
                  <div className="text-muted small mb-1">
                    Live Campaigns
                  </div>

                  <h3 className="fw-bold mb-0 text-dark">
                    {liveCampaignCount}
                  </h3>
                </div>

                <div className="fs-2 text-primary">
                  <i className="bi bi-megaphone"></i>
                </div>

              </div>

              <div className="small text-muted mt-3">
                Campaigns matching your profile
              </div>

            </div>

          </div>
        </Link>

      </div>

      {/* Applications */}

      <div className="col-xl-3 col-md-6 d-none d-sm-block">

        <Link
          href="/tester/campaigns/applications"
          className="text-decoration-none"
        >
          <div className="card border-0 shadow-sm h-100">

            <div className="card-body">

              <div className="d-flex align-items-center justify-content-between">

                <div>
                  <div className="text-muted small mb-1">
                    My Active Campaigns
                  </div>

                  <h3 className="fw-bold mb-0 text-dark">
                    {applicationCount}
                  </h3>
                </div>

                <div className="fs-2 text-info">
                  <i className="bi bi-send-check"></i>
                </div>

              </div>

              <div className="small text-muted mt-3">
                Campaign requests submitted
              </div>

            </div>

          </div>
        </Link>

      </div>

      {/* Ongoing */}

      <div className="col-xl-3 col-md-6 d-none d-sm-block">

        <Link
          href="/tester/campaigns/ongoing"
          className="text-decoration-none"
        >
          <div className="card border-0 shadow-sm h-100">

            <div className="card-body">

              <div className="d-flex align-items-center justify-content-between">

                <div>
                  <div className="text-muted small mb-1">
                    Ongoing Tasks
                  </div>

                  <h3 className="fw-bold mb-0 text-dark">
                    {ongoingCampaignCount}
                  </h3>
                </div>

                <div className="fs-2 text-warning">
                  <i className="bi bi-hourglass-split"></i>
                </div>

              </div>

              <div className="small text-muted mt-3">
                Tasks currently in progress
              </div>

            </div>

          </div>
        </Link>

      </div>

      {/* Completed */}

      <div className="col-xl-3 col-md-6 d-none d-sm-block">

        <Link
          href="/tester/campaigns/history"
          className="text-decoration-none"
        >
          <div className="card border-0 shadow-sm h-100">

            <div className="card-body">

              <div className="d-flex align-items-center justify-content-between">

                <div>
                  <div className="text-muted small mb-1">
                    Completed Campaigns
                  </div>

                  <h3 className="fw-bold mb-0 text-dark">
                    {completedCampaignCount}
                  </h3>
                </div>

                <div className="fs-2 text-success">
                  <i className="bi bi-check-circle"></i>
                </div>

              </div>

              <div className="small text-muted mt-3">
                Successfully completed campaigns
              </div>

            </div>

          </div>
        </Link>

      </div>

      {/* ======================================================
          WALLET
      ====================================================== */}

      <div className="col-12 col-lg-4">

        <div className="card border-0 shadow-sm h-100 tester-wallet-card">

          <div className="card-body">

            <div className="d-flex justify-content-between align-items-start mb-2 mb-sm-4">

              <div>
                <div className="text-muted small">
                  Wallet Balance
                </div>

                <h2 className="fw-bold mb-0 mt-1 tester-wallet-balance-amount">
                  ₹
                  {walletBalance.toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </h2>
              </div>

              <div className="fs-2 text-success">
                <i className="bi bi-wallet2"></i>
              </div>

            </div>

            <p className="text-muted small d-none d-sm-block">
              Current amount earned from completed
              campaigns.
            </p>

            <Link
              href="/tester/wallet"
              className="btn btn-outline-primary btn-sm tester-wallet-view-link"
            >
              View Wallet
            </Link>

          </div>

        </div>

      </div>

      {/* ======================================================
          MOBILE LIVE CAMPAIGNS (PHONES ONLY)
          Pagination is server-side: 4 campaigns per page.
          Tablets and desktop keep the existing dashboard.
      ====================================================== */}

      <section
        className="col-12 d-block d-sm-none"
        aria-labelledby="mobile-live-campaigns-title"
      >
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="d-flex align-items-center justify-content-between gap-2 p-3 mb-0">
              <div>
                <h5
                  id="mobile-live-campaigns-title"
                  className="fw-bold mb-1"
                >
                  Live Campaigns
                </h5>
                <div className="text-muted small">
                  {liveCampaignCount} matching your profile
                </div>
              </div>

              <Link
                href="/tester/campaigns/live"
                className="btn btn-sm btn-outline-primary text-nowrap"
              >
                View All
              </Link>
            </div>

            {mobileLiveCampaigns.length === 0 ? (
              <div className="text-center py-4">
                <div className="fs-2 text-muted mb-2">
                  <i className="bi bi-megaphone"></i>
                </div>
                <p className="text-muted small mb-0">
                  No eligible live campaigns available right now.
                </p>
              </div>
            ) : (
              <div
                className="tester-mobile-campaign-list px-2 pb-2"
                style={{ width: "100%", maxWidth: "none" }}
              >
                {mobileLiveCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="tester-mobile-campaign-card"
                    style={{ width: "100%", maxWidth: "none", marginInline: 0, boxSizing: "border-box" }}
                  >
                    {/* TOP — same presentation as the Live Campaigns mobile page */}
                    <div className="tester-mobile-campaign-top">
                      <div className="tester-mobile-product-image">
                        {campaign.productImage ? (
                          <img
                            src={campaign.productImage}
                            alt={campaign.productName}
                          />
                        ) : (
                          <div className="tester-campaign-image-placeholder">
                            <i className="bi bi-image"></i>
                          </div>
                        )}
                      </div>

                      <div className="tester-mobile-product-info">
                        <div className="tester-campaign-brand">
                          {campaign.brand?.companyName ?? "Brand"}
                        </div>
                        <h6>{campaign.productName}</h6>
                        <div className="tester-mobile-task-count">
                          <i className="bi bi-list-check"></i>
                          {campaign.task4Required ? "4 Tasks" : "3 Tasks"}
                        </div>
                      </div>
                    </div>

                    {/* STATS */}
                    <div className="tester-mobile-campaign-stats">
                      <div className="tester-mobile-stat">
                        <span>Earning</span>
                        <strong>
                          ₹{Number(campaign.earningAmount).toLocaleString("en-IN")}
                        </strong>
                      </div>
                      <div className="tester-mobile-stat">
                        <span>Slots Left</span>
                        <strong>{campaign.availableSlots}</strong>
                      </div>
                    </div>

                    {/* ACTION — match live campaign page, including application status */}
                    <div className="tester-mobile-campaign-action">
                      {mobileApplicationStatusByCampaignId.has(campaign.id) ? (
                        <>
                          <Link
                            href={`/tester/campaigns/live/${campaign.id}`}
                            className="btn btn-outline-primary flex-grow-1"
                          >
                            View Campaign
                          </Link>

                          <span
                            className={`tester-application-status ${getMobileApplicationClass(
                              mobileApplicationStatusByCampaignId.get(campaign.id) ?? null
                            )}`}
                          >
                            {mobileApplicationStatusByCampaignId.get(campaign.id)}
                          </span>
                        </>
                      ) : (
                        <Link
                          href={`/tester/campaigns/live/${campaign.id}`}
                          className="btn btn-primary w-100"
                        >
                          View More Details
                          <i className="bi bi-arrow-right ms-2"></i>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {liveCampaignCount > MOBILE_CAMPAIGNS_PER_PAGE && (
              <nav
                className="d-flex justify-content-between align-items-center gap-2 mt-3 p-3 border-top"
                aria-label="Mobile live campaign pagination"
              >
                {mobilePage > 1 ? (
                  <Link
                    href={
                      mobilePage - 1 === 1
                        ? "/tester"
                        : `/tester?mobilePage=${mobilePage - 1}`
                    }
                    scroll={false}
                    className="btn btn-outline-primary btn-sm"
                  >
                    <i className="bi bi-chevron-left me-1"></i>
                    Prev
                  </Link>
                ) : (
                  <span
                    className="btn btn-outline-secondary btn-sm disabled"
                    aria-disabled="true"
                  >
                    <i className="bi bi-chevron-left me-1"></i>
                    Prev
                  </span>
                )}

                <span className="small text-muted text-nowrap">
                  {mobilePage} / {totalMobilePages}
                </span>

                {mobilePage < totalMobilePages ? (
                  <Link
                    href={`/tester?mobilePage=${mobilePage + 1}`}
                    scroll={false}
                    className="btn btn-outline-primary btn-sm"
                  >
                    Next
                    <i className="bi bi-chevron-right ms-1"></i>
                  </Link>
                ) : (
                  <span
                    className="btn btn-outline-secondary btn-sm disabled"
                    aria-disabled="true"
                  >
                    Next
                    <i className="bi bi-chevron-right ms-1"></i>
                  </span>
                )}
              </nav>
            )}
          </div>
        </div>
      </section>

      {/* ======================================================
          CURRENT TASK SUMMARY
      ====================================================== */}

      <div className="col-lg-8 d-none d-sm-block">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-header bg-white border-0 pt-4 px-4">

           <div className="d-flex justify-content-between align-items-center w-100 gap-2">

  <div className="flex-grow-1">
    <h5 className="fw-bold mb-1">
      Current Tasks
    </h5>

    <p className="text-muted small mb-0">
      Tasks from your ongoing campaigns
    </p>
  </div>

  <Link
    href="/tester/campaigns/ongoing"
    className="btn btn-sm btn-outline-primary ms-auto flex-shrink-0"
  >
    View All
  </Link>

</div>

          </div>

          <div className="card-body px-4">

            {ongoingCampaigns.length === 0 ? (

              <div className="text-center py-5">

                <div className="fs-1 text-muted mb-3">
                  <i className="bi bi-clipboard-check"></i>
                </div>

                <h6 className="fw-semibold">
                  No ongoing campaigns
                </h6>

                <p className="text-muted small">
                  Apply to available campaigns to get
                  started.
                </p>

                <Link
                  href="/tester/campaigns/live"
                  className="btn btn-primary btn-sm"
                >
                  Browse Campaigns
                </Link>

              </div>

            ) : (

              <div className="table-responsive">

                <table className="table align-middle mb-0">

                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th>Brand</th>
                      <th>Current Task</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>

                    {ongoingCampaigns.map(
                      (testerCampaign) => {

                        const currentTask =
                          testerCampaign.tasks.find(
                            (task) =>
                              task.taskNumber ===
                              testerCampaign.currentTask
                          );

                        return (
                          <tr
                            key={
                              testerCampaign.id
                            }
                          >

                            {/* Campaign */}

                            <td>
                              <div className="fw-semibold">
                                {
                                  testerCampaign
                                    .campaign
                                    .productName
                                }
                              </div>
                            </td>

                            {/* Brand */}

                            <td>
                              {
                                testerCampaign
                                  .campaign
                                  .brand
                                  ?.companyName ??
                                "-"
                              }
                            </td>

                            {/* Task */}

                            <td>

                              <div className="fw-semibold">
                                Task{" "}
                                {
                                  testerCampaign.currentTask
                                }
                              </div>

                              <div className="small text-muted">
                                {getTaskName(
                                  testerCampaign.currentTask
                                )}
                              </div>

                            </td>

                            {/* Status */}

                            <td>

                              {currentTask ? (
                                <>
                                  <span
                                    className={`badge ${getTaskBadgeClass(
                                      currentTask.status
                                    )}`}
                                  >
                                    {
                                      currentTask.status
                                    }
                                  </span>

                                  {currentTask.status ===
                                    "REJECTED" &&
                                    currentTask.rejectionReason && (
                                      <div className="small text-danger mt-1">
                                        {
                                          currentTask.rejectionReason
                                        }
                                      </div>
                                    )}
                                </>
                              ) : (
                                <span className="badge bg-secondary">
                                  Unknown
                                </span>
                              )}

                            </td>

                            {/* Action */}

                            <td className="text-end">

                              <Link
                                href={`/tester/campaigns/ongoing/${testerCampaign.id}`}
                                className="btn btn-sm btn-outline-primary"
                              >
                                Open
                              </Link>

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </div>

      </div>
    </>
  );
}

// Mobile application badge classes match /tester/campaigns/live.
function getMobileApplicationClass(status: string | null) {
  switch (status) {
    case "PENDING":
      return "pending";
    case "APPROVED":
      return "approved";
    case "REJECTED":
      return "rejected";
    case "CANCELLED":
      return "cancelled";
    default:
      return "";
  }
}
