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
          totalSlots: true,
          filledSlots: true,
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

  const testerFirstName = testerProfile.fullName.trim().split(" ")[0] || "Tester";

  return (
    <>
      {/* Phone-only enhancements; tablets and desktop keep their original layout. */}
      <style>{`
        nextjs-portal,
        [data-nextjs-toast],
        #next-route-announcer {
          display: none !important;
        }
        @media (max-width: 767.98px) {
          .navbar-custom {
            display: none !important;
          }
          .main-wrapper {
            margin-left: 0 !important;
            padding: 0 0 85px 0 !important;
            background-color: #f8fafc !important;
            width: 100% !important;
            overflow-x: hidden !important;
          }
          .main-wrapper > .row {
            margin: 0 !important;
            --bs-gutter-x: 0 !important;
          }
          .main-wrapper > .row > * {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
          .main-wrapper > .row > .tester-app-header-container {
            padding-left: 0 !important;
            padding-right: 0 !important;
            margin: 0 0 1rem 0 !important;
          }
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
          NATIVE MOBILE APP HEADER (Phones Only - Exact Match)
      ====================================================== */}
      <div className="col-12 d-block d-md-none tester-app-header-container">
        <div
          className="tester-app-header"
          style={{
            background: "linear-gradient(180deg, #011d54 0%, #012977 100%)",
            paddingTop: "2.75rem",
            paddingBottom: "1.75rem",
            paddingLeft: "1.25rem",
            paddingRight: "1.25rem",
            borderBottomLeftRadius: "28px",
            borderBottomRightRadius: "28px",
            boxShadow: "0 10px 30px rgba(1, 41, 119, 0.18)",
            width: "100%",
          }}
        >
          {/* Top Row: User Avatar & Search */}
          <div className="d-flex align-items-center justify-content-between mb-3">
            <button
              type="button"
              id="sidebar-toggle"
              className="tester-app-avatar-btn border-0 p-0 bg-transparent"
              aria-label="Open Menu"
            >
              {testerProfile.profileImage ? (
                <img
                  src={testerProfile.profileImage}
                  alt={testerProfile.fullName}
                  className="rounded-circle object-fit-cover"
                  style={{ width: "44px", height: "44px", border: "2px solid #ffffff" }}
                />
              ) : (
                <div className="tester-app-avatar-initial">
                  {testerFirstName.charAt(0).toUpperCase()}
                </div>
              )}
            </button>

            <Link
              href="/tester/campaigns/live"
              className="tester-app-header-search-btn text-white text-decoration-none"
              aria-label="Search Campaigns"
            >
              <i className="bi bi-search fs-5"></i>
            </Link>
          </div>

          {/* Greeting */}
          <h2 className="tester-app-greeting">
            Hello, {testerFirstName}
          </h2>

          {/* Horizontal Scrollable Filter Pills */}
          <div className="tester-app-filter-scroll">
            <span className="tester-app-filter-pill active">
              Trending
            </span>
            <Link href="/tester/campaigns/live" className="tester-app-filter-pill">
              Recently Added
            </Link>
            <Link href="/tester/campaigns/live" className="tester-app-filter-pill">
              All Categories
            </Link>
            <Link href="/tester/campaigns/live" className="tester-app-filter-pill">
              High Payout
            </Link>
            <Link
              href="/tester/campaigns/live"
              className="tester-app-filter-icon-btn ms-auto text-decoration-none"
              aria-label="Filter Options"
            >
              <i className="bi bi-sliders"></i>
            </Link>
          </div>
        </div>
      </div>

      {/* ======================================================
          PROFILE COMPLETION ALERT (Sleek Compact Banner)
      ====================================================== */}

      {!isProfileComplete && (
        <div className="col-12">
          <div
            id="tester-profile-completion-alert"
            className="card border-0 shadow-sm"
            style={{
              borderRadius: "14px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04)",
            }}
          >
            <div className="card-body p-3">
              <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2.5">
                {/* Left: Icon + Title & Short Subtitle */}
                <div className="d-flex align-items-center gap-2.5 min-w-0 flex-grow-1">
                  <div
                    className="flex-shrink-0 d-flex align-items-center justify-content-center text-white"
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #012977 0%, #1e40af 100%)",
                      boxShadow: "0 2px 8px rgba(1, 41, 119, 0.2)",
                    }}
                  >
                    <i className="bi bi-person-check fs-5"></i>
                  </div>

                  <div className="min-w-0 flex-grow-1">
                    <div className="d-flex flex-wrap align-items-center gap-2">
                      <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: "14px" }}>
                        Complete Your Profile
                      </h6>
                      <span
                        className="badge rounded-pill fw-semibold"
                        style={{
                          backgroundColor: "#FEF3C7",
                          color: "#92400E",
                          fontSize: "10.5px",
                          padding: "2px 7px",
                        }}
                      >
                        {profileCompletionPercentage}% Done
                      </span>
                    </div>
                    <p className="text-muted mb-0 small" style={{ fontSize: "12px", lineHeight: "1.3" }}>
                      Add email, bank &amp; interests to unlock all campaigns
                    </p>
                  </div>
                </div>

                {/* Right: Compact Action Button */}
                <div className="w-100 w-sm-auto flex-shrink-0 d-flex justify-content-end pt-1 pt-sm-0">
                  <Link
                    href="/tester/profile"
                    className="btn d-inline-flex align-items-center justify-content-center gap-1.5 fw-semibold px-3 py-1.5 text-nowrap w-100 w-sm-auto"
                    style={{
                      backgroundColor: "#012977",
                      color: "#ffffff",
                      borderRadius: "8px",
                      fontSize: "12.5px",
                      boxShadow: "0 2px 6px rgba(1, 41, 119, 0.18)",
                    }}
                  >
                    <span>Complete Profile</span>
                    <i className="bi bi-arrow-right" style={{ fontSize: "11px" }}></i>
                  </Link>
                </div>
              </div>

              {/* Thin Sleek Progress Bar */}
              <div
                className="progress w-100 mt-2.5"
                style={{
                  height: "5px",
                  backgroundColor: "#f1f5f9",
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
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          PAGE HEADER (Desktop)
      ====================================================== */}

      <div className="col-12 d-none d-md-block">

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

      <div className="col-12 col-lg-4 d-none d-md-block">

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
          MOBILE LIVE CAMPAIGNS (PHONES ONLY - Exact App Match)
      ====================================================== */}

      <section
        className="col-12 d-block d-md-none mt-2"
        aria-labelledby="mobile-live-campaigns-title"
      >
        <div className="d-flex align-items-center justify-content-between px-1 mb-2">
          <h6
            id="mobile-live-campaigns-title"
            className="fw-bold mb-0 text-dark fs-15"
          >
            Live Campaigns ({liveCampaignCount})
          </h6>

          <Link
            href="/tester/campaigns/live"
            className="text-decoration-none fw-semibold fs-13"
            style={{ color: "#012977" }}
          >
            View All &rarr;
          </Link>
        </div>

        {mobileLiveCampaigns.length === 0 ? (
          <div className="card border-0 shadow-sm text-center py-4 bg-white rounded-4">
            <div className="fs-2 text-muted mb-2">
              <i className="bi bi-megaphone"></i>
            </div>
            <p className="text-muted small mb-0">
              No eligible live campaigns available right now.
            </p>
          </div>
        ) : (
          <div className="tester-mobile-campaign-list">
            {mobileLiveCampaigns.map((campaign) => {
              const filledCount =
                campaign.filledSlots ??
                (campaign.totalSlots - (campaign.availableSlots ?? 0));
              const isApplied = mobileApplicationStatusByCampaignId.has(campaign.id);
              const applicationStatus = mobileApplicationStatusByCampaignId.get(campaign.id);

              return (
                <Link
                  key={campaign.id}
                  href={`/tester/campaigns/live/${campaign.id}`}
                  className="tester-mobile-campaign-card"
                >
                  {/* Square Product Image */}
                  <div className="tester-mobile-product-image">
                    {campaign.productImage ? (
                      <img
                        src={campaign.productImage}
                        alt={campaign.productName}
                      />
                    ) : (
                      <div className="tester-campaign-image-placeholder">
                        <i className="bi bi-image text-muted fs-4"></i>
                      </div>
                    )}
                  </div>

                  {/* Product Info & Stats */}
                  <div className="tester-mobile-product-info">
                    <div className="d-flex align-items-start justify-content-between gap-1">
                      <div className="tester-mobile-product-title">
                        {campaign.productName}
                      </div>
                      {isApplied && (
                        <span
                          className={`badge rounded-pill flex-shrink-0 ${getMobileApplicationClass(
                            applicationStatus ?? null
                          )}`}
                          style={{ fontSize: "10px", padding: "3px 8px" }}
                        >
                          {applicationStatus}
                        </span>
                      )}
                    </div>

                    <div className="tester-mobile-brand-name">
                      {campaign.brand?.companyName ?? "Brand"}
                    </div>

                    {/* Stats */}
                    <div className="tester-mobile-stats-row">
                      <div className="tester-mobile-stat-col">
                        <div className="tester-mobile-stat-label">
                          <i className="bi bi-wallet2"></i>
                          <span>Earn Upto</span>
                        </div>
                        <div className="tester-mobile-stat-value-earn">
                          ₹{Number(campaign.earningAmount).toLocaleString("en-IN")}
                        </div>
                      </div>

                      <div className="tester-mobile-stat-col text-end">
                        <div className="tester-mobile-stat-label justify-content-end">
                          <i className="bi bi-people"></i>
                          <span>Slots</span>
                        </div>
                        <div className="tester-mobile-stat-value-slots">
                          {filledCount}/{campaign.totalSlots}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {liveCampaignCount > MOBILE_CAMPAIGNS_PER_PAGE && (
          <nav
            className="d-flex justify-content-between align-items-center gap-2 mt-3 p-3 bg-white rounded-4 shadow-sm"
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
