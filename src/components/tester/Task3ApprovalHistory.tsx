"use client";

import {
  useEffect,
  useState,
} from "react";

type HistoryItem = {
  submissionId: number;
  attemptNumber: number;
  status: string;

  submittedAt: string;
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
        role: string;
        reviewerType: string;
      }
    | null;
};

export default function Task3ApprovalHistory({
  testerCampaignId,
}: {
  testerCampaignId: number;
}) {
  const [
    history,
    setHistory,
  ] =
    useState<
      HistoryItem[]
    >([]);

  useEffect(() => {
    async function load() {
      const response =
        await fetch(
          `/api/tester/campaigns/ongoing/${testerCampaignId}/tasks/3/history`,
          {
            cache:
              "no-store",
          }
        );

      const result =
        await response.json();

      if (response.ok) {
        setHistory(
          result.data
            ?.history ??
            []
        );
      }
    }

    load();
  }, [
    testerCampaignId,
  ]);

  if (
    history.length === 0
  ) {
    return null;
  }

  return (
    <div className="card border-0 shadow-sm">

      <div className="card-body">

        <h5 className="fw-bold mb-3">
          Task 3 Approval History
        </h5>

        <div className="d-flex flex-column gap-3">

          {history.map(
            (item) => (

              <div
                key={
                  item.submissionId
                }
                className="border rounded-3 p-3"
              >

                <div className="d-flex justify-content-between">

                  <strong>
                    Attempt #
                    {
                      item.attemptNumber
                    }
                  </strong>

                  <span
                    className={`badge ${
                      item.status ===
                      "APPROVED"
                        ? "bg-success"
                        : item.status ===
                            "REJECTED"
                          ? "bg-danger"
                          : "bg-warning text-dark"
                    }`}
                  >
                    {
                      item.status
                    }
                  </span>

                </div>

                {item.reviewer && (

                  <div className="small mt-2">

                    Reviewed by:{" "}

                    <strong>
                      {
                        item.reviewer
                          .reviewerType
                      }
                    </strong>

                    {item.reviewer
                      .name &&
                      ` — ${item.reviewer.name}`}

                  </div>

                )}

                {item.rejectionReason && (

                  <div className="text-danger small mt-2">
                    {
                      item.rejectionReason
                    }
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