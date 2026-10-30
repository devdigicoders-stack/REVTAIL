import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function CampaignApprovalsPage() {
  // ============================================================
  // 1. AUTHENTICATION / AUTHORIZATION
  // ============================================================

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "ADMIN") {
    redirect("/login");
  }

  // ============================================================
  // 2. GET CAMPAIGNS WAITING FOR ADMIN APPROVAL
  //
  // Brand campaign creation currently saves status = SUBMITTED.
  // Therefore SUBMITTED means "waiting for Admin review".
  // ============================================================

  const campaigns = await prisma.campaign.findMany({
    where: {
      status: "SUBMITTED",
    },

    select: {
      id: true,
      campaignCode: true,

      productName: true,
      productImage: true,
      productLink: true,

      earningAmount: true,
      currency: true,

      totalSlots: true,
      filledSlots: true,
      availableSlots: true,

      targetGender: true,
      targetState: true,
      targetCity: true,

      task4Required: true,

      status: true,

      brand: {
        select: {
          id: true,
          companyName: true,
          companyType: true,

          categoryId: true,

          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },

      images: {
        select: {
          id: true,
          imagePath: true,
          imageOrder: true,
        },

        orderBy: {
          imageOrder: "asc",
        },
      },

      _count: {
        select: {
          campaignQuestions: true,
        },
      },
    },

    // Use ID ordering instead of legacy DateTime columns.
    // Some existing rows contain invalid MySQL date values that
    // Prisma cannot convert to valid JavaScript Date objects.
    orderBy: {
      id: "asc",
    },
  });

  // ============================================================
  // 3. HELPER FUNCTIONS
  // ============================================================

  const formatAmount = (amount: unknown) => {
    return Number(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // ============================================================
  // 4. PAGE
  // ============================================================

  return (
    <>
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="col-12">

        <div
          className="
            d-flex
            flex-column
            flex-md-row
            justify-content-between
            align-items-md-center
            gap-3
            mb-2
          "
        >
          <div>

            <div className="d-flex align-items-center gap-2 mb-1">
              <Link
                href="/admin"
                className="text-decoration-none text-muted"
              >
                Dashboard
              </Link>

              <i className="bi bi-chevron-right text-muted small"></i>

              <span className="text-muted">
                Approvals
              </span>

              <i className="bi bi-chevron-right text-muted small"></i>

              <span>
                Campaigns
              </span>
            </div>

            <h4 className="fw-bold mb-1">
              Campaign Approvals
            </h4>

            <p className="text-muted mb-0">
              Review campaigns submitted by brands before
              making them live.
            </p>

          </div>

          {/* Pending count */}
          <div>
            <span className="badge text-bg-warning fs-6 px-3 py-2">
              {campaigns.length} Pending
            </span>
          </div>

        </div>

      </div>

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body">

            <div className="row align-items-center">

              <div className="col-md-8">

                <div className="d-flex align-items-center gap-3">

                  <div
                    className="
                      bg-warning-subtle
                      text-warning
                      rounded-circle
                      d-flex
                      align-items-center
                      justify-content-center
                    "
                    style={{
                      width: "55px",
                      height: "55px",
                      flexShrink: 0,
                    }}
                  >
                    <i className="bi bi-megaphone-fill fs-4"></i>
                  </div>

                  <div>

                    <h5 className="fw-bold mb-1">
                      Campaigns awaiting review
                    </h5>

                    <p className="text-muted mb-0 small">
                      Review campaign information, product images,
                      questions, targeting, earning and available
                      tester slots before approving.
                    </p>

                  </div>

                </div>

              </div>

              <div className="col-md-4 text-md-end mt-3 mt-md-0">

                <div className="fs-2 fw-bold">
                  {campaigns.length}
                </div>

                <small className="text-muted">
                  Pending Campaigns
                </small>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          CAMPAIGN LIST
      ====================================================== */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          {/* Card Header */}

          <div className="card-header bg-white border-0 pt-4 px-4">

            <div
              className="
                d-flex
                flex-column
                flex-md-row
                justify-content-between
                align-items-md-center
                gap-2
              "
            >

              <div>

                <h5 className="fw-bold mb-1">
                  Pending Campaigns
                </h5>

                <p className="text-muted small mb-0">
                  Pending campaigns are shown in creation order.
                </p>

              </div>

            </div>

          </div>

          {/* ==================================================
              CARD BODY
          ================================================== */}

          <div className="card-body px-4">

            {campaigns.length === 0 ? (

              // =================================================
              // EMPTY STATE
              // =================================================

              <div className="text-center py-5">

                <div
                  className="
                    bg-success-subtle
                    text-success
                    rounded-circle
                    d-inline-flex
                    align-items-center
                    justify-content-center
                    mb-3
                  "
                  style={{
                    width: "70px",
                    height: "70px",
                  }}
                >
                  <i className="bi bi-check-circle fs-2"></i>
                </div>

                <h5 className="fw-bold">
                  No campaigns waiting for approval
                </h5>

                <p className="text-muted mb-0">
                  All submitted campaigns have been reviewed.
                </p>

              </div>

            ) : (

              // =================================================
              // CAMPAIGN TABLE
              // =================================================

              <div className="table-responsive">

                <table className="table align-middle">

                  <thead>

                    <tr>

                      <th style={{ minWidth: "270px" }}>
                        Campaign
                      </th>

                      <th style={{ minWidth: "160px" }}>
                        Brand
                      </th>

                      <th>
                        Earning
                      </th>

                      <th>
                        Slots
                      </th>

                      <th>
                        Target
                      </th>

                      <th>
                        Questions
                      </th>

                      <th>
                        Submitted
                      </th>

                      <th className="text-end">
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {campaigns.map((campaign) => {

                      // -----------------------------------------
                      // Decide which image should be thumbnail.
                      //
                      // Prefer CampaignImage because campaign now
                      // supports maximum 4 images.
                      //
                      // Fall back to legacy productImage field.
                      // -----------------------------------------

                      const thumbnail =
                        campaign.images[0]?.imagePath ||
                        campaign.productImage ||
                        null;

                      return (

                        <tr key={campaign.id}>

                          {/* =====================================
                              CAMPAIGN
                          ===================================== */}

                          <td>

                            <div className="d-flex align-items-center gap-3">

                              {/* Product image */}

                              <div
                                className="
                                  bg-light
                                  border
                                  rounded
                                  d-flex
                                  align-items-center
                                  justify-content-center
                                  overflow-hidden
                                "
                                style={{
                                  width: "60px",
                                  height: "60px",
                                  flexShrink: 0,
                                }}
                              >

                                {thumbnail ? (

                                  <Image
                                    src={thumbnail}
                                    alt={campaign.productName}
                                    width={60}
                                    height={60}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                  />

                                ) : (

                                  <i className="bi bi-image text-muted fs-4"></i>

                                )}

                              </div>

                              {/* Campaign info */}

                              <div>

                                <div className="fw-semibold">
                                  {campaign.productName}
                                </div>

                                <small className="text-muted d-block">
                                  {campaign.campaignCode}
                                </small>

                                <span
                                  className="
                                    badge
                                    bg-warning-subtle
                                    text-warning-emphasis
                                    mt-1
                                  "
                                >
                                  Pending Approval
                                </span>

                              </div>

                            </div>

                          </td>

                          {/* =====================================
                              BRAND
                          ===================================== */}

                          <td>

                            <div className="fw-semibold">
                              {campaign.brand.companyName}
                            </div>

                            <small className="text-muted d-block">
                              {campaign.brand.category?.name ?? "-"}
                            </small>

                            <small className="text-muted">
                              {campaign.brand.companyType}
                            </small>

                          </td>

                          {/* =====================================
                              EARNING
                          ===================================== */}

                          <td>

                            <span className="fw-semibold">
                              ₹{formatAmount(
                                campaign.earningAmount
                              )}
                            </span>

                            <small className="text-muted d-block">
                              per tester
                            </small>

                          </td>

                          {/* =====================================
                              SLOTS
                          ===================================== */}

                          <td>

                            <div className="fw-semibold">
                              {campaign.totalSlots}
                            </div>

                            <small className="text-muted">
                              Total slots
                            </small>

                          </td>

                          {/* =====================================
                              TARGET
                          ===================================== */}

                          <td>

                            <div className="small">

                              <div>
                                <i className="bi bi-gender-ambiguous me-1"></i>

                                {campaign.targetGender}
                              </div>

                              <div className="text-muted mt-1">

                                <i className="bi bi-geo-alt me-1"></i>

                                {campaign.targetCity &&
                                campaign.targetCity !== "any"
                                  ? campaign.targetCity
                                  : campaign.targetState &&
                                    campaign.targetState !== "any"
                                  ? campaign.targetState
                                  : "Any Location"}

                              </div>

                            </div>

                          </td>

                          {/* =====================================
                              QUESTIONS
                          ===================================== */}

                          <td>

                            <span className="badge bg-light text-dark border">
                              {
                                campaign._count
                                  .campaignQuestions
                              }{" "}
                              Questions
                            </span>

                            {campaign.task4Required && (

                              <small className="text-muted d-block mt-1">
                                Task 4 enabled
                              </small>

                            )}

                          </td>

                          {/* =====================================
                              SUBMITTED
                          ===================================== */}

                          <td>

                            <div className="small fw-semibold">
                              Pending Review
                            </div>

                            <small className="text-muted d-block">
                              Queue #{campaign.id}
                            </small>

                          </td>

                          {/* =====================================
                              ACTION
                          ===================================== */}

                          <td className="text-end">

                            <Link
                              href={`/admin/approvals/campaigns/${campaign.id}`}
                              className="btn btn-primary btn-sm text-nowrap"
                            >
                              <i className="bi bi-eye me-1"></i>

                              Review
                            </Link>

                          </td>

                        </tr>

                      );

                    })}

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