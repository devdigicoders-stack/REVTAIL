"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  useParams,
} from "next/navigation";

// ============================================================
// TYPES
// ============================================================

type Task = {
  id: number;

  taskNumber: number;

  title: string;

  status: string;

  unlockedAt:
    | string
    | null;

  submittedAt:
    | string
    | null;

  approvedAt:
    | string
    | null;

  rejectedAt:
    | string
    | null;

  rejectionReason:
    | string
    | null;

  totalAttempts: number;
};

type TesterCampaign = {
  testerCampaignId:
    number;

  status: string;

  currentTask:
    number;

  earningAmount:
    number;

  joinedAt:
    string;

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

  campaign: {
    id: number;

    campaignCode:
      string;

    productName:
      string;

    productImage:
      | string
      | null;

    status:
      string;

    task4Required:
      boolean;

    brandName:
      string;
  };

  progress: {
    approvedTasks:
      number;

    totalTasks:
      number;

    percentage:
      number;
  };

  tasks: Task[];
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

  approvalStatus:
    string;

  approvedAt:
    | string
    | null;

  rejectionReason:
    | string
    | null;

  createdAt:
    string;

  updatedAt:
    string;

  email:
    | string
    | null;

  mobile:
    | string
    | null;

  instagramId:
    | string
    | null;

  interests: {
    id: number;
    name: string;
  }[];

  userStatus:
    string;

  emailVerifiedAt:
    | string
    | null;

  mobileVerifiedAt:
    | string
    | null;

  lastLoginAt:
    | string
    | null;
};

type ApiResponse = {
  success: boolean;

  message?: string;

  data?: {
    tester:
      Tester;

    summary: {
      totalCampaigns:
        number;

      ongoingCampaigns:
        number;

      completedCampaigns:
        number;

      cancelledCampaigns:
        number;
    };

    campaigns:
      TesterCampaign[];
  };
};

// ============================================================
// PAGE
// ============================================================

export default function AdminTesterDetailPage() {
  const params =
    useParams();

  const testerId =
    Array.isArray(
      params.id
    )
      ? params.id[0]
      : params.id;

  const [
    data,
    setData,
  ] =
    useState<
      ApiResponse["data"] | null
    >(null);

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

  // ==========================================================
  // LOAD
  // ==========================================================

  const loadTester =
    useCallback(
      async () => {
        if (!testerId) {
          setError(
            "Tester ID is missing."
          );

          setLoading(false);

          return;
        }

        try {
          setLoading(true);

          setError("");

          const response =
            await fetch(
              `/api/admin/testers/${testerId}`,
              {
                method:
                  "GET",

                credentials:
                  "include",

                cache:
                  "no-store",
              }
            );

          const result =
            (await response.json()) as
              ApiResponse;

          if (
            !response.ok ||
            !result.success ||
            !result.data
          ) {
            throw new Error(
              result.message ||
                "Unable to load tester."
            );
          }

          setData(
            result.data
          );
        } catch (err) {
          console.error(
            "ADMIN TESTER DETAIL ERROR:",
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load tester."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        testerId,
      ]
    );

  useEffect(() => {
    loadTester();
  }, [loadTester]);

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
              Loading tester details...
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
    !data
  ) {
    return (
      <div className="col-12">

        <div className="alert alert-danger">

          <i className="bi bi-exclamation-triangle me-2" />

          {error ||
            "Tester not found."}

        </div>

        <Link
          href="/admin/testers"
          className="btn btn-outline-primary"
        >

          <i className="bi bi-arrow-left me-2" />

          Back to Testers

        </Link>

      </div>
    );
  }

  const {
    tester,
    summary,
    campaigns,
  } =
    data;

  // ==========================================================
  // TOTAL EARNING
  // ==========================================================

const totalEarning =
  campaigns
    .filter(
      (campaign) =>
        campaign.status ===
        "COMPLETED"
    )
    .reduce(
      (
        total,
        campaign
      ) =>
        total +
        Number(
          campaign.earningAmount ||
            0
        ),
      0
    );

  const formattedTotalEarning =
    new Intl.NumberFormat(
      "en-IN",
      {
        style:
          "currency",

        currency:
          "INR",

        minimumFractionDigits:
          2,

        maximumFractionDigits:
          2,
      }
    ).format(
      totalEarning
    );

  return (
    <>
      {/* ======================================================
          BACK
      ====================================================== */}

      <div className="col-12">

        <Link
          href="/admin/testers"
          className="text-decoration-none"
        >

          <i className="bi bi-arrow-left me-1" />

          Back to Testers

        </Link>

      </div>

      {/* ======================================================
          TESTER PROFILE
      ====================================================== */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body">

            <div className="d-flex flex-column flex-lg-row justify-content-between gap-4">

              <div className="d-flex align-items-center gap-3">

                <div
                  className="rounded-circle bg-light border overflow-hidden d-flex align-items-center justify-content-center"
                  style={{
                    width: 85,
                    height: 85,
                  }}
                >

                  {tester.profileImage ? (

                    <img
                      src={
                        tester.profileImage
                      }
                      alt={
                        tester.fullName
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

                    <i className="bi bi-person fs-1 text-muted" />

                  )}

                </div>

                <div>

                  <h3 className="fw-bold mb-1">

                    {
                      tester.fullName
                    }

                  </h3>

                  <div className="text-muted">

                    {
                      tester.mobile ||
                      "-"
                    }

                    {tester.email
                      ? ` • ${tester.email}`
                      : ""}

                  </div>

                  <div className="mt-2">

                    <StatusBadge
                      status={
                        tester.approvalStatus
                      }
                    />

                  </div>

                </div>

              </div>

              <div className="text-lg-end">

                <div className="text-muted small">
                  Tester Profile ID
                </div>

                <strong>
                  #{tester.id}
                </strong>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <SummaryCard
        title="Total Campaigns"
        value={
          summary.totalCampaigns
        }
      />

      <SummaryCard
        title="Ongoing"
        value={
          summary.ongoingCampaigns
        }
      />

      <SummaryCard
        title="Completed"
        value={
          summary.completedCampaigns
        }
      />

      <SummaryCard
        title="Cancelled"
        value={
          summary.cancelledCampaigns
        }
      />

      {/* ======================================================
          PROFILE INFORMATION
      ====================================================== */}

      <div className="col-lg-6">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-body">

            <h5 className="fw-bold mb-3">
              Personal Information
            </h5>

            <InfoRow
              label="Full Name"
              value={
                tester.fullName
              }
            />

            <InfoRow
              label="Gender"
              value={
                tester.gender
              }
            />

            <InfoRow
              label="Age Category"
              value={
                tester.ageCategory ||
                "-"
              }
            />

            <InfoRow
              label="PIN Code"
              value={
                tester.pinCode
              }
            />

            <InfoRow
              label="City"
              value={
                tester.city
              }
            />

            <InfoRow
              label="State"
              value={
                tester.state
              }
            />

          </div>

        </div>

      </div>

      {/* ======================================================
          ACCOUNT
      ====================================================== */}

      <div className="col-lg-6">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-body">

            <h5 className="fw-bold mb-3">
              Account Information
            </h5>

            <InfoRow
              label="Mobile"
              value={
                tester.mobile ||
                "-"
              }
            />

            <InfoRow
              label="Email"
              value={
                tester.email ||
                "-"
              }
            />

            <InfoRow
              label="Instagram ID"
              value={
                tester.instagramId ||
                "-"
              }
            />

            <InfoRow
              label="Account Status"
              value={
                tester.userStatus
              }
            />

            <InfoRow
              label="Approval Status"
              value={
                tester.approvalStatus
              }
            />

            <InfoRow
              label="Total Earning"
              value={
                formattedTotalEarning
              }
            />

            <InfoRow
              label="Approved At"
              value={
                formatDateTime(
                  tester.approvedAt
                )
              }
            />

            <InfoRow
              label="Last Login"
              value={
                formatDateTime(
                  tester.lastLoginAt
                )
              }
            />

          </div>

        </div>

      </div>

      {/* ======================================================
          INTERESTS
      ====================================================== */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body">

            <div className="d-flex justify-content-between align-items-center mb-3">

              <div>

                <h5 className="fw-bold mb-1">
                  Interests
                </h5>

                <div className="text-muted small">
                  Product categories selected by this tester.
                </div>

              </div>

              <span className="badge bg-light text-dark border">
                {tester.interests?.length ?? 0}
              </span>

            </div>

            {tester.interests &&
            tester.interests.length > 0 ? (

              <div className="d-flex flex-wrap gap-2">

                {tester.interests.map(
                  (
                    interest
                  ) => (

                    <span
                      key={
                        interest.id
                      }
                      className="badge rounded-pill bg-primary-subtle text-primary-emphasis border px-3 py-2"
                    >
                      {
                        interest.name
                      }
                    </span>

                  )
                )}

              </div>

            ) : (

              <div className="text-muted">
                No interests selected.
              </div>

            )}

          </div>

        </div>

      </div>

      {/* ======================================================
          CAMPAIGNS
      ====================================================== */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body">

            <div className="d-flex justify-content-between align-items-center mb-4">

              <div>

                <h5 className="fw-bold mb-1">
                  Campaigns & Tasks
                </h5>

                <div className="text-muted small">
                  Campaign participation and task progress for this tester.
                </div>

              </div>

            </div>

            {campaigns.length ===
            0 ? (

              <div className="text-center py-5">

                <i className="bi bi-megaphone fs-1 text-muted" />

                <div className="mt-2 text-muted">
                  This tester has not joined any campaign yet.
                </div>

              </div>

            ) : (

              <div className="d-flex flex-column gap-4">

                {campaigns.map(
                  (
                    item
                  ) => (

                    <CampaignCard
                      key={
                        item.testerCampaignId
                      }
                      item={
                        item
                      }
                    />

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

// ============================================================
// CAMPAIGN CARD
// ============================================================

function CampaignCard({
  item,
}: {
  item:
    TesterCampaign;
}) {
  return (
    <div className="border rounded-3 p-3">

      <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">

        <div className="d-flex gap-3">

          <div
            className="border rounded bg-light overflow-hidden flex-shrink-0"
            style={{
              width: 70,
              height: 70,
            }}
          >

            {item.campaign
              .productImage ? (

              <img
                src={
                  item.campaign
                    .productImage
                }
                alt={
                  item.campaign
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

              <div className="w-100 h-100 d-flex align-items-center justify-content-center">

                <i className="bi bi-image text-muted" />

              </div>

            )}

          </div>

          <div>

            <h6 className="fw-bold mb-1">

              {
                item.campaign
                  .productName
              }

            </h6>

            <div className="small text-muted">

              {
                item.campaign
                  .campaignCode
              }

            </div>

            <div className="small text-muted">

              Brand:{" "}

              {
                item.campaign
                  .brandName
              }

            </div>

          </div>

        </div>

        <div className="d-flex align-items-start gap-2">

          <StatusBadge
            status={
              item.status
            }
          />

          <Link
            href={`/admin/campaigns/${item.campaign.id}/testers/${item.testerCampaignId}/tasks`}
            className="btn btn-sm btn-outline-primary"
          >

            <i className="bi bi-list-check me-1" />

            View Tasks

          </Link>

        </div>

      </div>

      {/* PROGRESS */}

      <div className="mt-3">

        <div className="d-flex justify-content-between small mb-1">

          <span className="text-muted">

            {
              item.progress
                .approvedTasks
            }

            {" / "}

            {
              item.progress
                .totalTasks
            }

            {" tasks approved"}

          </span>

          <strong>

            {
              item.progress
                .percentage
            }
            %

          </strong>

        </div>

        <div
          className="progress"
          style={{
            height: 7,
          }}
        >

          <div
            className="progress-bar"
            style={{
              width:
                `${item.progress.percentage}%`,
            }}
          />

        </div>

      </div>

      {/* TASK SUMMARY */}

      <div className="table-responsive mt-3">

        <table className="table table-sm align-middle mb-0">

          <thead className="table-light">

            <tr>

              <th>
                Task
              </th>

              <th>
                Status
              </th>

              <th>
                Attempts
              </th>

              <th>
                Submitted
              </th>

              <th>
                Approved
              </th>

            </tr>

          </thead>

          <tbody>

            {item.tasks.map(
              (
                task
              ) => (

                <tr
                  key={
                    task.id
                  }
                >

                  <td>

                    <strong>

                      Task{" "}

                      {
                        task.taskNumber
                      }

                    </strong>

                    <div className="small text-muted">

                      {
                        task.title
                      }

                    </div>

                  </td>

                  <td>

                    <StatusBadge
                      status={
                        task.status
                      }
                    />

                  </td>

                  <td>

                    {
                      task.totalAttempts
                    }

                  </td>

                  <td>

                    {
                      formatDateTime(
                        task.submittedAt
                      )
                    }

                  </td>

                  <td>

                    {
                      formatDateTime(
                        task.approvedAt
                      )
                    }

                  </td>

                </tr>

              )
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

// ============================================================
// SUMMARY
// ============================================================

function SummaryCard({
  title,
  value,
}: {
  title: string;

  value: number;
}) {
  return (
    <div className="col-lg-3 col-md-6">

      <div className="card border-0 shadow-sm h-100">

        <div className="card-body">

          <div className="text-muted small">

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
// INFO
// ============================================================

function InfoRow({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div className="d-flex justify-content-between gap-3 border-bottom py-2">

      <span className="text-muted">

        {
          label
        }

      </span>

      <span className="fw-semibold text-end">

        {
          value
        }

      </span>

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
    case "ACTIVE":
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

    case "ONGOING":
    case "AVAILABLE":
      className =
        "bg-primary";
      break;

    case "REJECTED":
    case "CANCELLED":
    case "SUSPENDED":
      className =
        "bg-danger";
      break;

    case "LOCKED":
    case "INACTIVE":
      className =
        "bg-secondary";
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
// DATE
// ============================================================

function formatDateTime(
  value:
    | string
    | null
    | undefined
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