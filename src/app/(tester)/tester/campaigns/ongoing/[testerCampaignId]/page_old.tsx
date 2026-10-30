"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useParams } from "next/navigation";

type TaskStatus =
  | "LOCKED"
  | "AVAILABLE"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED";

type SubmissionStatus =
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED";

type TaskProgress = {
  id: number;
  taskNumber: number;
  title: string;

  status: TaskStatus;

  unlockedAt: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;

  rejectionReason: string | null;

  totalAttempts: number;

  latestSubmission: {
    id: number;
    attemptNumber: number;
    status: SubmissionStatus;
    submittedAt: string;
    reviewedAt: string | null;
    rejectionReason: string | null;
  } | null;

  isCurrent: boolean;
  canSubmit: boolean;
  waitingForApproval: boolean;
  isCompleted: boolean;
};

type ProgressResponse = {
  success: boolean;
  message: string;

  data?: {
    testerCampaignId: number;

    campaign: {
      id: number;
      productName: string;
      productImage: string | null;
      productDescription: string | null;
      productLink: string | null;
      brandName: string | null;
      task4Required: boolean;
    };

    campaignStatus:
      | "ONGOING"
      | "COMPLETED"
      | "CANCELLED";

    currentTaskNumber: number;

    currentTask:
      | TaskProgress
      | null;

    progress: {
      approvedTasks: number;
      totalTasks: number;
      percentage: number;
    };

    earningAmount:
      | number
      | string;

    joinedAt: string;
    startedAt: string | null;
    completedAt: string | null;

    cancelledAt: string | null;
    cancellationReason: string | null;

    tasks: TaskProgress[];
  };
};

export default function TesterCampaignProgressPage() {
  const params =
    useParams<{
      testerCampaignId: string;
    }>();

  const testerCampaignId =
    Number(
      params.testerCampaignId
    );

  const [
    campaignData,
    setCampaignData,
  ] =
    useState<
      ProgressResponse["data"] | null
    >(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    now,
    setNow,
  ] = useState(
    () => new Date()
  );

  // ============================================================
  // LOAD TASK PROGRESS
  // ============================================================

  const loadProgress =
    useCallback(
      async () => {
        if (
          !Number.isInteger(
            testerCampaignId
          ) ||
          testerCampaignId <= 0
        ) {
          setError(
            "Invalid tester campaign."
          );

          setLoading(false);

          return;
        }

        try {
          setLoading(true);
          setError("");

          const response =
            await fetch(
              `/api/tester/campaigns/ongoing/${testerCampaignId}/progress`,
              {
                method: "GET",
                cache: "no-store",
              }
            );

          const result =
            (await response.json()) as
              ProgressResponse;

          if (!response.ok) {
            throw new Error(
              result.message ||
                "Unable to load campaign progress."
            );
          }

          setCampaignData(
            result.data ?? null
          );
        } catch (err) {
          console.error(
            "Campaign progress error:",
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load campaign progress."
          );
        } finally {
          setLoading(false);
        }
      },
      [testerCampaignId]
    );

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // ============================================================
  // INFORMATIONAL TASK COUNTDOWN
  //
  // Countdown starts from campaign assignment time.
  // startedAt is preferred. joinedAt is used as fallback.
  //
  // IMPORTANT:
  // Reaching 0 does NOT block, stop, reject, or lock a task.
  // This is informational only.
  // ============================================================

  useEffect(() => {
    const timer =
      window.setInterval(
        () => {
          setNow(
            new Date()
          );
        },
        60 * 1000
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, []);

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
              Loading campaign progress...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (
    error ||
    !campaignData
  ) {
    return (
      <div className="col-12">
        <div className="alert alert-danger border-0 shadow-sm">
          <i className="bi bi-exclamation-circle me-2"></i>

          {error ||
            "Campaign information not found."}
        </div>

        <Link
          href="/tester/campaigns/ongoing"
          className="btn btn-outline-primary"
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back to Ongoing Campaigns
        </Link>
      </div>
    );
  }

  const {
    campaign,
    currentTask,
    progress,
    tasks,
  } = campaignData;

  // ============================================================
  // CAMPAIGN ASSIGNMENT TIME
  // ============================================================

  const assignedAt =
    campaignData.startedAt ??
    campaignData.joinedAt;

  return (
    <>
      {/* ======================================================
          BACK
      ====================================================== */}

      <div className="col-12">
        <Link
          href="/tester/campaigns/ongoing"
          className="text-decoration-none small"
        >
          <i className="bi bi-arrow-left me-2"></i>
          Ongoing Campaigns
        </Link>
      </div>

      {/* ======================================================
          CAMPAIGN HEADER
      ====================================================== */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body">

            <div className="row g-4 align-items-center">

              <div className="col-md-auto">

                <div
                  className="rounded overflow-hidden bg-light d-flex align-items-center justify-content-center"
                  style={{
                    width: "110px",
                    height: "110px",
                  }}
                >
                  {campaign.productImage ? (
                    <img
                      src={
                        campaign.productImage
                      }
                      alt={
                        campaign.productName
                      }
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit:
                          "cover",
                      }}
                    />
                  ) : (
                    <i className="bi bi-image fs-2 text-muted"></i>
                  )}
                </div>

              </div>

              <div className="col">

                <div className="text-primary small fw-bold text-uppercase mb-1">
                  {
                    campaign.brandName ??
                    "Brand"
                  }
                </div>

                <h3 className="fw-bold mb-2">
                  {
                    campaign.productName
                  }
                </h3>

                {campaign.productDescription && (
                  <p className="text-muted mb-3">
                    {
                      campaign.productDescription
                    }
                  </p>
                )}

                <div className="d-flex flex-wrap gap-3">

                  <div>
                    <span className="text-muted small d-block">
                      Earning
                    </span>

                    <strong>
                      ₹
                      {Number(
                        campaignData.earningAmount
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>

                  <div>
                    <span className="text-muted small d-block">
                      Tasks
                    </span>

                    <strong>
                      {
                        progress.totalTasks
                      }
                    </strong>
                  </div>

                  <div>
                    <span className="text-muted small d-block">
                      Status
                    </span>

                    <strong>
                      {
                        campaignData.campaignStatus
                      }
                    </strong>
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          PROGRESS
      ====================================================== */}

      <div className="col-lg-4">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-body">

            <h5 className="fw-bold mb-3">
              Campaign Progress
            </h5>

            <div className="d-flex justify-content-between mb-2">

              <span className="text-muted">
                {
                  progress.approvedTasks
                }{" "}
                of{" "}
                {
                  progress.totalTasks
                }{" "}
                tasks completed
              </span>

              <strong>
                {
                  progress.percentage
                }
                %
              </strong>

            </div>

            <div
              className="progress"
              style={{
                height: "9px",
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

        </div>

      </div>

      {/* ======================================================
          CURRENT TASK
      ====================================================== */}

      <div className="col-lg-8">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-body">

            <div className="d-flex justify-content-between align-items-start gap-3">

              <div>

                <div className="text-muted small mb-1">
                  Current Task
                </div>

                {currentTask ? (
                  <>
                    <h5 className="fw-bold mb-1">
                      Task{" "}
                      {
                        currentTask.taskNumber
                      }
                      :{" "}
                      {
                        currentTask.title
                      }
                    </h5>

                    <span
                      className={`badge ${getTaskBadgeClass(
                        currentTask.status
                      )}`}
                    >
                      {
                        currentTask.status
                      }
                    </span>
                  </>
                ) : (
                  <h5>
                    No current task
                  </h5>
                )}

              </div>

              {currentTask &&
                currentTask.canSubmit && (

                <Link
                  href={`/tester/campaigns/ongoing/${testerCampaignId}/tasks/${currentTask.taskNumber}`}
                  className="btn btn-primary"
                >
                  {currentTask.status ===
                  "REJECTED"
                    ? "Resubmit Task"
                    : "Start Task"}

                  <i className="bi bi-arrow-right ms-2"></i>
                </Link>

              )}

            </div>

            {/* Submitted */}

            {currentTask?.waitingForApproval && (

              <div className="alert alert-warning mt-3 mb-0">

                <i className="bi bi-clock me-2"></i>

                Your Task{" "}
                {
                  currentTask.taskNumber
                }{" "}
                submission is waiting for review.

                {currentTask.latestSubmission && (
                  <div className="small mt-1">
                    Attempt #
                    {
                      currentTask
                        .latestSubmission
                        .attemptNumber
                    }
                  </div>
                )}

              </div>

            )}

            {/* Rejected */}

            {currentTask?.status ===
              "REJECTED" && (

              <div className="alert alert-danger mt-3 mb-0">

                <strong>
                  Task rejected
                </strong>

                <div className="mt-1">
                  {
                    currentTask.rejectionReason ||
                    currentTask.latestSubmission
                      ?.rejectionReason ||
                    "Please correct the submission and try again."
                  }
                </div>

              </div>

            )}

          </div>

        </div>

      </div>

      {/* ======================================================
          ALL TASKS
      ====================================================== */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-header bg-white border-0 pt-4 px-4">

            <h5 className="fw-bold mb-1">
              Campaign Tasks
            </h5>

            <p className="text-muted small mb-0">
              Complete each task in sequence.
            </p>

          </div>

          <div className="card-body px-4">

            <div className="d-flex flex-column gap-3">

              {tasks.map(
                (task) => (

                  <div
                    key={task.id}
                    className={`border rounded-3 p-3 ${
                      task.isCurrent
                        ? "border-primary"
                        : ""
                    }`}
                  >

                    <div className="d-flex justify-content-between align-items-start gap-3">

                      <div className="d-flex gap-3">

                        <div
                          className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${getTaskCircleClass(
                            task.status
                          )}`}
                          style={{
                            width:
                              "42px",
                            height:
                              "42px",
                          }}
                        >
                          {task.status ===
                          "APPROVED" ? (
                            <i className="bi bi-check-lg"></i>
                          ) : (
                            task.taskNumber
                          )}
                        </div>

                        <div>

                          <div className="fw-bold">
                            Task{" "}
                            {
                              task.taskNumber
                            }
                          </div>

                          <div className="text-muted small">
                            {
                              task.title
                            }
                          </div>

                          {task.totalAttempts >
                            0 && (
                            <div className="small text-muted mt-1">
                              Attempts:{" "}
                              {
                                task.totalAttempts
                              }
                            </div>
                          )}

                          {/* ==================================
                              INFORMATIONAL TIME LEFT
                          ================================== */}

                          {task.status !==
                            "APPROVED" && (

                            <div className="small mt-2">

                              <i className="bi bi-clock-history me-1 text-primary"></i>

                              <span className="text-muted">
                                Time left:{" "}
                              </span>

                              <strong>
                                {formatTaskTimeLeft(
                                  assignedAt,
                                  task.taskNumber,
                                  now
                                )}
                              </strong>

                            </div>

                          )}

                        </div>

                      </div>

                      <span
                        className={`badge ${getTaskBadgeClass(
                          task.status
                        )}`}
                      >
                        {
                          task.status
                        }
                      </span>

                    </div>

                    {task.status ===
                      "REJECTED" &&
                      task.rejectionReason && (

                      <div className="small text-danger mt-2">
                        <i className="bi bi-exclamation-circle me-1"></i>

                        {
                          task.rejectionReason
                        }
                      </div>

                    )}

                  </div>

                )
              )}

            </div>

          </div>

        </div>

      </div>
    </>
  );
}


// ============================================================
// TASK TIMELINE
// ============================================================
//
// Cumulative timeline from campaign assignment:
//
// Task 1:
// assignment + 2 days
//
// Task 2:
// assignment + 2 + 5 = 7 days
//
// Task 3:
// assignment + 2 + 5 + 3 = 10 days
//
// Task 4:
// assignment + 2 + 5 + 3 + 5 = 15 days
//
// IMPORTANT:
// This countdown is information only.
// It does NOT affect task status or task submission.
// ============================================================

const TASK_DEADLINE_DAYS_FROM_ASSIGNMENT:
  Record<number, number> = {
    1: 2,

    2: 7,

    3: 10,

    4: 15,
  };


// ============================================================
// FORMAT TASK TIME LEFT
// ============================================================

function formatTaskTimeLeft(
  assignedAt:
    | string
    | null,
  taskNumber: number,
  now: Date
) {
  if (!assignedAt) {
    return "-";
  }

  const assignedDate =
    new Date(
      assignedAt
    );

  if (
    Number.isNaN(
      assignedDate.getTime()
    )
  ) {
    return "-";
  }

  const deadlineDays =
    TASK_DEADLINE_DAYS_FROM_ASSIGNMENT[
      taskNumber
    ];

  if (!deadlineDays) {
    return "-";
  }

  // ==========================================================
  // TASK DEADLINE
  // ==========================================================

  const deadline =
    new Date(
      assignedDate.getTime() +
        deadlineDays *
          24 *
          60 *
          60 *
          1000
    );

  const remainingMs =
    deadline.getTime() -
    now.getTime();

  // ==========================================================
  // TIME EXPIRED
  //
  // Do NOT stop the task.
  // Simply show zero.
  // ==========================================================

  if (
    remainingMs <= 0
  ) {
    return "0 Days 0 hours";
  }

  // ==========================================================
  // CONVERT TO DAYS + HOURS
  // ==========================================================

  const totalHours =
    Math.ceil(
      remainingMs /
        (
          60 *
          60 *
          1000
        )
    );

  const days =
    Math.floor(
      totalHours /
        24
    );

  const hours =
    totalHours %
    24;

  return `${days} Days ${hours} hours`;
}


// ============================================================
// HELPERS
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


function getTaskCircleClass(
  status: TaskStatus
) {
  switch (status) {
    case "APPROVED":
      return "bg-success text-white";

    case "AVAILABLE":
      return "bg-primary text-white";

    case "SUBMITTED":
      return "bg-warning text-dark";

    case "REJECTED":
      return "bg-danger text-white";

    default:
      return "bg-light text-muted";
  }
}