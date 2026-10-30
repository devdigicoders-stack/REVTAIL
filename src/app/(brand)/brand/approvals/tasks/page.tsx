"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

type Approval = {
  testerCampaignTaskId:
    number;

  testerCampaignId:
    number;

  submittedAt:
    string;

  tester: {
    id: number;
    fullName: string;

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

        sortOrder:
          number;
      };
    }[];
  };
};

export default function BrandTaskApprovalsPage() {
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
    message,
    setMessage,
  ] =
    useState("");

  const [
    reviewingId,
    setReviewingId,
  ] =
    useState<
      number | null
    >(null);

  const loadApprovals =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await fetch(
              "/api/brand/approvals/tasks",
              {
                cache:
                  "no-store",
              }
            );

          const result =
            await response.json();

          if (!response.ok) {
            throw new Error(
              result.message
            );
          }

          setApprovals(
            result.data
              ?.approvals ??
              []
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load approvals."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    loadApprovals();
  }, [loadApprovals]);

  async function review(
    approval: Approval,
    action:
      | "APPROVE"
      | "REJECT"
  ) {
    let rejectionReason:
      | string
      | null = null;

    if (
      action ===
      "APPROVE"
    ) {
      if (
        !window.confirm(
          `Approve Task 3 for ${approval.tester.fullName}?`
        )
      ) {
        return;
      }
    } else {
      rejectionReason =
        window.prompt(
          "Enter rejection reason:"
        );

      if (
        !rejectionReason?.trim()
      ) {
        return;
      }
    }

    try {
      setReviewingId(
        approval
          .testerCampaignTaskId
      );

      setError("");
      setMessage("");

      const response =
        await fetch(
          `/api/brand/approvals/tasks/${approval.testerCampaignTaskId}/review`,
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

                rejectionReason,
              }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message
        );
      }

      setMessage(
        result.message
      );

      await loadApprovals();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to review Task 3."
      );
    } finally {
      setReviewingId(
        null
      );
    }
  }

  if (loading) {
    return (
      <div className="col-12 text-center py-5">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="col-12">

        <h3 className="fw-bold mb-1">
          Task 3 Approvals
        </h3>

        <p className="text-muted">
          Review tester ratings,
          reviews and questionnaire
          responses.
        </p>

      </div>

      {message && (
        <div className="col-12">
          <div className="alert alert-success">
            {message}
          </div>
        </div>
      )}

      {error && (
        <div className="col-12">
          <div className="alert alert-danger">
            {error}
          </div>
        </div>
      )}

      {approvals.length ===
        0 && (
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              No pending Task 3 approvals.
            </div>
          </div>
        </div>
      )}

      {approvals.map(
        (approval) => (

          <div
            key={
              approval
                .testerCampaignTaskId
            }
            className="col-xl-6"
          >

            <div className="card border-0 shadow-sm h-100">

              <div className="card-body">

                <div className="small text-muted">
                  {
                    approval
                      .tester
                      .fullName
                  }
                </div>

                <h5 className="fw-bold">
                  {
                    approval
                      .campaign
                      .productName
                  }
                </h5>

                <div className="mb-3">

                  <strong>
                    Rating:{" "}
                    {
                      approval
                        .submission
                        .rating
                    }
                    /5
                  </strong>

                </div>

                <div className="border rounded bg-light p-3 mb-4">

                  {
                    approval
                      .submission
                      .reviewText
                  }

                </div>

                <h6 className="fw-bold">
                  Questionnaire
                </h6>

                <div className="d-flex flex-column gap-2 mb-4">

                  {[
                    ...approval
                      .submission
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

                          <div className="fw-semibold">
                            {
                              answer
                                .question
                                .questionText
                            }
                          </div>

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

                <div className="d-flex gap-2">

                  <button
                    className="btn btn-success flex-grow-1"
                    disabled={
                      reviewingId ===
                      approval
                        .testerCampaignTaskId
                    }
                    onClick={() =>
                      review(
                        approval,
                        "APPROVE"
                      )
                    }
                  >
                    Approve
                  </button>

                  <button
                    className="btn btn-outline-danger flex-grow-1"
                    disabled={
                      reviewingId ===
                      approval
                        .testerCampaignTaskId
                    }
                    onClick={() =>
                      review(
                        approval,
                        "REJECT"
                      )
                    }
                  >
                    Reject
                  </button>

                </div>

              </div>

            </div>

          </div>

        )
      )}
    </>
  );
}

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
    // use raw value
  }

  return value;
}