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

type QuestionOption = {
  id: number;

  optionText: string;

  optionOrder: number;
};

type Task3Answer = {
  id: number;

  answerText: string;

  question: {
    id: number;

    questionText:
      string;

    questionType:
      string;

    source:
      string;

    questionOrder:
      number;

    options:
      QuestionOption[];
  };
};

type Submission = {
  id: number;

  attemptNumber:
    number;

  status: string;

  submittedAt:
    string;

  reviewedAt:
    | string
    | null;

  rejectionReason:
    | string
    | null;

  task1Purchase:
    | {
        orderId:
          string;

        purchaseAmount:
          number;

        proofImage:
          string | null;
      }
    | null;

  task2Received:
    | {
        proofImage:
          string | null;
      }
    | null;

  task3Review:
    | {
        id: number;

        reviewText:
          string;

        rating:
          number;

        answers:
          Task3Answer[];
      }
    | null;

  task4Publish:
    | {
        id: number;

        publishedUrl:
          string;

        proofImage:
          string | null;
      }
    | null;
};

type Task = {
  id: number;

  taskNumber:
    number;

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

  totalAttempts:
    number;

  submissions:
    Submission[];
};

type PageData = {
  testerCampaignId:
    number;

  tester: {
    id: number;

    userId: number;

    fullName:
      string;

    profileImage:
      | string
      | null;

    gender:
      string;

    ageCategory:
      | string
      | null;

    city:
      string;

    state:
      string;

    email:
      | string
      | null;

    mobile:
      | string
      | null;
  };

  campaign: {
    id: number;

    campaignCode:
      string;

    productName:
      string;

    productImage:
      | string
      | null;

    brandName:
      string;

    status:
      string;

    task4Required:
      boolean;
  };

  testerCampaign: {
    status:
      string;

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

type ApiResponse = {
  success: boolean;

  message?: string;

  data?: PageData;
};

// ============================================================
// PAGE
// ============================================================

export default function AdminTesterCampaignTasksPage() {
  const params =
    useParams();

  const campaignId =
    Array.isArray(
      params.id
    )
      ? params.id[0]
      : params.id;

  const testerCampaignId =
    Array.isArray(
      params.testerCampaignId
    )
      ? params
          .testerCampaignId[0]
      : params.testerCampaignId;

  const [
    data,
    setData,
  ] =
    useState<PageData | null>(
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

  // ==========================================================
  // LOAD
  // ==========================================================

  const loadTaskDetails =
    useCallback(
      async () => {
        if (
          !testerCampaignId
        ) {
          setError(
            "Tester campaign ID is missing."
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

          setError("");

          const response =
            await fetch(
              `/api/admin/tester-campaigns/${testerCampaignId}/tasks`,
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
                "Unable to load task details."
            );
          }

          setData(
            result.data
          );
        } catch (err) {
          console.error(
            "ADMIN TESTER TASK DETAILS ERROR:",
            err
          );

          setError(
            err instanceof
              Error
              ? err.message
              : "Unable to load task details."
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
    loadTaskDetails();
  }, [loadTaskDetails]);

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
              Loading tester task details...
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
            "Task information not found."}

        </div>

        <Link
          href={`/admin/campaigns/${campaignId}/testers`}
          className="btn btn-outline-primary"
        >
          <i className="bi bi-arrow-left me-2" />

          Back to Campaign Testers
        </Link>

      </div>
    );
  }

  const {
    tester,
    campaign,
    testerCampaign,
    progress,
    tasks,
  } =
    data;

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
          href={`/admin/campaigns/${campaign.id}/testers`}
          className="text-decoration-none"
        >

          <i className="bi bi-arrow-left me-1" />

          Back to Campaign Testers

        </Link>

      </div>

      {/* ======================================================
          TESTER / CAMPAIGN HEADER
      ====================================================== */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body">

            <div className="d-flex flex-column flex-lg-row justify-content-between gap-4">

              <div className="d-flex align-items-center gap-3">

                <div
                  className="rounded-circle bg-light border overflow-hidden d-flex align-items-center justify-content-center"
                  style={{
                    width:
                      70,

                    height:
                      70,
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

                    <i className="bi bi-person fs-2 text-muted" />

                  )}

                </div>

                <div>

                  <h4 className="fw-bold mb-1">

                    {
                      tester.fullName
                    }

                  </h4>

                  <div className="text-muted">

                    {
                      tester.mobile ||
                      "-"
                    }

                    {tester.email
                      ? ` • ${tester.email}`
                      : ""}

                  </div>

                  <div className="small text-muted mt-1">

                    {
                      tester.city
                    }

                    {tester.state
                      ? `, ${tester.state}`
                      : ""}

                  </div>

                </div>

              </div>

              <div className="text-lg-end">

                <h5 className="fw-bold mb-1">

                  {
                    campaign.productName
                  }

                </h5>

                <div className="text-muted">

                  {
                    campaign.campaignCode
                  }

                </div>

                <div className="small text-muted">

                  {
                    campaign.brandName
                  }

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          PROGRESS
      ====================================================== */}

      <div className="col-lg-8">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-body">

            <div className="d-flex justify-content-between mb-2">

              <div>

                <h5 className="fw-bold mb-1">
                  Campaign Progress
                </h5>

                <div className="text-muted">

                  {
                    progress.approvedTasks
                  }

                  {" of "}

                  {
                    progress.totalTasks
                  }

                  {" tasks approved"}

                </div>

              </div>

              <strong className="fs-4">

                {
                  progress.percentage
                }
                %

              </strong>

            </div>

            <div
              className="progress mt-3"
              style={{
                height:
                  10,
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
          CAMPAIGN STATUS
      ====================================================== */}

      <div className="col-lg-4">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-body">

            <h5 className="fw-bold mb-3">
              Tester Campaign
            </h5>

            <InfoRow
              label="Status"
              value={
                testerCampaign.status
              }
            />

            <InfoRow
              label="Current Task"
              value={`Task ${testerCampaign.currentTask}`}
            />

            <InfoRow
              label="Earning"
              value={`₹${Number(
                testerCampaign.earningAmount
              ).toLocaleString(
                "en-IN"
              )}`}
            />

            <InfoRow
              label="Joined"
              value={
                formatDateTime(
                  testerCampaign.joinedAt
                )
              }
            />

          </div>

        </div>

      </div>

      {/* ======================================================
          TASKS
      ====================================================== */}

      <div className="col-12">

        <div className="d-flex justify-content-between align-items-center">

          <h4 className="fw-bold mb-0">
            Task Details
          </h4>

          <span className="text-muted">

            {
              tasks.length
            }

            {" task"}

            {tasks.length !==
            1
              ? "s"
              : ""}

          </span>

        </div>

      </div>

      {tasks.map(
        (
          task
        ) => (

          <div
            className="col-12"
            key={
              task.id
            }
          >

            <div className="card border-0 shadow-sm">

              <div className="card-body">

                {/* ============================================
                    TASK HEADER
                ============================================ */}

                <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-3">

                  <div>

                    <h5 className="fw-bold mb-1">

                      Task{" "}

                      {
                        task.taskNumber
                      }

                      :{" "}

                      {
                        task.title
                      }

                    </h5>

                    <div className="small text-muted">

                      Attempts:{" "}

                      {
                        task.totalAttempts
                      }

                    </div>

                  </div>

                  <StatusBadge
                    status={
                      task.status
                    }
                  />

                </div>

                {/* ============================================
                    TASK TIMING
                ============================================ */}

                <div className="row g-3 mb-3">

                  <div className="col-md-3">

                    <SmallInfo
                      label="Unlocked"
                      value={
                        formatDateTime(
                          task.unlockedAt
                        )
                      }
                    />

                  </div>

                  <div className="col-md-3">

                    <SmallInfo
                      label="Submitted"
                      value={
                        formatDateTime(
                          task.submittedAt
                        )
                      }
                    />

                  </div>

                  <div className="col-md-3">

                    <SmallInfo
                      label="Approved"
                      value={
                        formatDateTime(
                          task.approvedAt
                        )
                      }
                    />

                  </div>

                  <div className="col-md-3">

                    <SmallInfo
                      label="Rejected"
                      value={
                        formatDateTime(
                          task.rejectedAt
                        )
                      }
                    />

                  </div>

                </div>

                {task.rejectionReason && (

                  <div className="alert alert-danger py-2">

                    <strong>
                      Rejection reason:
                    </strong>{" "}

                    {
                      task.rejectionReason
                    }

                  </div>

                )}

                {/* ============================================
                    NO SUBMISSIONS
                ============================================ */}

                {task.submissions.length ===
                0 ? (

                  <div className="text-muted border rounded p-3 bg-light">

                    No submission has been made for this task yet.

                  </div>

                ) : (

                  task.submissions.map(
                    (
                      submission
                    ) => (

                      <SubmissionCard
                        key={
                          submission.id
                        }
                        taskNumber={
                          task.taskNumber
                        }
                        submission={
                          submission
                        }
                      />

                    )
                  )

                )}

              </div>

            </div>

          </div>

        )
      )}
    </>
  );
}

// ============================================================
// SUBMISSION CARD
// ============================================================

function SubmissionCard({
  taskNumber,
  submission,
}: {
  taskNumber: number;

  submission: Submission;
}) {
  return (
    <div className="border rounded p-3 mt-3">

      <div className="d-flex justify-content-between align-items-center mb-3">

        <div>

          <strong>
            Attempt #
            {
              submission.attemptNumber
            }
          </strong>

          <div className="small text-muted">

            Submitted{" "}

            {
              formatDateTime(
                submission.submittedAt
              )
            }

          </div>

        </div>

        <StatusBadge
          status={
            submission.status
          }
        />

      </div>

      {submission.rejectionReason && (

        <div className="alert alert-danger py-2">

          {
            submission.rejectionReason
          }

        </div>

      )}

      {/* ======================================================
          TASK 1
      ====================================================== */}

      {taskNumber ===
        1 &&
        submission.task1Purchase && (

          <>

            <InfoRow
              label="Order ID"
              value={
                submission
                  .task1Purchase
                  .orderId
              }
            />

            <InfoRow
              label="Purchase Amount"
              value={`₹${Number(
                submission
                  .task1Purchase
                  .purchaseAmount
              ).toLocaleString(
                "en-IN"
              )}`}
            />

            {submission
              .task1Purchase
              .proofImage && (

              <ProofImage
                title="Purchase Proof"
                src={
                  submission
                    .task1Purchase
                    .proofImage
                }
              />

            )}

          </>

        )}

      {/* ======================================================
          TASK 2
      ====================================================== */}

      {taskNumber ===
        2 &&
        submission.task2Received && (

          <>

            {submission
              .task2Received
              .proofImage ? (

              <ProofImage
                title="Product Received Proof"
                src={
                  submission
                    .task2Received
                    .proofImage
                }
              />

            ) : (

              <div className="text-muted">
                No proof image.
              </div>

            )}

          </>

        )}

      {/* ======================================================
          TASK 3
      ====================================================== */}

      {taskNumber ===
        3 &&
        submission.task3Review && (

          <>

            <div className="mb-3">

              <div className="text-muted small">
                Rating
              </div>

              <div className="fw-semibold">

                {
                  submission
                    .task3Review
                    .rating
                }

                {" / 5"}

              </div>

            </div>

            <div className="mb-4">

              <div className="text-muted small mb-1">
                Review
              </div>

              <div
                className="border rounded bg-light p-3"
                style={{
                  whiteSpace:
                    "pre-wrap",
                }}
              >

                {
                  submission
                    .task3Review
                    .reviewText
                }

              </div>

            </div>

            {submission
              .task3Review
              .answers.length >
              0 && (

              <div>

                <h6 className="fw-bold">
                  Questionnaire Answers
                </h6>

                {[
                  ...submission
                    .task3Review
                    .answers,
                ]
                  .sort(
                    (
                      a,
                      b
                    ) =>
                      a.question
                        .questionOrder -
                      b.question
                        .questionOrder
                  )
                  .map(
                    (
                      answer,
                      index
                    ) => (

                      <div
                        className="border rounded p-3 mb-2"
                        key={
                          answer.id
                        }
                      >

                        <div className="fw-semibold mb-1">

                          {index +
                            1}
                          .{" "}

                          {
                            answer
                              .question
                              .questionText
                          }

                        </div>

                        <div className="text-muted small mb-2">

                          {
                            formatQuestionType(
                              answer
                                .question
                                .questionType
                            )
                          }

                        </div>

                        <div>

                          {
                            formatAnswer(
                              answer.answerText
                            )
                          }

                        </div>

                      </div>

                    )
                  )}

              </div>

            )}

          </>

        )}

      {/* ======================================================
          TASK 4
      ====================================================== */}

      {taskNumber ===
        4 &&
        submission.task4Publish && (

          <>

            <div className="mb-3">

              <div className="text-muted small mb-1">
                Published Review URL
              </div>

              <a
                href={
                  submission
                    .task4Publish
                    .publishedUrl
                }
                target="_blank"
                rel="noreferrer"
              >

                {
                  submission
                    .task4Publish
                    .publishedUrl
                }

                <i className="bi bi-box-arrow-up-right ms-2" />

              </a>

            </div>

            {submission
              .task4Publish
              .proofImage && (

              <ProofImage
                title="Published Review Proof"
                src={
                  submission
                    .task4Publish
                    .proofImage
                }
              />

            )}

          </>

        )}

    </div>
  );
}

// ============================================================
// PROOF IMAGE
// ============================================================

function ProofImage({
  title,
  src,
}: {
  title: string;

  src: string;
}) {
  return (
    <div className="mt-3">

      <div className="text-muted small mb-2">

        {
          title
        }

      </div>

      <a
        href={
          src
        }
        target="_blank"
        rel="noreferrer"
      >

        <img
          src={
            src
          }
          alt={
            title
          }
          className="img-fluid rounded border"
          style={{
            maxHeight:
              300,

            objectFit:
              "contain",
          }}
        />

      </a>

    </div>
  );
}

// ============================================================
// INFO ROW
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
// SMALL INFO
// ============================================================

function SmallInfo({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div>

      <div className="text-muted small">

        {
          label
        }

      </div>

      <div className="fw-semibold">

        {
          value
        }

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

    case "SUBMITTED":
      className =
        "bg-warning text-dark";
      break;

    case "AVAILABLE":
    case "ONGOING":
      className =
        "bg-primary";
      break;

    case "REJECTED":
    case "CANCELLED":
      className =
        "bg-danger";
      break;

    case "LOCKED":
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
// DATE TIME
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

// ============================================================
// QUESTION TYPE
// ============================================================

function formatQuestionType(
  value: string
) {
  switch (
    value
  ) {
    case "SINGLE_CHOICE":
      return "Single Choice";

    case "MULTIPLE_CHOICE":
      return "Multiple Choice";

    case "TEXT":
      return "Text";

    default:
      return value;
  }
}

// ============================================================
// MULTIPLE CHOICE ANSWER
//
// Task 3 stores multiple selections as JSON string.
// ============================================================

function formatAnswer(
  value: string
) {
  try {
    const parsed =
      JSON.parse(
        value
      );

    if (
      Array.isArray(
        parsed
      )
    ) {
      return parsed.join(
        ", "
      );
    }
  } catch {
    // Normal text answer
  }

  return value;
}