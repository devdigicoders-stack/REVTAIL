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

type Reviewer = {
  id: number;

  name:
    | string
    | null;

  role: string;

  reviewerType:
    string;
};

type QuestionAnswer = {
  id: number;

  answerText:
    string;

  question: {
    id: number;

    questionText:
      string;

    questionType:
      string;

    sortOrder:
      number;
  };
};

type Attempt = {
  id: number;

  attemptNumber:
    number;

  status:
    string;

  submittedAt:
    string;

  reviewedAt:
    | string
    | null;

  rejectionReason:
    | string
    | null;

  reviewer:
    | Reviewer
    | null;

  task1Purchase:
    | {
        orderId:
          string;

        purchaseAmount:
          string | number;

        proofImage:
          string;
      }
    | null;

  task2Received:
    | {
        proofImage:
          string;
      }
    | null;

  task3Review:
    | {
        reviewText:
          string;

        rating:
          number;

        answers:
          QuestionAnswer[];
      }
    | null;

  task4Publish:
    | {
        publishedUrl:
          string;

        proofImage:
          string;
      }
    | null;
};

type Task = {
  id: number;

  taskNumber:
    number;

  title:
    string;

  status:
    string;

  unlockedAt:
    | string
    | null;

  submittedAt:
    | string
    | null;

  approvedAt:
    | string
    | null;

  reviewer:
    | Reviewer
    | null;

  attempts:
    Attempt[];
};

type CompletedCampaign = {
  testerCampaignId:
    number;

  status:
    string;

  earningAmount:
    string | number;

  joinedAt:
    string;

  startedAt:
    | string
    | null;

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

    productLink:
      | string
      | null;

    task4Required:
      boolean;

    brandName:
      | string
      | null;

    startDate:
      string;

    endDate:
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

  tasks:
    Task[];
};

type ApiResponse = {
  success:
    boolean;

  message:
    string;

  data?:
    CompletedCampaign;
};

// ============================================================
// PAGE
// ============================================================

export default function CompletedCampaignDetailPage() {
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
    data,
    setData,
  ] =
    useState<
      CompletedCampaign | null
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

  // ============================================================
  // LOAD
  // ============================================================

  const loadCampaign =
    useCallback(
      async () => {
        if (
          !Number.isInteger(
            testerCampaignId
          ) ||
          testerCampaignId <= 0
        ) {
          setError(
            "Invalid campaign."
          );

          setLoading(false);

          return;
        }

        try {
          setLoading(true);
          setError("");

          const response =
            await fetch(
              `/api/tester/campaigns/completed/${testerCampaignId}`,
              {
                cache:
                  "no-store",
              }
            );

          const result =
            (await response.json()) as
              ApiResponse;

          if (
            !response.ok
          ) {
            throw new Error(
              result.message ||
                "Unable to load completed campaign."
            );
          }

          setData(
            result.data ??
              null
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load completed campaign."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        testerCampaignId,
      ]
    );

  useEffect(() => {
    loadCampaign();
  }, [
    loadCampaign,
  ]);

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body py-5 text-center">

            <div className="spinner-border text-primary" />

            <div className="text-muted mt-3">
              Loading completed campaign...
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
    !data
  ) {
    return (
      <div className="col-12">

        <div className="alert alert-danger">

          {
            error ||
            "Campaign not found."
          }

        </div>

        <Link
          href="/tester/campaigns/history"
          className="btn btn-outline-primary"
        >
          Back to Completed Campaigns
        </Link>

      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <>
      {/* HEADER */}

      <div className="col-12">

        <Link
          href="/tester/campaigns/history"
          className="text-decoration-none small"
        >
          <i className="bi bi-arrow-left me-1"></i>
          Completed Campaigns
        </Link>

      </div>

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body p-4">

            <div className="d-flex flex-column flex-md-row gap-4">

              <div
                className="rounded overflow-hidden bg-light flex-shrink-0"
                style={{
                  width:
                    "120px",

                  height:
                    "120px",
                }}
              >

                {data.campaign
                  .productImage ? (

                  <img
                    src={
                      data.campaign
                        .productImage
                    }
                    alt={
                      data.campaign
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

                    <i className="bi bi-image fs-1 text-muted"></i>

                  </div>

                )}

              </div>

              <div className="flex-grow-1">

                <div className="text-primary fw-bold small">

                  {
                    data.campaign
                      .brandName ??
                    "Brand"
                  }

                </div>

                <h3 className="fw-bold mb-2">

                  {
                    data.campaign
                      .productName
                  }

                </h3>

                <span className="badge bg-success mb-3">

                  <i className="bi bi-check-circle me-1"></i>

                  COMPLETED

                </span>

                {data.campaign
                  .productDescription && (

                  <p className="text-muted mb-3">

                    {
                      data.campaign
                        .productDescription
                    }

                  </p>

                )}

                {data.campaign
                  .productLink && (

                  <a
                    href={
                      data.campaign
                        .productLink
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-primary"
                  >

                    View Product

                    <i className="bi bi-box-arrow-up-right ms-2"></i>

                  </a>

                )}

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* SUMMARY */}

      <div className="col-md-4">

        <SummaryCard
          label="Tasks Completed"
          value={`${data.progress.approvedTasks}/${data.progress.totalTasks}`}
          icon="bi-check2-all"
        />

      </div>

      <div className="col-md-4">

        <SummaryCard
          label="Campaign Progress"
          value={`${data.progress.percentage}%`}
          icon="bi-bar-chart"
        />

      </div>

      <div className="col-md-4">

        <SummaryCard
          label="Campaign Earning"
          value={`₹${Number(
            data.earningAmount
          ).toLocaleString(
            "en-IN"
          )}`}
          icon="bi-wallet2"
        />

      </div>

      {/* COMPLETION */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body">

            <h5 className="fw-bold mb-3">
              Campaign Completion
            </h5>

            <div className="row g-3">

              <InfoItem
                label="Joined"
                value={
                  formatDateTime(
                    data.joinedAt
                  )
                }
              />

              <InfoItem
                label="Started"
                value={
                  formatDateTime(
                    data.startedAt
                  )
                }
              />

              <InfoItem
                label="Completed"
                value={
                  formatDateTime(
                    data.completedAt
                  )
                }
              />

            </div>

          </div>

        </div>

      </div>

      {/* TASK HISTORY */}

      <div className="col-12">

        <h4 className="fw-bold mb-0">
          Task History
        </h4>

      </div>

      {data.tasks.map(
        (task) => (

          <div
            className="col-12"
            key={
              task.id
            }
          >

            <TaskHistoryCard
              task={
                task
              }
            />

          </div>

        )
      )}
    </>
  );
}

// ============================================================
// TASK HISTORY CARD
// ============================================================

function TaskHistoryCard({
  task,
}: {
  task: Task;
}) {
  const latestAttempt =
    task.attempts[0] ??
    null;

  return (
    <div className="card border-0 shadow-sm">

      <div className="card-body p-4">

        <div className="d-flex flex-wrap justify-content-between gap-3 mb-3">

          <div>

            <small className="text-muted">
              Task {task.taskNumber}
            </small>

            <h5 className="fw-bold mb-0">
              {task.title}
            </h5>

          </div>

          <span className="badge bg-success align-self-start">
            APPROVED
          </span>

        </div>

        {/* REVIEWER */}

        {task.reviewer && (

          <div className="mb-3">

            <small className="text-muted d-block">
              Approved by
            </small>

            <div className="d-flex align-items-center gap-2 mt-1">

              <span
                className={`badge ${
                  task.reviewer
                    .role ===
                  "ADMIN"
                    ? "bg-dark"
                    : "bg-primary"
                }`}
              >

                {
                  task.reviewer
                    .reviewerType
                }

              </span>

              {task.reviewer
                .name && (

                <strong>
                  {
                    task.reviewer
                      .name
                  }
                </strong>

              )}

            </div>

          </div>

        )}

        {task.approvedAt && (

          <div className="small text-muted mb-3">

            Approved{" "}

            {formatDateTime(
              task.approvedAt
            )}

          </div>

        )}

        {/* LATEST APPROVED CONTENT */}

        {latestAttempt && (

          <AttemptDetails
            attempt={
              latestAttempt
            }
            taskNumber={
              task.taskNumber
            }
          />

        )}

        {/* PREVIOUS ATTEMPTS */}

        {task.attempts.length >
          1 && (

          <details className="mt-4">

            <summary
              className="fw-semibold"
              style={{
                cursor:
                  "pointer",
              }}
            >
              View all{" "}
              {
                task.attempts
                  .length
              }{" "}
              attempts
            </summary>

            <div className="d-flex flex-column gap-3 mt-3">

              {task.attempts.map(
                (
                  attempt
                ) => (

                  <div
                    key={
                      attempt.id
                    }
                    className="border rounded p-3"
                  >

                    <div className="d-flex justify-content-between mb-2">

                      <strong>
                        Attempt #
                        {
                          attempt.attemptNumber
                        }
                      </strong>

                      <span
                        className={`badge ${
                          attempt.status ===
                          "APPROVED"
                            ? "bg-success"
                            : attempt.status ===
                                "REJECTED"
                              ? "bg-danger"
                              : "bg-warning text-dark"
                        }`}
                      >
                        {
                          attempt.status
                        }
                      </span>

                    </div>

                    {attempt.reviewer && (

                      <div className="small mb-2">

                        Reviewed by{" "}

                        <strong>
                          {
                            attempt
                              .reviewer
                              .reviewerType
                          }
                        </strong>

                      </div>

                    )}

                    {attempt.rejectionReason && (

                      <div className="text-danger small">

                        {
                          attempt.rejectionReason
                        }

                      </div>

                    )}

                  </div>

                )
              )}

            </div>

          </details>

        )}

      </div>

    </div>
  );
}

// ============================================================
// ATTEMPT DETAILS
// ============================================================

function AttemptDetails({
  attempt,
  taskNumber,
}: {
  attempt: Attempt;

  taskNumber:
    number;
}) {
  if (
    taskNumber === 1 &&
    attempt.task1Purchase
  ) {
    return (
      <div className="border rounded-3 p-3 bg-light">

        <div>
          <strong>
            Order ID:
          </strong>{" "}
          {
            attempt
              .task1Purchase
              .orderId
          }
        </div>

        <div>
          <strong>
            Purchase:
          </strong>{" "}
          ₹
          {Number(
            attempt
              .task1Purchase
              .purchaseAmount
          ).toLocaleString(
            "en-IN"
          )}
        </div>

        <ProofImage
          src={
            attempt
              .task1Purchase
              .proofImage
          }
        />

      </div>
    );
  }

  if (
    taskNumber === 2 &&
    attempt.task2Received
  ) {
    return (
      <ProofImage
        src={
          attempt
            .task2Received
            .proofImage
        }
      />
    );
  }

  if (
    taskNumber === 3 &&
    attempt.task3Review
  ) {
    return (
      <div>

        <div className="mb-3">

          <strong>
            Rating:{" "}
            {
              attempt
                .task3Review
                .rating
            }
            /5
          </strong>

        </div>

        <div className="border rounded p-3 bg-light mb-3">

          {
            attempt
              .task3Review
              .reviewText
          }

        </div>

        {attempt
          .task3Review
          .answers
          .length >
          0 && (

          <div className="d-flex flex-column gap-2">

            {[
              ...attempt
                .task3Review
                .answers,
            ]
              .sort(
                (
                  a,
                  b
                ) =>
                  a.question
                    .sortOrder -
                  b.question
                    .sortOrder
              )
              .map(
                (
                  answer
                ) => (

                  <div
                    key={
                      answer.id
                    }
                    className="border rounded p-3"
                  >

                    <strong>
                      {
                        answer
                          .question
                          .questionText
                      }
                    </strong>

                    <div className="text-muted mt-1">

                      {formatAnswer(
                        answer.answerText,
                        answer
                          .question
                          .questionType
                      )}

                    </div>

                  </div>

                )
              )}

          </div>

        )}

      </div>
    );
  }

  if (
    taskNumber === 4 &&
    attempt.task4Publish
  ) {
    return (
      <div>

        <div className="mb-3">

          <small className="text-muted d-block">
            Published Review
          </small>

          <a
            href={
              attempt
                .task4Publish
                .publishedUrl
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-break"
          >
            {
              attempt
                .task4Publish
                .publishedUrl
            }

            <i className="bi bi-box-arrow-up-right ms-1"></i>

          </a>

        </div>

        <ProofImage
          src={
            attempt
              .task4Publish
              .proofImage
          }
        />

      </div>
    );
  }

  return null;
}

// ============================================================
// PROOF
// ============================================================

function ProofImage({
  src,
}: {
  src: string;
}) {
  return (
    <div className="mt-3">

      <a
        href={
          src
        }
        target="_blank"
        rel="noopener noreferrer"
      >

        <img
          src={
            src
          }
          alt="Task proof"
          className="img-fluid rounded border"
          style={{
            maxHeight:
              "300px",

            objectFit:
              "contain",
          }}
        />

      </a>

    </div>
  );
}

// ============================================================
// SUMMARY
// ============================================================

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;

  value: string;

  icon: string;
}) {
  return (
    <div className="card border-0 shadow-sm h-100">

      <div className="card-body">

        <i
          className={`bi ${icon} fs-4 text-primary`}
        />

        <small className="text-muted d-block mt-2">
          {label}
        </small>

        <strong className="fs-5">
          {value}
        </strong>

      </div>

    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div className="col-md-4">

      <small className="text-muted d-block">
        {label}
      </small>

      <strong>
        {value}
      </strong>

    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

function formatAnswer(
  value: string,
  type: string
) {
  if (
    type !==
    "MULTIPLE_CHOICE"
  ) {
    return value;
  }

  try {
    const parsed =
      JSON.parse(value);

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
    //
  }

  return value;
}

function formatDateTime(
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