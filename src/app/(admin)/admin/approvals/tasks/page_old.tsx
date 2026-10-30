"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

// ============================================================
// TASK DETAIL TYPES
// ============================================================

type Task1Purchase = {
  orderId: string;

  purchaseAmount:
    | string
    | number;

  proofImage: string;
};

type Task2Received = {
  proofImage: string;
};

type Task3QuestionAnswer = {
  id: number;

  answerText: string;

  question: {
    id: number;

    questionText: string;

    questionType: string;

    options: unknown;

    sortOrder: number;
  };
};

type Task3Review = {
  id: number;

  reviewText: string;

  rating: number;

  answers:
    Task3QuestionAnswer[];
};

type Task4Publish = {
  id: number;

  publishedUrl: string;

  proofImage: string;
};

// ============================================================
// APPROVAL TYPE
// ============================================================

type Approval = {
  testerCampaignTaskId:
    number;

  testerCampaignId:
    number;

  taskNumber:
    number;

  taskTitle:
    string;

  taskStatus:
    string;

  submittedAt:
    | string
    | null;

  tester: {
    id: number;

    fullName:
      string;

    profileImage:
      | string
      | null;

    mobile:
      | string
      | null;

    email:
      | string
      | null;
  };

  campaign: {
    id: number;

    productName:
      string;

    productImage:
      | string
      | null;

    earningAmount:
      | string
      | number;

    task4Required:
      boolean;

    brandName:
      | string
      | null;
  };

  submission: {
    id: number;

    attemptNumber:
      number;

    status:
      string;

    submittedAt:
      string;

    task1Purchase:
      | Task1Purchase
      | null;

    task2Received:
      | Task2Received
      | null;

    task3Review:
      | Task3Review
      | null;

    task4Publish:
      | Task4Publish
      | null;
  };
};

// ============================================================
// API RESPONSE
// ============================================================

type ApprovalResponse = {
  success: boolean;

  message: string;

  data?: {
    totalPending:
      number;

    approvals:
      Approval[];
  };
};

type TaskFilter =
  | "ALL"
  | 1
  | 2
  | 3
  | 4;

// ============================================================
// PAGE
// ============================================================

export default function AdminTaskApprovalsPage() {
  // ============================================================
  // STATE
  // ============================================================

  const [
    approvals,
    setApprovals,
  ] =
    useState<
      Approval[]
    >([]);

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
    successMessage,
    setSuccessMessage,
  ] =
    useState("");

  const [
    reviewingId,
    setReviewingId,
  ] =
    useState<
      number | null
    >(null);

  const [
    rejectionTask,
    setRejectionTask,
  ] =
    useState<
      Approval | null
    >(null);

  const [
    rejectionReason,
    setRejectionReason,
  ] =
    useState("");

  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState<TaskFilter>(
      "ALL"
    );

  // ============================================================
  // LOAD APPROVALS
  // ============================================================

  const loadApprovals =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setError("");

          const response =
            await fetch(
              "/api/admin/approvals/tasks",
              {
                method:
                  "GET",

                cache:
                  "no-store",
              }
            );

          const result =
            (await response.json()) as
              ApprovalResponse;

          if (
            !response.ok
          ) {
            throw new Error(
              result.message ||
                "Unable to load task approvals."
            );
          }

          setApprovals(
            result.data
              ?.approvals ??
              []
          );
        } catch (err) {
          console.error(
            "Load admin task approvals error:",
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load task approvals."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    loadApprovals();
  }, [
    loadApprovals,
  ]);

  // ============================================================
  // COUNTS
  // ============================================================

  const taskCounts =
    useMemo(() => {
      return {
        1:
          approvals.filter(
            (item) =>
              item.taskNumber ===
              1
          ).length,

        2:
          approvals.filter(
            (item) =>
              item.taskNumber ===
              2
          ).length,

        3:
          approvals.filter(
            (item) =>
              item.taskNumber ===
              3
          ).length,

        4:
          approvals.filter(
            (item) =>
              item.taskNumber ===
              4
          ).length,
      };
    }, [
      approvals,
    ]);

  // ============================================================
  // FILTER
  // ============================================================

  const filteredApprovals =
    useMemo(() => {
      if (
        activeFilter ===
        "ALL"
      ) {
        return approvals;
      }

      return approvals.filter(
        (approval) =>
          approval.taskNumber ===
          activeFilter
      );
    }, [
      approvals,
      activeFilter,
    ]);

  // ============================================================
  // REVIEW API
  // ============================================================

  async function reviewTask(
    testerCampaignTaskId:
      number,

    action:
      | "APPROVE"
      | "REJECT",

    rejectionReasonValue?: string
  ) {
    try {
      setReviewingId(
        testerCampaignTaskId
      );

      setError("");
      setSuccessMessage("");

      const response =
        await fetch(
          `/api/admin/approvals/tasks/${testerCampaignTaskId}/review`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                action,

                rejectionReason:
                  rejectionReasonValue ??
                  null,
              }),
          }
        );

      const result =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          result.message ||
            "Unable to review task."
        );
      }

      setSuccessMessage(
        result.message ||
          "Task reviewed successfully."
      );

      setRejectionTask(
        null
      );

      setRejectionReason(
        ""
      );

      await loadApprovals();
    } catch (err) {
      console.error(
        "Review task error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to review task."
      );
    } finally {
      setReviewingId(
        null
      );
    }
  }

  // ============================================================
  // APPROVE
  // ============================================================

  async function handleApprove(
    approval: Approval
  ) {
    let confirmationMessage =
      "";

    // ------------------------------------------------------------
    // TASK 4 = FINAL TASK
    // ------------------------------------------------------------

    if (
      approval.taskNumber ===
      4
    ) {
      confirmationMessage =
        `Approve Task 4 for ${approval.tester.fullName}? ` +
        `This will mark the campaign as completed.`;
    }

    // ------------------------------------------------------------
    // TASK 3 WITHOUT TASK 4 = FINAL TASK
    // ------------------------------------------------------------

    else if (
      approval.taskNumber ===
        3 &&
      !approval.campaign
        .task4Required
    ) {
      confirmationMessage =
        `Approve Task 3 for ${approval.tester.fullName}? ` +
        `Task 4 is not required, so this will complete the campaign.`;
    }

    // ------------------------------------------------------------
    // NORMAL NEXT TASK
    // ------------------------------------------------------------

    else {
      const nextTaskNumber =
        approval.taskNumber +
        1;

      confirmationMessage =
        `Approve Task ${approval.taskNumber} for ${approval.tester.fullName}? ` +
        `Task ${nextTaskNumber} will be unlocked automatically.`;
    }

    const confirmed =
      window.confirm(
        confirmationMessage
      );

    if (!confirmed) {
      return;
    }

    await reviewTask(
      approval
        .testerCampaignTaskId,

      "APPROVE"
    );
  }

  // ============================================================
  // OPEN REJECT MODAL
  // ============================================================

  function openRejectModal(
    approval: Approval
  ) {
    setError("");

    setRejectionReason(
      ""
    );

    setRejectionTask(
      approval
    );
  }

  // ============================================================
  // REJECT
  // ============================================================

  async function handleReject() {
    if (
      !rejectionTask
    ) {
      return;
    }

    const reason =
      rejectionReason.trim();

    if (!reason) {
      setError(
        "Please enter a rejection reason."
      );

      return;
    }

    await reviewTask(
      rejectionTask
        .testerCampaignTaskId,

      "REJECT",

      reason
    );
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
              Loading pending task approvals...
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
              Task Approvals
            </h3>

            <p className="text-muted mb-0">
              Review tester submissions for
              Tasks 1 through 4.
            </p>

          </div>

          <div>

            <span className="badge bg-primary fs-6 px-3 py-2">

              {
                approvals.length
              }{" "}

              Pending

            </span>

          </div>

        </div>

      </div>

      {/* ========================================================
          FILTERS
      ======================================================== */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body py-3">

            <div className="d-flex flex-wrap gap-2">

              {/* ALL */}

              <FilterButton
                active={
                  activeFilter ===
                  "ALL"
                }
                label="All"
                count={
                  approvals.length
                }
                onClick={() =>
                  setActiveFilter(
                    "ALL"
                  )
                }
              />

              {/* TASK 1 */}

              <FilterButton
                active={
                  activeFilter ===
                  1
                }
                label="Task 1"
                count={
                  taskCounts[1]
                }
                onClick={() =>
                  setActiveFilter(
                    1
                  )
                }
              />

              {/* TASK 2 */}

              <FilterButton
                active={
                  activeFilter ===
                  2
                }
                label="Task 2"
                count={
                  taskCounts[2]
                }
                onClick={() =>
                  setActiveFilter(
                    2
                  )
                }
              />

              {/* TASK 3 */}

              <FilterButton
                active={
                  activeFilter ===
                  3
                }
                label="Task 3"
                count={
                  taskCounts[3]
                }
                onClick={() =>
                  setActiveFilter(
                    3
                  )
                }
              />

              {/* TASK 4 */}

              <FilterButton
                active={
                  activeFilter ===
                  4
                }
                label="Task 4"
                count={
                  taskCounts[4]
                }
                onClick={() =>
                  setActiveFilter(
                    4
                  )
                }
              />

            </div>

          </div>

        </div>

      </div>

      {/* ========================================================
          SUCCESS
      ======================================================== */}

      {successMessage && (

        <div className="col-12">

          <div className="alert alert-success border-0 shadow-sm mb-0">

            <i className="bi bi-check-circle-fill me-2"></i>

            {
              successMessage
            }

          </div>

        </div>

      )}

      {/* ========================================================
          ERROR
      ======================================================== */}

      {error && (

        <div className="col-12">

          <div className="alert alert-danger border-0 shadow-sm mb-0">

            <i className="bi bi-exclamation-circle-fill me-2"></i>

            {error}

          </div>

        </div>

      )}

      {/* ========================================================
          EMPTY STATE
      ======================================================== */}

      {filteredApprovals.length ===
        0 && (

        <div className="col-12">

          <div className="card border-0 shadow-sm">

            <div className="card-body text-center py-5">

              <i className="bi bi-clipboard-check fs-1 text-muted"></i>

              <h5 className="fw-bold mt-3 mb-2">

                {activeFilter ===
                "ALL"
                  ? "No pending task approvals"
                  : `No pending Task ${activeFilter} approvals`}

              </h5>

              <p className="text-muted mb-0">
                Submitted tester tasks will
                appear here for review.
              </p>

            </div>

          </div>

        </div>

      )}

      {/* ========================================================
          APPROVAL CARDS
      ======================================================== */}

      {filteredApprovals.map(
        (approval) => (

          <div
            key={
              approval
                .testerCampaignTaskId
            }
            className="col-xl-6"
          >

            <div className="card border-0 shadow-sm h-100">

              <div className="card-body p-4">

                {/* ==================================================
                    CAMPAIGN HEADER
                ================================================== */}

                <div className="d-flex gap-3 align-items-start mb-4">

                  <div
                    className="rounded overflow-hidden bg-light flex-shrink-0 d-flex align-items-center justify-content-center"
                    style={{
                      width:
                        "76px",

                      height:
                        "76px",
                    }}
                  >

                    {approval
                      .campaign
                      .productImage ? (

                      <img
                        src={
                          approval
                            .campaign
                            .productImage
                        }
                        alt={
                          approval
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
                        approval
                          .campaign
                          .brandName ??
                        "Brand"
                      }

                    </div>

                    <h5 className="fw-bold mb-1">

                      {
                        approval
                          .campaign
                          .productName
                      }

                    </h5>

                    <div className="small text-muted">

                      Tester:{" "}

                      <strong>

                        {
                          approval
                            .tester
                            .fullName
                        }

                      </strong>

                    </div>

                  </div>

                </div>

                {/* ==================================================
                    TASK HEADER
                ================================================== */}

                <div className="border rounded-3 p-3 mb-4">

                  <div className="d-flex justify-content-between align-items-start gap-3">

                    <div>

                      <small className="text-muted d-block">
                        Submitted Task
                      </small>

                      <div className="fw-bold">

                        Task{" "}

                        {
                          approval.taskNumber
                        }

                        {" — "}

                        {
                          approval.taskTitle
                        }

                      </div>

                    </div>

                    <div className="d-flex flex-column align-items-end gap-2">

                      <span className="badge bg-warning text-dark">

                        Attempt #

                        {
                          approval
                            .submission
                            .attemptNumber
                        }

                      </span>

                      <span className="badge bg-secondary">

                        {
                          approval.taskStatus
                        }

                      </span>

                    </div>

                  </div>

                </div>

                {/* ==================================================
                    TASK 1 DETAILS
                ================================================== */}

                {approval.taskNumber ===
                  1 &&
                  approval
                    .submission
                    .task1Purchase && (

                  <div className="mb-4">

                    <h6 className="fw-bold mb-3">
                      Purchase Details
                    </h6>

                    <div className="row g-3">

                      <div className="col-sm-6">

                        <div className="border rounded-3 p-3 h-100">

                          <small className="text-muted d-block">
                            Order ID
                          </small>

                          <strong className="text-break">

                            {
                              approval
                                .submission
                                .task1Purchase
                                .orderId
                            }

                          </strong>

                        </div>

                      </div>

                      <div className="col-sm-6">

                        <div className="border rounded-3 p-3 h-100">

                          <small className="text-muted d-block">
                            Purchase Amount
                          </small>

                          <strong>

                            ₹
                            {Number(
                              approval
                                .submission
                                .task1Purchase
                                .purchaseAmount
                            ).toLocaleString(
                              "en-IN"
                            )}

                          </strong>

                        </div>

                      </div>

                    </div>

                    <ProofImage
                      src={
                        approval
                          .submission
                          .task1Purchase
                          .proofImage
                      }
                      label="Purchase Proof"
                      alt="Task 1 purchase proof"
                    />

                  </div>

                )}

                {/* ==================================================
                    TASK 2 DETAILS
                ================================================== */}

                {approval.taskNumber ===
                  2 &&
                  approval
                    .submission
                    .task2Received && (

                  <div className="mb-4">

                    <h6 className="fw-bold mb-3">
                      Product Received
                    </h6>

                    <ProofImage
                      src={
                        approval
                          .submission
                          .task2Received
                          .proofImage
                      }
                      label="Product Received Proof"
                      alt="Task 2 product received proof"
                    />

                  </div>

                )}

                {/* ==================================================
                    TASK 3 DETAILS
                ================================================== */}

                {approval.taskNumber ===
                  3 &&
                  approval
                    .submission
                    .task3Review && (

                  <div className="mb-4">

                    <h6 className="fw-bold mb-3">
                      Review & Rating
                    </h6>

                    {/* RATING */}

                    <div className="border rounded-3 p-3 mb-3">

                      <small className="text-muted d-block mb-2">
                        Product Rating
                      </small>

                      <div className="d-flex align-items-center gap-2">

                        <div className="text-warning">

                          {[
                            1,
                            2,
                            3,
                            4,
                            5,
                          ].map(
                            (
                              star
                            ) => (

                              <i
                                key={
                                  star
                                }
                                className={`bi ${
                                  star <=
                                  approval
                                    .submission
                                    .task3Review!
                                    .rating
                                    ? "bi-star-fill"
                                    : "bi-star"
                                } me-1`}
                              />

                            )
                          )}

                        </div>

                        <strong>

                          {
                            approval
                              .submission
                              .task3Review
                              .rating
                          }

                          /5

                        </strong>

                      </div>

                    </div>

                    {/* REVIEW TEXT */}

                    <div className="mb-4">

                      <small className="text-muted d-block mb-2">
                        Tester Review
                      </small>

                      <div className="border rounded-3 bg-light p-3">

                        <div
                          style={{
                            whiteSpace:
                              "pre-wrap",
                          }}
                        >

                          {
                            approval
                              .submission
                              .task3Review
                              .reviewText
                          }

                        </div>

                      </div>

                    </div>

                    {/* QUESTIONNAIRE */}

                    <div>

                      <small className="text-muted d-block mb-2">
                        Questionnaire Answers
                      </small>

                      {approval
                        .submission
                        .task3Review
                        .answers
                        .length >
                      0 ? (

                        <div className="d-flex flex-column gap-3">

                          {[
                            ...approval
                              .submission
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
                                answer,
                                index
                              ) => (

                                <div
                                  key={
                                    answer.id
                                  }
                                  className="border rounded-3 p-3"
                                >

                                  <div className="fw-semibold mb-2">

                                    {index +
                                      1}
                                    .{" "}

                                    {
                                      answer
                                        .question
                                        .questionText
                                    }

                                  </div>

                                  <div className="text-muted">

                                    {formatQuestionAnswer(
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

                      ) : (

                        <div className="border rounded-3 p-3 text-muted">

                          No questionnaire
                          answers were submitted.

                        </div>

                      )}

                    </div>

                    {/* TASK 4 REQUIRED STATUS */}

                    <div className="mt-3">

                      {approval
                        .campaign
                        .task4Required ? (

                        <span className="badge bg-info text-dark">

                          <i className="bi bi-arrow-right-circle me-1"></i>

                          Approval will unlock Task 4

                        </span>

                      ) : (

                        <span className="badge bg-success">

                          <i className="bi bi-flag-fill me-1"></i>

                          Final required task — approval completes campaign

                        </span>

                      )}

                    </div>

                  </div>

                )}

                {/* ==================================================
                    TASK 4 DETAILS
                ================================================== */}

                {approval.taskNumber ===
                  4 &&
                  approval
                    .submission
                    .task4Publish && (

                  <div className="mb-4">

                    <h6 className="fw-bold mb-3">
                      Published Review
                    </h6>

                    {/* PUBLISHED URL */}

                    <div className="mb-4">

                      <small className="text-muted d-block mb-2">
                        Published Review URL
                      </small>

                      <div className="border rounded-3 bg-light p-3">

                        <a
                          href={
                            approval
                              .submission
                              .task4Publish
                              .publishedUrl
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-break"
                        >

                          {
                            approval
                              .submission
                              .task4Publish
                              .publishedUrl
                          }

                          <i className="bi bi-box-arrow-up-right ms-2"></i>

                        </a>

                      </div>

                    </div>

                    {/* PROOF */}

                    <ProofImage
                      src={
                        approval
                          .submission
                          .task4Publish
                          .proofImage
                      }
                      label="Published Review Proof"
                      alt="Task 4 published review proof"
                    />

                    <div className="alert alert-success mt-3 mb-0">

                      <i className="bi bi-flag-fill me-2"></i>

                      Task 4 is the final task.
                      Approving it will complete
                      this tester&apos;s campaign.

                    </div>

                  </div>

                )}

                {/* ==================================================
                    FALLBACK
                ================================================== */}

                {!hasTaskSpecificDetails(
                  approval
                ) && (

                  <div className="alert alert-warning">

                    <i className="bi bi-exclamation-triangle me-2"></i>

                    This submission exists,
                    but its task-specific
                    details were not returned
                    by the API.

                  </div>

                )}

                {/* ==================================================
                    TESTER INFORMATION
                ================================================== */}

                <div className="border-top pt-3 mb-3">

                  <div className="row g-2 small">

                    <div className="col-md-6">

                      <span className="text-muted">
                        Mobile:
                      </span>

                      {" "}

                      <strong>

                        {
                          approval
                            .tester
                            .mobile ??
                          "-"
                        }

                      </strong>

                    </div>

                    <div className="col-md-6">

                      <span className="text-muted">
                        Email:
                      </span>

                      {" "}

                      <strong className="text-break">

                        {
                          approval
                            .tester
                            .email ??
                          "-"
                        }

                      </strong>

                    </div>

                  </div>

                </div>

                {/* ==================================================
                    SUBMISSION INFORMATION
                ================================================== */}

                <div className="small text-muted mb-4">

                  <i className="bi bi-clock me-1"></i>

                  Submitted{" "}

                  {formatDateTime(
                    approval
                      .submission
                      .submittedAt
                  )}

                </div>

                {/* ==================================================
                    ACTIONS
                ================================================== */}

                <div className="d-flex flex-column flex-sm-row gap-2">

                  <button
                    type="button"
                    className="btn btn-success flex-grow-1"
                    disabled={
                      reviewingId ===
                      approval
                        .testerCampaignTaskId
                    }
                    onClick={() =>
                      handleApprove(
                        approval
                      )
                    }
                  >

                    {reviewingId ===
                    approval
                      .testerCampaignTaskId ? (

                      <>
                        <span className="spinner-border spinner-border-sm me-2" />

                        Processing...
                      </>

                    ) : (

                      <>
                        <i className="bi bi-check-lg me-2"></i>

                        Approve
                      </>

                    )}

                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-danger flex-grow-1"
                    disabled={
                      reviewingId ===
                      approval
                        .testerCampaignTaskId
                    }
                    onClick={() =>
                      openRejectModal(
                        approval
                      )
                    }
                  >

                    <i className="bi bi-x-lg me-2"></i>

                    Reject

                  </button>

                </div>

              </div>

            </div>

          </div>

        )
      )}

      {/* ========================================================
          REJECTION MODAL
      ======================================================== */}

      {rejectionTask && (

        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            zIndex:
              2000,

            background:
              "rgba(0, 0, 0, 0.55)",

            padding:
              "20px",
          }}
          onClick={() => {
            if (
              reviewingId ===
              null
            ) {
              setRejectionTask(
                null
              );

              setRejectionReason(
                ""
              );
            }
          }}
        >

          <div
            className="card border-0 shadow-lg w-100"
            style={{
              maxWidth:
                "520px",
            }}
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <div className="card-body p-4">

              <div className="d-flex justify-content-between align-items-start gap-3 mb-3">

                <div>

                  <h5 className="fw-bold mb-1">

                    Reject Task{" "}

                    {
                      rejectionTask
                        .taskNumber
                    }

                  </h5>

                  <div className="text-muted small">

                    {
                      rejectionTask
                        .taskTitle
                    }

                  </div>

                </div>

                <button
                  type="button"
                  className="btn-close"
                  disabled={
                    reviewingId !==
                    null
                  }
                  onClick={() => {
                    setRejectionTask(
                      null
                    );

                    setRejectionReason(
                      ""
                    );
                  }}
                />

              </div>

              <div className="alert alert-light border">

                Tester:{" "}

                <strong>

                  {
                    rejectionTask
                      .tester
                      .fullName
                  }

                </strong>

                <br />

                Product:{" "}

                <strong>

                  {
                    rejectionTask
                      .campaign
                      .productName
                  }

                </strong>

              </div>

              <label className="form-label fw-semibold">

                Rejection Reason

                <span className="text-danger ms-1">
                  *
                </span>

              </label>

              <textarea
                className="form-control"
                rows={5}
                value={
                  rejectionReason
                }
                onChange={(
                  event
                ) =>
                  setRejectionReason(
                    event.target
                      .value
                  )
                }
                placeholder="Explain what the tester needs to correct before resubmitting..."
                maxLength={
                  2000
                }
              />

              <div className="d-flex justify-content-between mt-1">

                <small className="text-muted">
                  Tester will see this reason.
                </small>

                <small className="text-muted">

                  {
                    rejectionReason
                      .length
                  }
                  /2000

                </small>

              </div>

              <div className="d-flex justify-content-end gap-2 mt-4">

                <button
                  type="button"
                  className="btn btn-light"
                  disabled={
                    reviewingId !==
                    null
                  }
                  onClick={() => {
                    setRejectionTask(
                      null
                    );

                    setRejectionReason(
                      ""
                    );
                  }}
                >

                  Cancel

                </button>

                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={
                    reviewingId !==
                      null ||
                    !rejectionReason.trim()
                  }
                  onClick={
                    handleReject
                  }
                >

                  {reviewingId !==
                  null ? (

                    <>
                      <span className="spinner-border spinner-border-sm me-2" />

                      Rejecting...
                    </>

                  ) : (

                    <>
                      <i className="bi bi-x-circle me-2"></i>

                      Reject Task
                    </>

                  )}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}
    </>
  );
}

// ============================================================
// FILTER BUTTON
// ============================================================

function FilterButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;

  label: string;

  count: number;

  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`btn btn-sm ${
        active
          ? "btn-primary"
          : "btn-outline-secondary"
      }`}
      onClick={
        onClick
      }
    >

      {label}

      <span className="badge bg-light text-dark ms-2">

        {count}

      </span>

    </button>
  );
}

// ============================================================
// PROOF IMAGE
// ============================================================

function ProofImage({
  src,
  label,
  alt,
}: {
  src: string;

  label: string;

  alt: string;
}) {
  return (
    <div className="mt-3">

      <small className="text-muted d-block mb-2">
        {label}
      </small>

      <a
        href={
          src
        }
        target="_blank"
        rel="noopener noreferrer"
        className="d-block"
      >

        <img
          src={
            src
          }
          alt={
            alt
          }
          className="img-fluid rounded border"
          style={{
            width:
              "100%",

            maxHeight:
              "350px",

            objectFit:
              "contain",

            background:
              "#f8f9fa",
          }}
        />

      </a>

      <div className="small text-muted mt-1">

        <i className="bi bi-zoom-in me-1"></i>

        Click image to view full size.

      </div>

    </div>
  );
}

// ============================================================
// TASK-SPECIFIC DETAIL CHECK
// ============================================================

function hasTaskSpecificDetails(
  approval: Approval
) {
  switch (
    approval.taskNumber
  ) {
    case 1:
      return Boolean(
        approval
          .submission
          .task1Purchase
      );

    case 2:
      return Boolean(
        approval
          .submission
          .task2Received
      );

    case 3:
      return Boolean(
        approval
          .submission
          .task3Review
      );

    case 4:
      return Boolean(
        approval
          .submission
          .task4Publish
      );

    default:
      return false;
  }
}

// ============================================================
// FORMAT QUESTION ANSWER
// ============================================================

function formatQuestionAnswer(
  answerText: string,
  questionType: string
) {
  if (
    questionType !==
    "MULTIPLE_CHOICE"
  ) {
    return answerText;
  }

  try {
    const parsed =
      JSON.parse(
        answerText
      );

    if (
      Array.isArray(
        parsed
      )
    ) {
      return parsed
        .map(
          String
        )
        .join(
          ", "
        );
    }
  } catch {
    // Fallback to stored value.
  }

  return answerText;
}

// ============================================================
// DATE FORMAT
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