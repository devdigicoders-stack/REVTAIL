"use client";

import Link from "next/link";
import Task4ApprovalHistory from "@/components/tester/Task4ApprovalHistory";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

type TaskStatus =
  | "LOCKED"
  | "AVAILABLE"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED";

type CampaignTask = {
  id: number;
  taskNumber: number;
  title: string;
  status: TaskStatus;

  unlockedAt: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;

  rejectionReason: string | null;
};

type OngoingCampaign = {
  testerCampaignId: number;

  status: "ONGOING";

  currentTask: number;

  earningAmount:
    | string
    | number;

  joinedAt: string;
  startedAt: string | null;

  campaign: {
    id: number;

    productName: string;

    productImage:
      | string
      | null;

    productDescription:
      | string
      | null;

    productLink:
      | string
      | null;

    brandName:
      | string
      | null;

    startDate: string;
    endDate: string;

    task4Required: boolean;

    availableSlots: number;
  };

  currentTaskData:
    | CampaignTask
    | null;

  tasks: CampaignTask[];

  canCancel: boolean;
};

type OngoingCampaignResponse = {
  success: boolean;

  message: string;

  data?: {
    tester: {
      id: number;
      fullName: string;
    };

    totalCampaigns: number;

    campaigns:
      OngoingCampaign[];
  };
};

export default function OngoingCampaignsPage() {
  // ============================================================
  // STATE
  // ============================================================

  const [
    campaigns,
    setCampaigns,
  ] =
    useState<
      OngoingCampaign[]
    >([]);

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

  const [
    actionMessage,
    setActionMessage,
  ] =
    useState("");

  const [
    cancellingId,
    setCancellingId,
  ] =
    useState<
      number | null
    >(null);

  // ============================================================
  // LOAD ONGOING CAMPAIGNS
  // ============================================================

  const loadCampaigns =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await fetch(
              "/api/tester/campaigns/ongoing",
              {
                method:
                  "GET",

                cache:
                  "no-store",
              }
            );

          const result =
            (await response.json()) as
              OngoingCampaignResponse;

          if (!response.ok) {
            throw new Error(
              result.message ||
                "Unable to load ongoing campaigns."
            );
          }

          setCampaigns(
            result.data
              ?.campaigns ??
              []
          );

          setTesterName(
            result.data
              ?.tester
              .fullName ??
              ""
          );
        } catch (err) {
          console.error(
            "Load ongoing campaigns error:",
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load ongoing campaigns."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      []
    );

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadCampaigns();
  }, [
    loadCampaigns,
  ]);

  // ============================================================
  // CANCEL CAMPAIGN
  // ============================================================

  async function handleCancel(
    testerCampaignId: number
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to cancel this campaign? You can cancel only before submitting Task 1."
      );

    if (!confirmed) {
      return;
    }

    const reason =
      window.prompt(
        "Cancellation reason (optional):"
      );

    try {
      setCancellingId(
        testerCampaignId
      );

      setError("");
      setActionMessage("");

      /*
       * NOTE:
       *
       * Your cancellation API was previously
       * created with userId in the body.
       *
       * If you have already updated it to use
       * getCurrentUser(), remove userId completely
       * as done below.
       */

      const response =
        await fetch(
          `/api/tester/campaigns/ongoing/${testerCampaignId}/cancel`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                cancellationReason:
                  reason?.trim() ||
                  null,
              }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to cancel campaign."
        );
      }

      setActionMessage(
        "Campaign cancelled successfully."
      );

      await loadCampaigns();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to cancel campaign."
      );
    } finally {
      setCancellingId(
        null
      );
    }
  }

  // ============================================================
  // LOADING
  // ============================================================

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
              Loading ongoing campaigns...
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
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="col-12">

        <div className="tester-ongoing-page-header">

          <div>

            <h3 className="fw-bold mb-1">
              Ongoing Campaigns
            </h3>

            <p className="text-muted mb-0">
              {testerName
                ? `${testerName}, continue your active campaigns and complete your current tasks.`
                : "Continue your active campaigns and complete your current tasks."}
            </p>

          </div>

          <div className="tester-ongoing-count">

            <span>
              {
                campaigns.length
              }
            </span>

            <small>
              Active
            </small>

          </div>

        </div>

      </div>

      {/* ======================================================
          MESSAGES
      ====================================================== */}

      {actionMessage && (

        <div className="col-12">

          <div className="alert alert-success border-0 shadow-sm mb-0">

            <i className="bi bi-check-circle me-2"></i>

            {
              actionMessage
            }

          </div>

        </div>

      )}

      {error && (

        <div className="col-12">

          <div className="alert alert-danger border-0 shadow-sm mb-0">

            <i className="bi bi-exclamation-circle me-2"></i>

            {error}

          </div>

        </div>

      )}

      {/* ======================================================
          EMPTY
      ====================================================== */}

      {!error &&
        campaigns.length ===
          0 && (

        <div className="col-12">

          <div className="card border-0 shadow-sm">

            <div className="card-body text-center py-5">

              <div className="tester-empty-icon">

                <i className="bi bi-hourglass-split"></i>

              </div>

              <h5 className="fw-bold mt-3">
                No ongoing campaigns
              </h5>

              <p className="text-muted">
                Once your campaign application
                is approved, it will appear
                here.
              </p>

              <Link
                href="/tester/campaigns/live"
                className="btn btn-primary"
              >
                Browse Live Campaigns
              </Link>

            </div>

          </div>

        </div>

      )}

      {/* ======================================================
          DESKTOP VIEW
      ====================================================== */}

      {campaigns.length >
        0 && (

        <div className="col-12 d-none d-md-block">

          <div className="card border-0 shadow-sm tester-ongoing-desktop-table">

            <div className="card-body p-0">

              <div className="table-responsive">

                <table className="table align-middle mb-0">

                  <thead>

                    <tr>

                      <th>
                        Campaign
                      </th>

                      <th>
                        Current Task
                      </th>

                      <th>
                        Progress
                      </th>

                      <th>
                        Earning
                      </th>

                      <th>
                        Status
                      </th>

                      <th className="text-end">
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {campaigns.map(
                      (
                        testerCampaign
                      ) => {

                        const progress =
                          calculateProgress(
                            testerCampaign.tasks
                          );

                        return (
                          <tr
                            key={
                              testerCampaign
                                .testerCampaignId
                            }
                          >

                            {/* Campaign */}

                            <td>

                              <div className="d-flex align-items-center gap-3">

                                <div className="tester-ongoing-table-image">

                                  {testerCampaign
                                    .campaign
                                    .productImage ? (

                                    <img
                                      src={
                                        testerCampaign
                                          .campaign
                                          .productImage
                                      }
                                      alt={
                                        testerCampaign
                                          .campaign
                                          .productName
                                      }
                                    />

                                  ) : (

                                    <i className="bi bi-image"></i>

                                  )}

                                </div>

                                <div>

                                  <div className="fw-bold">

                                    {
                                      testerCampaign
                                        .campaign
                                        .productName
                                    }

                                  </div>

                                  <div className="small text-muted">

                                    {
                                      testerCampaign
                                        .campaign
                                        .brandName ??
                                      "Brand"
                                    }

                                  </div>

                                </div>

                              </div>

                            </td>

                            {/* Current Task */}

                            <td>

                              {testerCampaign.currentTaskData ? (

                                <>

                                  <div className="fw-semibold">

                                    Task{" "}
                                    {
                                      testerCampaign
                                        .currentTaskData
                                        .taskNumber
                                    }

                                  </div>

                                  <div className="small text-muted">

                                    {
                                      testerCampaign
                                        .currentTaskData
                                        .title
                                    }

                                  </div>

                                </>

                              ) : (

                                "-"

                              )}

                            </td>

                            {/* Progress */}

                            <td>

                              <div className="tester-ongoing-progress-cell">

                                <div className="d-flex justify-content-between small mb-1">

                                  <span>
                                    {
                                      progress.approved
                                    }
                                    /
                                    {
                                      progress.total
                                    }
                                  </span>

                                  <span>
                                    {
                                      progress.percentage
                                    }
                                    %
                                  </span>

                                </div>

                                <div
                                  className="progress"
                                  style={{
                                    height:
                                      "6px",
                                  }}
                                >

                                  <div
                                    className="progress-bar"
                                    style={{
                                      width:
                                        `${progress.percentage}%`,
                                    }}
                                  />

                                </div>

                              </div>

                            </td>

                            {/* Earning */}

                            <td>

                              <strong>

                                ₹
                                {Number(
                                  testerCampaign
                                    .earningAmount
                                ).toLocaleString(
                                  "en-IN"
                                )}

                              </strong>

                            </td>

                            {/* Status */}

                            <td>

                              {testerCampaign.currentTaskData ? (

                                <span
                                  className={`badge ${getTaskBadgeClass(
                                    testerCampaign
                                      .currentTaskData
                                      .status
                                  )}`}
                                >

                                  {
                                    testerCampaign
                                      .currentTaskData
                                      .status
                                  }

                                </span>

                              ) : (

                                <span className="badge bg-secondary">
                                  UNKNOWN
                                </span>

                              )}

                            </td>

                            {/* Actions */}

                            <td className="text-end">

                              <div className="d-flex justify-content-end gap-2">

                                <Link
                                  href={`/tester/campaigns/ongoing/${testerCampaign.testerCampaignId}`}
                                  className="btn btn-sm btn-primary"
                                >
                                  Continue
                                </Link>

                                {testerCampaign.canCancel && (

                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    disabled={
                                      cancellingId ===
                                      testerCampaign
                                        .testerCampaignId
                                    }
                                    onClick={() =>
                                      handleCancel(
                                        testerCampaign
                                          .testerCampaignId
                                      )
                                    }
                                  >

                                    {cancellingId ===
                                    testerCampaign
                                      .testerCampaignId
                                      ? "Cancelling..."
                                      : "Cancel"}

                                  </button>

                                )}

                              </div>

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* ======================================================
          MOBILE APP VIEW
      ====================================================== */}

      {campaigns.length >
        0 && (

        <div className="col-12 d-md-none">

          <div className="tester-ongoing-mobile-list">

            {campaigns.map(
              (
                testerCampaign
              ) => {

                const currentTask =
                  testerCampaign.currentTaskData;

                const progress =
                  calculateProgress(
                    testerCampaign.tasks
                  );

                return (
                  <div
                    key={
                      testerCampaign
                        .testerCampaignId
                    }
                    className="tester-ongoing-mobile-card"
                  >

                    {/* ------------------------------------------
                        CAMPAIGN
                    ------------------------------------------ */}

                    <div className="tester-ongoing-mobile-top">

                      <div className="tester-ongoing-mobile-image">

                        {testerCampaign
                          .campaign
                          .productImage ? (

                          <img
                            src={
                              testerCampaign
                                .campaign
                                .productImage
                            }
                            alt={
                              testerCampaign
                                .campaign
                                .productName
                            }
                          />

                        ) : (

                          <div className="tester-campaign-image-placeholder">

                            <i className="bi bi-image"></i>

                          </div>

                        )}

                      </div>

                      <div className="tester-ongoing-mobile-info">

                        <div className="tester-campaign-brand">

                          {
                            testerCampaign
                              .campaign
                              .brandName ??
                            "Brand"
                          }

                        </div>

                        <h6>

                          {
                            testerCampaign
                              .campaign
                              .productName
                          }

                        </h6>

                        <div className="tester-ongoing-earning">

                          Earn{" "}

                          <strong>

                            ₹
                            {Number(
                              testerCampaign
                                .earningAmount
                            ).toLocaleString(
                              "en-IN"
                            )}

                          </strong>

                        </div>

                      </div>

                    </div>

                    {/* ------------------------------------------
                        CURRENT TASK
                    ------------------------------------------ */}

                    <div className="tester-current-task-box">

                      <div className="tester-current-task-header">

                        <div>

                          <span className="tester-current-task-label">
                            Current Task
                          </span>

                          <strong>

                            {currentTask
                              ? `Task ${currentTask.taskNumber}`
                              : "-"}

                          </strong>

                        </div>

                        {currentTask && (

                          <span
                            className={`badge ${getTaskBadgeClass(
                              currentTask.status
                            )}`}
                          >

                            {
                              currentTask.status
                            }

                          </span>

                        )}

                      </div>

                      {currentTask && (

                        <div className="tester-current-task-title">

                          {
                            currentTask.title
                          }

                        </div>

                      )}

                      {currentTask?.taskNumber === 1 &&
                        testerCampaign.currentTask === 1 &&
                        testerCampaign.campaign.productLink && (

                        <a
                          href={testerCampaign.campaign.productLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 mt-2"
                        >
                          Buy Now
                          <i className="bi bi-box-arrow-up-right"></i>
                        </a>

                      )}

                      {currentTask?.status ===
                        "REJECTED" &&
                        currentTask.rejectionReason && (

                        <div className="tester-current-task-rejection">

                          <i className="bi bi-exclamation-circle me-1"></i>

                          {
                            currentTask.rejectionReason
                          }

                        </div>

                      )}

                    </div>

                    {/* ------------------------------------------
                        PROGRESS
                    ------------------------------------------ */}

                    <div className="tester-ongoing-mobile-progress">

                      <div className="d-flex justify-content-between">

                        <span>
                          Campaign Progress
                        </span>

                        <strong>
                          {
                            progress.percentage
                          }
                          %
                        </strong>

                      </div>

                      <div
                        className="progress mt-2"
                        style={{
                          height:
                            "7px",
                        }}
                      >

                        <div
                          className="progress-bar"
                          style={{
                            width:
                              `${progress.percentage}%`,
                          }}
                        />

                      </div>

                      <small>

                        {
                          progress.approved
                        }{" "}
                        of{" "}
                        {
                          progress.total
                        }{" "}
                        tasks completed

                      </small>

                    </div>

                    {/* ------------------------------------------
                        ACTION
                    ------------------------------------------ */}

                    <div className="tester-ongoing-mobile-actions">

                      <Link
                        href={`/tester/campaigns/ongoing/${testerCampaign.testerCampaignId}`}
                        className="btn btn-primary flex-grow-1"
                      >

                        {getActionText(
                          currentTask
                            ?.status ??
                          null
                        )}

                        <i className="bi bi-arrow-right ms-2"></i>

                      </Link>

                      {testerCampaign.canCancel && (

                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          disabled={
                            cancellingId ===
                            testerCampaign
                              .testerCampaignId
                          }
                          onClick={() =>
                            handleCancel(
                              testerCampaign
                                .testerCampaignId
                            )
                          }
                        >

                          {cancellingId ===
                          testerCampaign
                            .testerCampaignId ? (
                            <span className="spinner-border spinner-border-sm" />
                          ) : (
                            <i className="bi bi-x-lg"></i>
                          )}

                        </button>

                      )}

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </div>

      )}
    </>
  );
}


// ============================================================
// PROGRESS
// ============================================================

function calculateProgress(
  tasks: CampaignTask[]
) {
  const total =
    tasks.length;

  const approved =
    tasks.filter(
      (task) =>
        task.status ===
        "APPROVED"
    ).length;

  const percentage =
    total > 0
      ? Math.round(
          (approved /
            total) *
            100
        )
      : 0;

  return {
    total,
    approved,
    percentage,
  };
}


// ============================================================
// STATUS BADGE
// ============================================================

function getTaskBadgeClass(
  status: TaskStatus
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
// ACTION LABEL
// ============================================================

function getActionText(
  status: TaskStatus | null
) {
  switch (status) {
    case "AVAILABLE":
      return "Start Task";

    case "REJECTED":
      return "Resubmit Task";

    case "SUBMITTED":
      return "View Submission";

    case "APPROVED":
      return "View Campaign";

    default:
      return "Open Campaign";
  }
}