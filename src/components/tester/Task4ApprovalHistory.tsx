"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

type HistoryItem = {
  submissionId:
    number;

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
    | {
        id: number;

        name:
          | string
          | null;

        role:
          string;

        reviewerType:
          string;
      }
    | null;

  publishDetail:
    | {
        publishedUrl:
          string;

        proofImage:
          string;
      }
    | null;
};

type ApiResponse = {
  success: boolean;

  message: string;

  data?: {
    testerCampaignId:
      number;

    task: {
      id: number;

      taskNumber:
        number;

      status:
        string;
    };

    totalAttempts:
      number;

    history:
      HistoryItem[];
  };
};

export default function Task4ApprovalHistory({
  testerCampaignId,
}: {
  testerCampaignId:
    number;
}) {
  const [
    history,
    setHistory,
  ] =
    useState<
      HistoryItem[]
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

  const loadHistory =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await fetch(
              `/api/tester/campaigns/ongoing/${testerCampaignId}/tasks/4/history`,
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
                "Unable to load Task 4 history."
            );
          }

          setHistory(
            result.data
              ?.history ??
              []
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load Task 4 history."
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
    loadHistory();
  }, [
    loadHistory,
  ]);

  if (loading) {
    return (
      <div className="card border-0 shadow-sm">

        <div className="card-body text-center py-4">

          <div className="spinner-border spinner-border-sm text-primary" />

          <div className="small text-muted mt-2">
            Loading Task 4 history...
          </div>

        </div>

      </div>
    );
  }

  if (
    error
  ) {
    return (
      <div className="alert alert-danger">
        {error}
      </div>
    );
  }

  if (
    history.length === 0
  ) {
    return null;
  }

  return (
    <div className="card border-0 shadow-sm">

      <div className="card-body">

        <div className="d-flex justify-content-between align-items-center mb-4">

          <div>

            <h5 className="fw-bold mb-1">
              Task 4 Approval History
            </h5>

            <p className="text-muted small mb-0">
              Previous Task 4 submission and
              review attempts.
            </p>

          </div>

          <span className="badge bg-light text-dark">
            {history.length}{" "}
            Attempt
            {history.length ===
            1
              ? ""
              : "s"}
          </span>

        </div>

        <div className="d-flex flex-column gap-3">

          {history.map(
            (item) => (

              <div
                key={
                  item.submissionId
                }
                className="border rounded-3 p-3"
              >

                {/* HEADER */}

                <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">

                  <strong>
                    Attempt #
                    {
                      item.attemptNumber
                    }
                  </strong>

                  <StatusBadge
                    status={
                      item.status
                    }
                  />

                </div>

                {/* URL */}

                {item.publishDetail && (

                  <div className="mb-3">

                    <small className="text-muted d-block">
                      Published Review
                    </small>

                    <a
                      href={
                        item
                          .publishDetail
                          .publishedUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-break"
                    >
                      {
                        item
                          .publishDetail
                          .publishedUrl
                      }

                      <i className="bi bi-box-arrow-up-right ms-1"></i>
                    </a>

                  </div>

                )}

                {/* PROOF */}

                {item.publishDetail
                  ?.proofImage && (

                  <div className="mb-3">

                    <small className="text-muted d-block mb-2">
                      Submitted Proof
                    </small>

                    <a
                      href={
                        item
                          .publishDetail
                          .proofImage
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >

                      <img
                        src={
                          item
                            .publishDetail
                            .proofImage
                        }
                        alt={`Task 4 attempt ${item.attemptNumber}`}
                        className="img-fluid rounded border"
                        style={{
                          maxHeight:
                            "220px",

                          objectFit:
                            "contain",
                        }}
                      />

                    </a>

                  </div>

                )}

                {/* SUBMITTED */}

                <div className="small text-muted">

                  <i className="bi bi-upload me-1"></i>

                  Submitted:{" "}

                  {formatDateTime(
                    item.submittedAt
                  )}

                </div>

                {/* REVIEWED BY */}

                {item.reviewer && (

                  <div className="mt-3 border-top pt-3">

                    <small className="text-muted d-block">
                      Reviewed by
                    </small>

                    <div className="d-flex align-items-center flex-wrap gap-2 mt-1">

                      <span
                        className={`badge ${
                          item
                            .reviewer
                            .role ===
                          "ADMIN"
                            ? "bg-dark"
                            : "bg-primary"
                        }`}
                      >

                        {
                          item
                            .reviewer
                            .reviewerType
                        }

                      </span>

                      {item.reviewer
                        .name && (

                        <strong>
                          {
                            item
                              .reviewer
                              .name
                          }
                        </strong>

                      )}

                    </div>

                    {item.reviewedAt && (

                      <div className="small text-muted mt-1">

                        Reviewed:{" "}

                        {formatDateTime(
                          item.reviewedAt
                        )}

                      </div>

                    )}

                  </div>

                )}

                {/* REJECTION */}

                {item.rejectionReason && (

                  <div className="alert alert-danger py-2 mt-3 mb-0">

                    <strong>
                      Rejection reason:
                    </strong>

                    <div className="mt-1">
                      {
                        item.rejectionReason
                      }
                    </div>

                  </div>

                )}

                {/* PENDING */}

                {!item.reviewer &&
                  item.status ===
                    "SUBMITTED" && (

                  <div className="alert alert-warning py-2 mt-3 mb-0">

                    <i className="bi bi-hourglass-split me-2"></i>

                    Waiting for Admin review.

                  </div>

                )}

              </div>

            )
          )}

        </div>

      </div>

    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  switch (status) {
    case "APPROVED":
      return (
        <span className="badge bg-success">
          APPROVED
        </span>
      );

    case "REJECTED":
      return (
        <span className="badge bg-danger">
          REJECTED
        </span>
      );

    case "SUBMITTED":
      return (
        <span className="badge bg-warning text-dark">
          WAITING FOR REVIEW
        </span>
      );

    default:
      return (
        <span className="badge bg-secondary">
          {status}
        </span>
      );
  }
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