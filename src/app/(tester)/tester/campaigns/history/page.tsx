"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

// ============================================================
// TYPES
// ============================================================

type CompletedTask = {
  id: number;

  taskNumber: number;

  status: string;

  approvedAt:
    | string
    | null;
};

type CompletedCampaign = {
  testerCampaignId:
    number;

  status:
    string;

  earningAmount:
    | string
    | number;

  joinedAt:
    string;

  completedAt:
    | string
    | null;

  campaign: {
    id: number;

    productName:
      string;

    productImage:
      | string
      | null;

    productDescription:
      | string
      | null;

    brandName:
      | string
      | null;

    task4Required:
      boolean;
  };

  tasks:
    CompletedTask[];
};

type CompletedCampaignsResponse = {
  success: boolean;

  message?: string;

  data?: {
    tester: {
      id: number;

      fullName:
        string;
    };

    totalCampaigns:
      number;

    totalEarnings:
      number;

    campaigns:
      CompletedCampaign[];
  };
};

// ============================================================
// PAGE
// ============================================================

export default function CompletedCampaignsPage() {
  // ============================================================
  // STATE
  // ============================================================

  const [
    campaigns,
    setCampaigns,
  ] =
    useState<
      CompletedCampaign[]
    >([]);

  const [
    totalEarnings,
    setTotalEarnings,
  ] =
    useState(0);

  const [
    totalCampaigns,
    setTotalCampaigns,
  ] =
    useState(0);

  const [
    testerName,
    setTesterName,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  // ============================================================
  // LOAD COMPLETED CAMPAIGNS
  // ============================================================

  useEffect(() => {
    async function loadCompletedCampaigns() {
      try {
        setLoading(
          true
        );

        setError("");

        const response =
          await fetch(
            "/api/tester/campaigns/completed",
            {
              method:
                "GET",

              cache:
                "no-store",
            }
          );

        const result =
          (await response.json()) as
            CompletedCampaignsResponse;

        if (
          !response.ok
        ) {
          throw new Error(
            result.message ||
              "Unable to load completed campaigns."
          );
        }

        setCampaigns(
          result.data
            ?.campaigns ??
            []
        );

        setTotalEarnings(
          Number(
            result.data
              ?.totalEarnings ??
              0
          )
        );

        setTotalCampaigns(
          result.data
            ?.totalCampaigns ??
            0
        );

        setTesterName(
          result.data
            ?.tester
            .fullName ??
            ""
        );
      } catch (err) {
        console.error(
          "Load completed campaigns error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load completed campaigns."
        );
      } finally {
        setLoading(
          false
        );
      }
    }

    loadCompletedCampaigns();
  }, []);

  // ============================================================
  // SUMMARY COUNTS
  // ============================================================

  const totalApprovedTasks =
    useMemo(() => {
      return campaigns.reduce(
        (
          total,
          campaign
        ) => {
          return (
            total +
            campaign.tasks.filter(
              (task) =>
                task.status ===
                "APPROVED"
            ).length
          );
        },
        0
      );
    }, [
      campaigns,
    ]);

  // ============================================================
  // LOADING
  // ============================================================

  if (
    loading
  ) {
    return (
      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body py-5 text-center">

            <div
              className="spinner-border text-primary"
              role="status"
            />

            <div className="text-muted mt-3">
              Loading completed campaigns...
            </div>

          </div>

        </div>

      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <>
      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="col-12">

        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">

          <div>

            <h3 className="fw-bold mb-1">
              Completed Campaigns
            </h3>

            <p className="text-muted mb-0">

              {testerName
                ? `${testerName}, here are your successfully completed campaigns.`
                : "Your successfully completed campaigns."}

            </p>

          </div>

          <div>

            <span className="badge bg-success fs-6 px-3 py-2">

              {
                totalCampaigns
              }{" "}

              Completed

            </span>

          </div>

        </div>

      </div>

      {/* ========================================================
          ERROR
      ======================================================== */}

      {error && (

        <div className="col-12">

          <div className="alert alert-danger border-0 shadow-sm mb-0">

            <i className="bi bi-exclamation-circle-fill me-2"></i>

            {
              error
            }

          </div>

        </div>

      )}

      {/* ========================================================
          SUMMARY CARDS
      ======================================================== */}

      {!error && (

        <>
          <div className="col-md-4">

            <SummaryCard
              icon="bi-check-circle"
              label="Completed Campaigns"
              value={
                totalCampaigns.toString()
              }
            />

          </div>

          <div className="col-md-4">

            <SummaryCard
              icon="bi-check2-all"
              label="Approved Tasks"
              value={
                totalApprovedTasks.toString()
              }
            />

          </div>

          <div className="col-md-4">

            <SummaryCard
              icon="bi-wallet2"
              label="Campaign Earnings"
              value={`₹${totalEarnings.toLocaleString(
                "en-IN"
              )}`}
            />

          </div>
        </>

      )}

      {/* ========================================================
          EMPTY STATE
      ======================================================== */}

      {!error &&
        campaigns.length ===
          0 && (

        <div className="col-12">

          <div className="card border-0 shadow-sm">

            <div className="card-body text-center py-5">

              <div
                className="mx-auto rounded-circle bg-light d-flex align-items-center justify-content-center"
                style={{
                  width:
                    "72px",

                  height:
                    "72px",
                }}
              >

                <i className="bi bi-check-circle fs-2 text-muted"></i>

              </div>

              <h5 className="fw-bold mt-3 mb-2">
                No completed campaigns yet
              </h5>

              <p className="text-muted mb-4">
                Campaigns will appear here
                after all required tasks are
                approved.
              </p>

              <Link
                href="/tester/campaigns/ongoing"
                className="btn btn-primary"
              >
                View Ongoing Campaigns
              </Link>

            </div>

          </div>

        </div>

      )}

      {/* ========================================================
          COMPLETED CAMPAIGNS
      ======================================================== */}

      {campaigns.map(
        (
          item
        ) => {
          const approvedTasks =
            item.tasks.filter(
              (task) =>
                task.status ===
                "APPROVED"
            ).length;

          const totalTasks =
            item.tasks.length;

          const progressPercentage =
            totalTasks > 0
              ? Math.round(
                  (
                    approvedTasks /
                    totalTasks
                  ) *
                    100
                )
              : 0;

          return (
            <div
              key={
                item.testerCampaignId
              }
              className="col-xl-6"
            >

              <div className="card border-0 shadow-sm h-100">

                <div className="card-body p-4">

                  {/* ============================================
                      PRODUCT HEADER
                  ============================================ */}

                  <div className="d-flex gap-3 align-items-start">

                    <div
                      className="rounded overflow-hidden bg-light flex-shrink-0 d-flex align-items-center justify-content-center"
                      style={{
                        width:
                          "88px",

                        height:
                          "88px",
                      }}
                    >

                      {item
                        .campaign
                        .productImage ? (

                        <img
                          src={
                            item
                              .campaign
                              .productImage
                          }
                          alt={
                            item
                              .campaign
                              .productName
                          }
                          style={{
                            width:
                              "100%",

                            height:
                              "100%",

                            objectFit:
                              "cover",
                          }}
                        />

                      ) : (

                        <i className="bi bi-image fs-2 text-muted"></i>

                      )}

                    </div>

                    <div className="flex-grow-1">

                      <div className="small text-primary fw-bold text-uppercase">

                        {
                          item
                            .campaign
                            .brandName ??
                          "Brand"
                        }

                      </div>

                      <h5 className="fw-bold mb-2">

                        {
                          item
                            .campaign
                            .productName
                        }

                      </h5>

                      <span className="badge bg-success">

                        <i className="bi bi-check-circle-fill me-1"></i>

                        COMPLETED

                      </span>

                    </div>

                  </div>

                  {/* ============================================
                      DESCRIPTION
                  ============================================ */}

                  {item
                    .campaign
                    .productDescription && (

                    <p className="text-muted small mt-3 mb-0">

                      {truncateText(
                        item
                          .campaign
                          .productDescription,
                        150
                      )}

                    </p>

                  )}

                  <hr />

                  {/* ============================================
                      TASK PROGRESS
                  ============================================ */}

                  <div className="mb-3">

                    <div className="d-flex justify-content-between align-items-center mb-2">

                      <small className="text-muted">
                        Task Completion
                      </small>

                      <strong className="small">

                        {
                          approvedTasks
                        }
                        /
                        {
                          totalTasks
                        }

                      </strong>

                    </div>

                    <div
                      className="progress"
                      style={{
                        height:
                          "8px",
                      }}
                    >

                      <div
                        className="progress-bar bg-success"
                        role="progressbar"
                        style={{
                          width:
                            `${progressPercentage}%`,
                        }}
                        aria-valuenow={
                          progressPercentage
                        }
                        aria-valuemin={
                          0
                        }
                        aria-valuemax={
                          100
                        }
                      />

                    </div>

                  </div>

                  {/* ============================================
                      TASK BADGES
                  ============================================ */}

                  <div className="d-flex flex-wrap gap-2 mb-4">

                    {item.tasks.map(
                      (
                        task
                      ) => (

                        <span
                          key={
                            task.id
                          }
                          className={`badge ${
                            task.status ===
                            "APPROVED"
                              ? "bg-success"
                              : "bg-secondary"
                          }`}
                        >

                          <i
                            className={`bi ${
                              task.status ===
                              "APPROVED"
                                ? "bi-check-lg"
                                : "bi-circle"
                            } me-1`}
                          />

                          Task{" "}

                          {
                            task.taskNumber
                          }

                        </span>

                      )
                    )}

                  </div>

                  {/* ============================================
                      COMPLETION + EARNING
                  ============================================ */}

                  <div className="row g-3 mb-4">

                    <div className="col-6">

                      <div className="border rounded-3 p-3 h-100">

                        <small className="text-muted d-block mb-1">
                          Completed
                        </small>

                        <strong className="small">

                          {formatDate(
                            item.completedAt
                          )}

                        </strong>

                      </div>

                    </div>

                    <div className="col-6">

                      <div className="border rounded-3 p-3 h-100">

                        <small className="text-muted d-block mb-1">
                          Earning
                        </small>

                        <strong className="text-success">

                          ₹
                          {Number(
                            item.earningAmount
                          ).toLocaleString(
                            "en-IN"
                          )}

                        </strong>

                      </div>

                    </div>

                  </div>

                  {/* ============================================
                      TASK 4 INFO
                  ============================================ */}

                  <div className="small text-muted mb-4">

                    {item
                      .campaign
                      .task4Required ? (

                      <>
                        <i className="bi bi-check-circle me-1 text-success"></i>

                        Task 4 was required and
                        approved.
                      </>

                    ) : (

                      <>
                        <i className="bi bi-info-circle me-1"></i>

                        Campaign completed after
                        Task 3 approval.
                      </>

                    )}

                  </div>

                  {/* ============================================
                      DETAILS
                  ============================================ */}

                  <Link
                    href={`/tester/campaigns/history/${item.testerCampaignId}`}
                    className="btn btn-outline-primary w-100"
                  >

                    View Campaign Details

                    <i className="bi bi-arrow-right ms-2"></i>

                  </Link>

                </div>

              </div>

            </div>
          );
        }
      )}
    </>
  );
}

// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: string;

  label: string;

  value: string;
}) {
  return (
    <div className="card border-0 shadow-sm h-100">

      <div className="card-body">

        <div className="d-flex align-items-center gap-3">

          <div
            className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0"
            style={{
              width:
                "48px",

              height:
                "48px",
            }}
          >

            <i
              className={`bi ${icon} fs-5`}
            />

          </div>

          <div>

            <small className="text-muted d-block">
              {label}
            </small>

            <strong className="fs-5">
              {value}
            </strong>

          </div>

        </div>

      </div>

    </div>
  );
}

// ============================================================
// DATE
// ============================================================

function formatDate(
  value:
    | string
    | null
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",
    }
  );
}

// ============================================================
// TRUNCATE
// ============================================================

function truncateText(
  value: string,
  maxLength: number
) {
  const text =
    value.trim();

  if (
    text.length <=
    maxLength
  ) {
    return text;
  }

  return `${text.slice(
    0,
    maxLength
  )}...`;
}