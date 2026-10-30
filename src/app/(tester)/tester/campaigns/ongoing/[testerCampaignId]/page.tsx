"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "next/navigation";

// ============================================================
// TYPES
// ============================================================

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

  totalAttempts:
    number;

  latestSubmission: {
    id: number;

    attemptNumber:
      number;

    status:
      SubmissionStatus;

    submittedAt:
      string;

    reviewedAt:
      | string
      | null;

    rejectionReason:
      | string
      | null;
  } | null;

  isCurrent:
    boolean;

  canSubmit:
    boolean;

  waitingForApproval:
    boolean;

  isCompleted:
    boolean;
};

type ProgressResponse = {
  success: boolean;

  message: string;

  data?: {
    testerCampaignId:
      number;

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

      productLink:
        | string
        | null;

      brandName:
        | string
        | null;

      task4Required:
        boolean;
    };

    campaignStatus:
      | "ONGOING"
      | "COMPLETED"
      | "CANCELLED";

    currentTaskNumber:
      number;

    currentTask:
      | TaskProgress
      | null;

    progress: {
      approvedTasks:
        number;

      totalTasks:
        number;

      percentage:
        number;
    };

    earningAmount:
      | number
      | string;

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

    tasks:
      TaskProgress[];
  };
};

// ============================================================
// PAGE
// ============================================================

export default function TesterCampaignProgressPage() {
  const params =
    useParams<{
      testerCampaignId:
        string;
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
  ] =
    useState(
      true
    );

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );

  const [
    now,
    setNow,
  ] =
    useState(
      () =>
        new Date()
    );

  // ============================================================
  // LOAD CAMPAIGN PROGRESS
  // ============================================================

  const loadProgress =
    useCallback(
      async () => {
        if (
          !Number.isInteger(
            testerCampaignId
          ) ||
          testerCampaignId <=
            0
        ) {
          setError(
            "Invalid tester campaign."
          );

          setLoading(
            false
          );

          return;
        }

        try {
          setLoading(
            true
          );

          setError(
            ""
          );

          const response =
            await fetch(
              `/api/tester/campaigns/ongoing/${testerCampaignId}/progress`,
              {
                method:
                  "GET",

                cache:
                  "no-store",
              }
            );

          const result =
            (await response.json()) as
              ProgressResponse;

          if (
            !response.ok
          ) {
            throw new Error(
              result.message ||
                "Unable to load campaign progress."
            );
          }

          setCampaignData(
            result.data ??
              null
          );
        } catch (err) {
          console.error(
            "Campaign progress error:",
            err
          );

          setError(
            err instanceof
              Error
              ? err.message
              : "Unable to load campaign progress."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        testerCampaignId,
      ]
    );

  useEffect(() => {
    loadProgress();
  }, [
    loadProgress,
  ]);

  // ============================================================
  // INFORMATIONAL COUNTDOWN
  // ============================================================

  useEffect(() => {
    const timer =
      window.setInterval(
        () => {
          setNow(
            new Date()
          );
        },
        60 *
          1000
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

  if (
    loading
  ) {
    return (
      <div className="col-12">

        <div className="text-center py-5">

          <div
            className="spinner-border text-primary"
            role="status"
          />

          <div className="text-muted small mt-3">
            Loading campaign...
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

          {
            error ||
            "Campaign information not found."
          }

        </div>

        <Link
          href="/tester/campaigns/ongoing"
          className="btn btn-outline-primary btn-sm"
        >
          <i className="bi bi-arrow-left me-2"></i>

          Back to Ongoing Campaigns
        </Link>

      </div>
    );
  }

  const {
    campaign,
    progress,
    tasks,
  } =
    campaignData;


  return (
    <>

      {/* ======================================================
          BACK
      ====================================================== */}

      <div className="col-12">

        <Link
          href="/tester/campaigns/ongoing"
          className="text-decoration-none small d-inline-flex align-items-center"
        >
          <i className="bi bi-chevron-left me-1"></i>

          Ongoing Campaigns
        </Link>

      </div>

      {/* ======================================================
          SINGLE MOBILE-FIRST CAMPAIGN CARD
      ====================================================== */}

      <div className="col-12">

        <div className="card border-0 shadow-sm overflow-hidden">

          {/* ==================================================
              CAMPAIGN HEADER
          ================================================== */}

          <div className="p-2 p-sm-3">

            <div className="d-flex gap-2 gap-sm-3 align-items-center">

              {/* Product Image */}

              <div
                className="rounded overflow-hidden bg-light d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width:
                    "60px",

                  height:
                    "60px",
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
                      width:
                        "100%",

                      height:
                        "100%",

                      objectFit:
                        "cover",
                    }}
                  />

                ) : (

                  <i className="bi bi-image text-muted fs-4"></i>

                )}

              </div>

              {/* Campaign Information */}

              <div
                className="flex-grow-1"
                style={{
                  minWidth:
                    0,
                }}
              >

                <div className="small text-primary fw-semibold text-truncate">

                  {
                    campaign.brandName ??
                    "Brand"
                  }

                </div>

                <div className="fw-bold text-dark text-truncate">

                  {
                    campaign.productName
                  }

                </div>

                <div className="d-flex flex-wrap align-items-center gap-2 mt-1 small">

                  <span>

                    <span className="text-muted">
                      Earn:
                    </span>{" "}

                    <strong className="text-success">
                      ₹
                      {Number(
                        campaignData.earningAmount
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </strong>

                  </span>

                  <span className="text-muted">
                    •
                  </span>

                  <span>

                    <span className="text-muted">
                      Tasks:
                    </span>{" "}

                    <strong>
                      {
                        progress.totalTasks
                      }
                    </strong>

                  </span>

                  <span className="text-muted">
                    •
                  </span>

                  <span
                    className={`fw-semibold ${getCampaignStatusClass(
                      campaignData.campaignStatus
                    )}`}
                  >

                    {
                      formatCampaignStatus(
                        campaignData.campaignStatus
                      )
                    }

                  </span>

                </div>

              </div>

            </div>

            {/* Product Description */}

            {/* {campaign.productDescription && (

              <div
                className="small text-muted mt-2 text-truncate"
                title={
                  campaign.productDescription
                }
              >

                {
                  campaign.productDescription
                }

              </div>

            )} */}

          </div>

          {/* ==================================================
              TASKS
          ================================================== */}

          <div>

            {tasks.map(
              (
                task
              ) => {

                const status =
                  getTaskStatusDisplay(
                    task.status
                  );

                const rejectionReason =
                  task.rejectionReason ||
                  task
                    .latestSubmission
                    ?.rejectionReason;

                const taskDescription =
                  task.status ===
                    "REJECTED" &&
                  rejectionReason
                    ? `Reason: ${rejectionReason}`
                    : getTaskDescription(
                        task.taskNumber
                      );

                const taskUrl =
                  `/tester/campaigns/ongoing/${testerCampaignId}/tasks/${task.taskNumber}`;

                const taskCanOpen =
                  task.isCurrent &&
                  task.canSubmit;

                // Reviewed/submitted tasks open read-only submission details.
                const taskHasSubmittedDetails =
                  (task.status === "APPROVED" ||
                    task.status === "SUBMITTED") &&
                  task.latestSubmission !== null;

                const taskDetailUrl =
                  `${taskUrl}/submission`;

                const showBuyNow =
                  task.taskNumber === 1 &&
                  Boolean(campaign.productLink);

                const taskContent = (

                  <div
                    className={`px-2 px-sm-3 py-3 border-top ${
                      task.isCurrent
                        ? "bg-primary bg-opacity-10"
                        : "bg-white"
                    }`}
                  >

                    {/* ========================================
                        LINE 1
                    ======================================== */}

                    <div className="d-flex align-items-center gap-2">

                      <div
                        className={`d-flex align-items-center justify-content-center flex-shrink-0 ${getTaskIconClass(
                          task.status
                        )}`}
                        style={{
                          width:
                            "28px",

                          height:
                            "28px",

                          fontSize:
                            "1.2rem",
                        }}
                      >

                        <i
                          className={`bi ${getTaskIcon(
                            task.taskNumber
                          )}`}
                        ></i>

                      </div>

                      <div
                        className="fw-bold text-dark text-truncate flex-grow-1"
                        style={{
                          minWidth: 0,
                          ...(task.taskNumber === 1
                            ? {
                                fontSize: "clamp(0.73rem, 3.2vw, 1rem)",
                                whiteSpace: "nowrap" as const,
                              }
                            : {}),
                        }}
                      >

                       Task{" "}
                      {task.taskNumber}
                      {" : "}
                      {task.taskNumber === 4
                        ? "Publish Your Review"
                        : task.title}

                      </div>

                      {showBuyNow && campaign.productLink && (
                        <a
                          href={campaign.productLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-success btn-sm d-inline-flex align-items-center justify-content-center text-nowrap flex-shrink-0 position-relative"
                          style={{
                            zIndex: 2,
                            fontSize: "clamp(0.7rem, 3vw, 0.875rem)",
                            padding: "0.25rem 0.45rem",
                            lineHeight: 1.2,
                          }}
                        >
                          Buy Now
                        </a>
                      )}

                      {(taskCanOpen || taskHasSubmittedDetails) && (

                        <i className={`bi bi-chevron-right text-primary flex-shrink-0 ${
                          showBuyNow ? "d-none d-sm-inline" : ""
                        }`}></i>

                      )}

                    </div>

                    {/* ========================================
                        LINE 2
                    ======================================== */}

                    <div
                      className={`small mt-2 text-truncate ${
                        task.status ===
                        "REJECTED"
                          ? "text-danger"
                          : "text-dark"
                      }`}
                      title={
                        taskDescription
                      }
                    >

                      <span className="me-1">
                        →
                      </span>

                      {
                        taskDescription
                      }

                    </div>

                    {/* ========================================
                        LINE 3
                    ======================================== */}

                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2">

                      {/* Status */}

                      <div
                        className={`small fw-semibold d-inline-flex align-items-center ${status.textClass}`}
                      >

                        <i
                          className={`bi ${status.icon} me-1`}
                        ></i>

                        {
                          status.label
                        }

                      </div>

                      {/* Time */}

                      {campaignData.campaignStatus === "ONGOING" &&
                        task.isCurrent &&
                        task.canSubmit &&
                        (task.status === "AVAILABLE" ||
                          task.status === "REJECTED") &&
                        task.unlockedAt && (

                        <div className="small d-inline-flex align-items-center">

                          <i className="bi bi-clock me-1 text-warning"></i>

                          <span className="text-muted me-1">
                            Time left:
                          </span>

                          <strong className="text-dark">

                            {formatTaskTimeLeftCompact(
                              task.unlockedAt,
                              task.taskNumber,
                              now
                            )}

                          </strong>

                        </div>

                      )}

                    </div>

                  </div>
                );

                // ==================================================
                // ONLY CURRENT SUBMITTABLE TASK IS CLICKABLE
                // ==================================================

                // Task 1 has an external Buy Now link. Keep it separate
                // from the internal task link (no nested anchors).
                if (showBuyNow) {
                  return (
                    <div key={task.id} className="position-relative">
                      {taskContent}
                      {(taskCanOpen || taskHasSubmittedDetails) && (
                        <Link
                          href={taskCanOpen ? taskUrl : taskDetailUrl}
                          className="stretched-link"
                          aria-label={`View Task ${task.taskNumber}`}
                        />
                      )}
                    </div>
                  );
                }

                if (
                  taskCanOpen || taskHasSubmittedDetails
                ) {
                  return (
                    <Link
                      key={
                        task.id
                      }
                      href={
                        taskCanOpen ? taskUrl : taskDetailUrl
                      }
                      className="text-decoration-none d-block"
                    >

                      {
                        taskContent
                      }

                    </Link>
                  );
                }

                return (
                  <div
                    key={
                      task.id
                    }
                  >

                    {
                      taskContent
                    }

                  </div>
                );
              }
            )}

          </div>

          {/* ==================================================
              TASK COMPLETION PROGRESS
              MOVED TO BOTTOM
          ================================================== */}

          <div className="border-top px-2 px-sm-3 py-3 bg-light">

            <div className="d-flex align-items-center justify-content-between gap-2 mb-1">

              <div className="small">

                <span className="text-muted">
                  Task Completed:
                </span>{" "}

                <strong>

                  {
                    progress.approvedTasks
                  }
                  /
                  {
                    progress.totalTasks
                  }

                </strong>

              </div>

              <strong className="small text-primary">

                {
                  progress.percentage
                }
                %

              </strong>

            </div>

            <div
              className="progress"
              style={{
                height:
                  "5px",
              }}
            >

              <div
                className="progress-bar"
                role="progressbar"
                style={{
                  width:
                    `${progress.percentage}%`,
                }}
                aria-valuenow={
                  progress.percentage
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

        </div>

      </div>

      {/* ======================================================
          COMPACT TASK STATUS MESSAGE
      ====================================================== */}

      {campaignData.currentTask?.waitingForApproval && (

        <div className="col-12">

          <div className="alert alert-warning py-2 px-3 mb-0 small">

            <i className="bi bi-hourglass-split me-2"></i>

            Task{" "}
            {
              campaignData
                .currentTask
                .taskNumber
            }{" "}
            is submitted and waiting for review.

          </div>

        </div>

      )}

      {campaignData.currentTask?.status ===
        "REJECTED" && (

        <div className="col-12">

          <div className="alert alert-danger py-2 px-3 mb-0 small">

            <i className="bi bi-exclamation-circle me-2"></i>

            <strong>
              Task{" "}
              {
                campaignData
                  .currentTask
                  .taskNumber
              }{" "}
              rejected.
            </strong>{" "}

            {
              campaignData
                .currentTask
                .rejectionReason ||
              campaignData
                .currentTask
                .latestSubmission
                ?.rejectionReason ||
              "Please correct the submission and try again."
            }

          </div>

        </div>

      )}

    </>
  );
}

// ============================================================
// TASK TIMELINE
// ============================================================

const TASK_DURATION_DAYS:
  Record<
    number,
    number
  > = {
    1:
      2,

    2:
      5,

    3:
      3,

    4:
      5,
  };

// ============================================================
// COMPACT TIME LEFT
// ============================================================

function formatTaskTimeLeftCompact(
  unlockedAt:
    | string
    | null,
  taskNumber:
    number,
  now:
    Date
) {
  if (
    !unlockedAt
  ) {
    return "-";
  }

  const unlockedDate =
    new Date(
      unlockedAt
    );

  if (
    Number.isNaN(
      unlockedDate.getTime()
    )
  ) {
    return "-";
  }

  const deadlineDays =
    TASK_DURATION_DAYS[
      taskNumber
    ];

  if (
    !deadlineDays
  ) {
    return "-";
  }

  const deadline =
    new Date(
      unlockedDate.getTime() +
        deadlineDays *
          24 *
          60 *
          60 *
          1000
    );

  const remainingMs =
    deadline.getTime() -
    now.getTime();

  if (
    remainingMs <=
    0
  ) {
    return "0d 0h";
  }

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

  return `${days}d ${hours}h`;
}

// ============================================================
// TASK DESCRIPTION
// ============================================================

function getTaskDescription(
  taskNumber:
    number
) {
  switch (
    taskNumber
  ) {
    case 1:
      return "Buy the product and submit your order details and purchase proof.";

    case 2:
      return "Upload a clear image after receiving the product.";

    case 3:
      return "Share your product review, rating and questionnaire feedback.";

    case 4:
      return "Publish the approved review and submit the review URL and proof.";

    default:
      return `Complete Task ${taskNumber} requirements.`;
  }
}

// ============================================================
// TASK ICON
// ============================================================

function getTaskIcon(
  taskNumber:
    number
) {
  switch (
    taskNumber
  ) {
    case 1:
      return "bi-bag-check";

    case 2:
      return "bi-box-seam";

    case 3:
      return "bi-pencil-square";

    case 4:
      return "bi-send-check";

    default:
      return "bi-clipboard-check";
  }
}

// ============================================================
// TASK ICON COLOR
// ============================================================

function getTaskIconClass(
  status:
    TaskStatus
) {
  switch (
    status
  ) {
    case "APPROVED":
      return "text-success";

    case "AVAILABLE":
      return "text-primary";

    case "SUBMITTED":
      return "text-warning";

    case "REJECTED":
      return "text-danger";

    case "LOCKED":
      return "text-secondary";

    default:
      return "text-secondary";
  }
}

// ============================================================
// TASK STATUS DISPLAY
// ============================================================

function getTaskStatusDisplay(
  status:
    TaskStatus
) {
  switch (
    status
  ) {
    case "APPROVED":
      return {
        label:
          "Completed",

        icon:
          "bi-check-circle-fill",

        textClass:
          "text-success",
      };

    case "AVAILABLE":
      return {
        label:
          "On going",

        icon:
          "bi-arrow-repeat",

        textClass:
          "text-primary",
      };

    case "SUBMITTED":
      return {
        label:
          "Pending Review",

        icon:
          "bi-hourglass-split",

        textClass:
          "text-warning",
      };

    case "REJECTED":
      return {
        label:
          "Resubmit",

        icon:
          "bi-exclamation-circle-fill",

        textClass:
          "text-danger",
      };

    case "LOCKED":
      return {
        label:
          "Pending",

        icon:
          "bi-lock-fill",

        textClass:
          "text-secondary",
      };

    default:
      return {
        label:
          status,

        icon:
          "bi-circle",

        textClass:
          "text-secondary",
      };
  }
}

// ============================================================
// CAMPAIGN STATUS
// ============================================================

function formatCampaignStatus(
  status:
    "ONGOING"
    | "COMPLETED"
    | "CANCELLED"
) {
  switch (
    status
  ) {
    case "ONGOING":
      return "Ongoing";

    case "COMPLETED":
      return "Completed";

    case "CANCELLED":
      return "Cancelled";

    default:
      return status;
  }
}

function getCampaignStatusClass(
  status:
    "ONGOING"
    | "COMPLETED"
    | "CANCELLED"
) {
  switch (
    status
  ) {
    case "ONGOING":
      return "text-primary";

    case "COMPLETED":
      return "text-success";

    case "CANCELLED":
      return "text-danger";

    default:
      return "text-muted";
  }
}