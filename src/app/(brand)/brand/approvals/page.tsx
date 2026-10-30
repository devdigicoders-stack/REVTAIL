"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

// ============================================================
// TYPES
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

  submittedAt:
    string;

  tester: {
    id: number;

    fullName:
      string;

    profileImage:
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

    task4Required:
      boolean;
  };

  submission: {
    id: number;

    attemptNumber:
      number;

    reviewText:
      string;

    rating:
      number;

    answers: {
      id: number;

      answerText:
        string;

      question: {
        id: number;

        questionText:
          string;

        questionType:
          string;
      };
    }[];
  };
};

type ApiResponse = {
  success: boolean;

  message?: string;

  data?: {
    totalPending:
      number;

    approvals:
      Approval[];
  };
};

// ============================================================
// PAGE
// ============================================================

export default function BrandPendingApprovalsPage() {
  const [
    approvals,
    setApprovals,
  ] =
    useState<Approval[]>(
      []
    );

  const [
    totalPending,
    setTotalPending,
  ] =
    useState(0);

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
              "/api/brand/approvals/tasks",
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
            !result.success
          ) {
            throw new Error(
              result.message ||
                "Unable to load pending approvals."
            );
          }

          setApprovals(
            result.data
              ?.approvals ??
              []
          );

          setTotalPending(
            result.data
              ?.totalPending ??
              0
          );
        } catch (
          err
        ) {
          console.error(
            "LOAD BRAND APPROVALS ERROR:",
            err
          );

          setApprovals(
            []
          );

          setTotalPending(
            0
          );

          setError(
            err instanceof
              Error
              ? err.message
              : "Unable to load pending approvals."
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

              Loading pending approvals...

            </div>

          </div>

        </div>

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
          href="/brand"
          className="text-decoration-none"
        >

          <i className="bi bi-arrow-left me-2" />

          Back to Dashboard

        </Link>

      </div>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="col-12">

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">

          <div>

            <h3 className="fw-bold mb-1">

              Pending Approvals

            </h3>

            <p className="text-muted mb-0">

              Review tester Task 3 submissions awaiting Brand approval.

            </p>

          </div>

          <span className="badge bg-warning text-dark fs-6">

            {
              totalPending
            }

            {" Pending"}

          </span>

        </div>

      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (

        <div className="col-12">

          <div className="alert alert-danger">

            <i className="bi bi-exclamation-triangle me-2" />

            {
              error
            }

          </div>

        </div>

      )}

      {/* ======================================================
          EMPTY
      ====================================================== */}

      {!error &&
        approvals.length ===
          0 && (

          <div className="col-12">

            <div className="card border-0 shadow-sm">

              <div className="card-body text-center py-5">

                <i className="bi bi-check-circle text-success display-5" />

                <h5 className="fw-bold mt-3">

                  No Pending Approvals

                </h5>

                <p className="text-muted mb-0">

                  There are currently no Task 3 submissions waiting for your approval.

                </p>

              </div>

            </div>

          </div>

        )}

      {/* ======================================================
          APPROVAL LIST
      ====================================================== */}

      {approvals.length >
        0 && (

        <div className="col-12">

          <div className="card border-0 shadow-sm">

            <div className="card-body p-0">

              <div className="table-responsive">

                <table className="table table-hover align-middle mb-0">

                  <thead className="table-light">

                    <tr>

                      <th className="ps-4">
                        Campaign
                      </th>

                      <th>
                        Tester
                      </th>

                      <th>
                        Task
                      </th>

                      <th>
                        Rating
                      </th>

                      <th>
                        Submitted
                      </th>

                      <th className="text-end pe-4">
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {approvals.map(
                      (
                        approval
                      ) => (

                        <tr
                          key={
                            approval
                              .testerCampaignTaskId
                          }
                        >

                          {/* CAMPAIGN */}

                          <td className="ps-4">

                            <div className="d-flex align-items-center gap-3">

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
                                  className="rounded border"
                                  style={{
                                    width:
                                      55,

                                    height:
                                      55,

                                    objectFit:
                                      "cover",
                                  }}
                                />

                              ) : (

                                <div
                                  className="rounded bg-light border d-flex align-items-center justify-content-center"
                                  style={{
                                    width:
                                      55,

                                    height:
                                      55,
                                  }}
                                >

                                  <i className="bi bi-box fs-4 text-muted" />

                                </div>

                              )}

                              <div>

                                <div className="fw-semibold">

                                  {
                                    approval
                                      .campaign
                                      .productName
                                  }

                                </div>

                                <div className="small text-muted">

                                  Campaign #
                                  {
                                    approval
                                      .campaign
                                      .id
                                  }

                                </div>

                              </div>

                            </div>

                          </td>

                          {/* TESTER */}

                          <td>

                            <div className="fw-semibold">

                              {
                                approval
                                  .tester
                                  .fullName
                              }

                            </div>

                          </td>

                          {/* TASK */}

                          <td>

                            <span className="badge bg-warning text-dark">

                              Task 3

                            </span>

                            <div className="small text-muted mt-1">

                              {
                                approval.taskTitle
                              }

                            </div>

                          </td>

                          {/* RATING */}

                          <td>

                            <span className="fw-semibold">

                              {
                                approval
                                  .submission
                                  .rating
                              }

                              /5

                            </span>

                            <i className="bi bi-star-fill text-warning ms-1" />

                          </td>

                          {/* SUBMITTED */}

                          <td>

                            {
                              formatDateTime(
                                approval.submittedAt
                              )
                            }

                          </td>

                          {/* ACTION */}

                          <td className="text-end pe-4">

                            <Link
                              href={`/brand/campaigns/${approval.campaign.id}/testers/${approval.testerCampaignId}`}
                              className="btn btn-outline-primary btn-sm"
                            >

                              Review

                              <i className="bi bi-arrow-right ms-2" />

                            </Link>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </div>

        </div>

      )}
    </>
  );
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