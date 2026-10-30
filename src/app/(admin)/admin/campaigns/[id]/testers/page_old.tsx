"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  useParams,
} from "next/navigation";

// ============================================================
// TYPES
// ============================================================

type TesterCampaign = {
  id: number;

  status: string;

  currentTask: number;

  earningAmount: number;

  joinedAt:
    | string
    | null;

  startedAt:
    | string
    | null;

  completedAt:
    | string
    | null;

  cancelledAt:
    | string
    | null;

  cancellationReason:
    | string
    | null;
};

type Tester = {
  id: number;

  userId: number;

  fullName: string;

  gender: string;

  ageCategory:
    | string
    | null;

  pinCode: string;

  city: string;

  state: string;

  profileImage:
    | string
    | null;

  approvalStatus: string;

  email:
    | string
    | null;

  mobile:
    | string
    | null;

  userStatus: string;
};

type CampaignTester = {
  applicationId: number;

  applicationStatus: string;

  appliedAt: string;

  reviewedAt:
    | string
    | null;

  rejectionReason:
    | string
    | null;

  tester: Tester;

  testerCampaign:
    | TesterCampaign
    | null;
};

type Campaign = {
  id: number;

  campaignCode: string;

  productName: string;

  productImage:
    | string
    | null;

  status: string;

  totalSlots: number;

  filledSlots: number;

  availableSlots:
    | number
    | null;

  brandName: string;
};

type Summary = {
  totalApplications: number;

  pending: number;

  approved: number;

  rejected: number;

  enrolled: number;
};

type ApiResponse = {
  success: boolean;

  message?: string;

  data?: {
    campaign: Campaign;

    summary: Summary;

    testers:
      CampaignTester[];
  };
};

// ============================================================
// PAGE
// ============================================================

export default function AdminCampaignTestersPage() {
  const params =
    useParams();

  const campaignId =
    Array.isArray(
      params.id
    )
      ? params.id[0]
      : params.id;

  const [
    campaign,
    setCampaign,
  ] =
    useState<Campaign | null>(
      null
    );

  const [
    testers,
    setTesters,
  ] =
    useState<
      CampaignTester[]
    >([]);

  const [
    summary,
    setSummary,
  ] =
    useState<Summary | null>(
      null
    );

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

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("ALL");

  // ==========================================================
  // LOAD
  // ==========================================================

  const loadTesters =
    useCallback(
      async () => {
        if (!campaignId) {
          setError(
            "Campaign ID is missing."
          );

          setLoading(
            false
          );

          return;
        }

        try {
          setLoading(true);

          setError("");

          const response =
            await fetch(
              `/api/campaigns/${campaignId}/testers`,
              {
                method:
                  "GET",

                credentials:
                  "include",

                cache:
                  "no-store",
              }
            );

          const result:
            ApiResponse =
            await response.json();

          if (
            !response.ok ||
            !result.success ||
            !result.data
          ) {
            throw new Error(
              result.message ||
                "Unable to load testers."
            );
          }

          setCampaign(
            result.data
              .campaign
          );

          setSummary(
            result.data
              .summary
          );

          setTesters(
            result.data
              .testers
          );
        } catch (err) {
          console.error(
            "ADMIN CAMPAIGN TESTERS ERROR:",
            err
          );

          setError(
            err instanceof
              Error
              ? err.message
              : "Unable to load campaign testers."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        campaignId,
      ]
    );

  useEffect(() => {
    loadTesters();
  }, [loadTesters]);

  // ==========================================================
  // FILTER
  // ==========================================================

  const filteredTesters =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return testers.filter(
        (
          item
        ) => {
          const matchesStatus =
            statusFilter ===
              "ALL" ||
            item.applicationStatus ===
              statusFilter;

          if (
            !matchesStatus
          ) {
            return false;
          }

          if (
            !keyword
          ) {
            return true;
          }

          const tester =
            item.tester;

          return [
            tester.fullName,

            tester.mobile ??
              "",

            tester.email ??
              "",

            tester.city,

            tester.state,
          ].some(
            (
              value
            ) =>
              value
                .toLowerCase()
                .includes(
                  keyword
                )
          );
        }
      );
    }, [
      testers,
      search,
      statusFilter,
    ]);

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body text-center py-5">

            <div
              className="spinner-border text-primary"
              role="status"
            />

            <div className="text-muted mt-3">
              Loading campaign testers...
            </div>

          </div>

        </div>

      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (
    error ||
    !campaign
  ) {
    return (
      <div className="col-12">

        <div className="alert alert-danger">

          <i className="bi bi-exclamation-triangle me-2" />

          {
            error ||
            "Campaign not found."
          }

        </div>

        <Link
          href={`/admin/campaigns/${campaignId}`}
          className="btn btn-outline-primary"
        >

          <i className="bi bi-arrow-left me-2" />

          Back to Campaign

        </Link>

      </div>
    );
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <>
      {/* ======================================================
          BACK
      ====================================================== */}

      <div className="col-12">

        <Link
          href={`/admin/campaigns/${campaign.id}`}
          className="text-decoration-none"
        >

          <i className="bi bi-arrow-left me-1" />

          Back to Campaign

        </Link>

      </div>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="col-12">

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">

          <div>

            <h3 className="fw-bold mb-1">
              Campaign Testers
            </h3>

            <div className="text-muted">

              {campaign.productName}

              {" — "}

              {campaign.campaignCode}

            </div>

            <div className="small text-muted mt-1">

              Brand:{" "}

              <strong>
                {campaign.brandName}
              </strong>

            </div>

          </div>

          <span
            className={`badge fs-6 ${
              campaign.status ===
              "LIVE"
                ? "bg-success"
                : "bg-secondary"
            }`}
          >

            {
              campaign.status
            }

          </span>

        </div>

      </div>

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      {summary && (

        <div className="col-12">

          <div className="row g-3">

            <SummaryCard
              title="Applications"
              value={
                summary.totalApplications
              }
            />

            <SummaryCard
              title="Pending"
              value={
                summary.pending
              }
            />

            <SummaryCard
              title="Approved"
              value={
                summary.approved
              }
            />

            <SummaryCard
              title="Enrolled"
              value={
                summary.enrolled
              }
            />

          </div>

        </div>

      )}

      {/* ======================================================
          CAMPAIGN SLOT INFO
      ====================================================== */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body">

            <div className="row g-3">

              <div className="col-md-4">

                <div className="text-muted small">
                  Total Slots
                </div>

                <div className="fw-bold fs-5">

                  {
                    campaign.totalSlots
                  }

                </div>

              </div>

              <div className="col-md-4">

                <div className="text-muted small">
                  Filled Slots
                </div>

                <div className="fw-bold fs-5">

                  {
                    campaign.filledSlots
                  }

                </div>

              </div>

              <div className="col-md-4">

                <div className="text-muted small">
                  Available Slots
                </div>

                <div className="fw-bold fs-5">

                  {
                    campaign.availableSlots ??
                    0
                  }

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          SEARCH / FILTER
      ====================================================== */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body">

            <div className="row g-3">

              <div className="col-lg-8">

                <div className="input-group">

                  <span className="input-group-text bg-white">

                    <i className="bi bi-search" />

                  </span>

                  <input
                    type="search"
                    className="form-control"
                    placeholder="Search by name, mobile, email, city or state..."
                    value={
                      search
                    }
                    onChange={(
                      event
                    ) =>
                      setSearch(
                        event.target
                          .value
                      )
                    }
                  />

                </div>

              </div>

              <div className="col-lg-4">

                <select
                  className="form-select"
                  value={
                    statusFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setStatusFilter(
                      event.target
                        .value
                    )
                  }
                >

                  <option value="ALL">
                    All Applications
                  </option>

                  <option value="PENDING">
                    Pending
                  </option>

                  <option value="APPROVED">
                    Approved
                  </option>

                  <option value="REJECTED">
                    Rejected
                  </option>

                </select>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          TESTER TABLE
      ====================================================== */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body">

            {filteredTesters.length ===
            0 ? (

              <div className="text-center py-5">

                <i className="bi bi-people fs-1 text-muted" />

                <h6 className="mt-3">
                  No testers found
                </h6>

                <div className="text-muted">

                  No tester applications match the current filter.

                </div>

              </div>

            ) : (

              <div className="table-responsive">

                <table className="table table-hover align-middle mb-0">

                  <thead className="table-light">

                    <tr>

                      <th>
                        Tester
                      </th>

                      <th>
                        Contact
                      </th>

                      <th>
                        Location
                      </th>

                      <th>
                        Application
                      </th>

                      <th>
                        Campaign Progress
                      </th>

                      <th>
                        Applied
                      </th>

                      <th className="text-end">
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredTesters.map(
                      (
                        item
                      ) => (

                        <tr
                          key={
                            item.applicationId
                          }
                        >

                          {/* TESTER */}

                          <td>

                            <div className="d-flex align-items-center gap-3">

                              <div
                                className="rounded-circle bg-light border overflow-hidden d-flex align-items-center justify-content-center"
                                style={{
                                  width:
                                    46,

                                  height:
                                    46,
                                }}
                              >

                                {item
                                  .tester
                                  .profileImage ? (

                                  <img
                                    src={
                                      item
                                        .tester
                                        .profileImage
                                    }
                                    alt={
                                      item
                                        .tester
                                        .fullName
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

                                  <i className="bi bi-person text-muted" />

                                )}

                              </div>

                              <div>

                                <div className="fw-semibold">

                                  {
                                    item
                                      .tester
                                      .fullName
                                  }

                                </div>

                                <small className="text-muted">

                                  {
                                    item
                                      .tester
                                      .gender
                                  }

                                  {item
                                    .tester
                                    .ageCategory
                                    ? ` • ${item.tester.ageCategory}`
                                    : ""}

                                </small>

                              </div>

                            </div>

                          </td>

                          {/* CONTACT */}

                          <td>

                            <div>

                              {
                                item
                                  .tester
                                  .mobile ||
                                "-"
                              }

                            </div>

                            <small className="text-muted">

                              {
                                item
                                  .tester
                                  .email ||
                                "-"
                              }

                            </small>

                          </td>

                          {/* LOCATION */}

                          <td>

                            <div>

                              {
                                item
                                  .tester
                                  .city ||
                                "-"
                              }

                            </div>

                            <small className="text-muted">

                              {
                                item
                                  .tester
                                  .state ||
                                "-"
                              }

                            </small>

                          </td>

                          {/* APPLICATION */}

                          <td>

                            <StatusBadge
                              status={
                                item.applicationStatus
                              }
                            />

                            {item.rejectionReason && (

                              <div className="small text-danger mt-1">

                                {
                                  item.rejectionReason
                                }

                              </div>

                            )}

                          </td>

                          {/* TESTER CAMPAIGN */}

                          <td>

                            {item.testerCampaign ? (

                              <>
                                <StatusBadge
                                  status={
                                    item
                                      .testerCampaign
                                      .status
                                  }
                                />

                                <div className="small text-muted mt-1">

                                  Current Task:{" "}

                                  <strong>

                                    {
                                      item
                                        .testerCampaign
                                        .currentTask
                                    }

                                  </strong>

                                </div>

                              </>

                            ) : (

                              <span className="text-muted">
                                Not enrolled
                              </span>

                            )}

                          </td>

                          {/* APPLIED */}

                          <td>

                            {
                              formatDateTime(
                                item.appliedAt
                              )
                            }

                          </td>
                          <td className="text-end">

                              {item.testerCampaign ? (

                                <Link
                                  href={`/admin/campaigns/${campaign.id}/testers/${item.testerCampaign.id}/tasks`}
                                  className="btn btn-sm btn-outline-primary"
                                >
                                 
                                  View Tasks
                                </Link>

                              ) : (

                                <span className="text-muted small">
                                  Not enrolled
                                </span>

                              )}

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
    </>
  );
}

// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  title,
  value,
}: {
  title: string;

  value: number;
}) {
  return (
    <div className="col-md-3 col-sm-6">

      <div className="card border-0 shadow-sm h-100">

        <div className="card-body">

          <div className="text-muted small mb-1">

            {
              title
            }

          </div>

          <div className="fs-3 fw-bold">

            {
              value
            }

          </div>

        </div>

      </div>

    </div>
  );
}

// ============================================================
// STATUS
// ============================================================

function StatusBadge({
  status,
}: {
  status: string;
}) {
  let className =
    "bg-secondary";

  switch (
    status
  ) {
    case "APPROVED":
    case "COMPLETED":
      className =
        "bg-success";
      break;

    case "PENDING":
    case "SUBMITTED":
      className =
        "bg-warning text-dark";
      break;

    case "REJECTED":
    case "CANCELLED":
      className =
        "bg-danger";
      break;

    case "ONGOING":
      className =
        "bg-primary";
      break;
  }

  return (
    <span
      className={`badge ${className}`}
    >

      {
        status
      }

    </span>
  );
}

// ============================================================
// DATE TIME
// ============================================================

function formatDateTime(
  value:
    | string
    | null
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleString(
    "en-IN",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  );
}