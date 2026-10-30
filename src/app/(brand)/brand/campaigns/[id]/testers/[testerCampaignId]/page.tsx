"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

type TaskAnswer = {
  id: number;
  answerText: string | null;
  question: {
    id: number;
    text: string;
    type: string;
    order: number;
  };
};

type Task = {
  id: number;
  taskNumber: number;
  status: string;
  submittedAt?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  latestSubmission?: {
    id: number;
    attemptNumber: number;
    status: string;
    submittedAt?: string | null;
    task1Purchase?: {
      orderId: string | null;
      purchaseAmount: number | null;
      proofImage: string | null;
    } | null;
    task2Received?: {
      proofImage: string | null;
    } | null;
    task3Review?: {
      id: number;
      reviewText: string | null;
      rating: number | null;
      answers: TaskAnswer[];
    } | null;
    task4Publish?: {
      id: number;
      publishedUrl: string | null;
      proofImage: string | null;
    } | null;
  } | null;
};

type ApiResponse = {
  success: boolean;
  message?: string;
  data?: {
    testerCampaign: {
      id: number;
      status: string;
      currentTask: number;
      earningAmount: number;
    };
    campaign: {
      id: number;
      campaignCode: string;
      productName: string;
      task4Required: boolean;
      status: string;
    };
    tester: {
      id: number;
      fullName: string;
      gender?: string | null;
      city?: string | null;
      state?: string | null;
      email?: string | null;
      mobile?: string | null;
    };
    tasks: Task[];
  };
};

export default function BrandTesterProgressPage() {
  const params = useParams<{
    id: string;
    testerCampaignId: string;
  }>();

  const campaignId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const testerCampaignId = Array.isArray(params.testerCampaignId)
    ? params.testerCampaignId[0]
    : params.testerCampaignId;

  const [data, setData] =
    useState<ApiResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [reviewingTaskId, setReviewingTaskId] =
    useState<number | null>(null);

  const loadProgress = useCallback(async () => {
    if (!testerCampaignId) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/brand/tester-campaigns/${testerCampaignId}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.message || "Unable to load tester progress."
        );
      }

      setData(result.data);
    } catch (err) {
      console.error("LOAD BRAND TESTER PROGRESS ERROR:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load tester progress."
      );
    } finally {
      setLoading(false);
    }
  }, [testerCampaignId]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const approveTask3 = async (task: Task) => {
    if (task.taskNumber !== 3 || task.status !== "SUBMITTED") {
      return;
    }

    if (!window.confirm("Approve Task 3 for this tester?")) {
      return;
    }

    try {
      setReviewingTaskId(task.id);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        `/api/brand/tasks/${task.id}/review`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            action: "APPROVE",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to approve Task 3."
        );
      }

      setSuccessMessage(
        result.message || "Task 3 approved successfully."
      );

      await loadProgress();
    } catch (err) {
      console.error("BRAND TASK 3 APPROVAL ERROR:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to approve Task 3."
      );
    } finally {
      setReviewingTaskId(null);
    }
  };

  if (loading) {
    return (
      <div className="col-12 text-center py-5">
        <div className="spinner-border text-primary" />
        <div className="text-muted mt-3">
          Loading tester progress...
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="col-12">
        <div className="alert alert-danger">{error}</div>
        <Link
          href={`/brand/campaigns/${campaignId}/testers`}
          className="btn btn-outline-secondary"
        >
          Back to Testers
        </Link>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      <div className="col-12">
        <Link
          href={`/brand/campaigns/${campaignId}/testers`}
          className="text-decoration-none"
        >
          <i className="bi bi-arrow-left me-2" />
          Back to Campaign Testers
        </Link>
      </div>

      <div className="col-12">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h3 className="fw-bold mb-1">{data.tester.fullName}</h3>
            <div className="text-muted">
              {data.campaign.productName} · {data.campaign.campaignCode}
            </div>
          </div>
          <span className="badge bg-primary fs-6">
            {data.testerCampaign.status}
          </span>
        </div>
      </div>

      {successMessage && (
        <div className="col-12">
          <div className="alert alert-success">{successMessage}</div>
        </div>
      )}

      {error && (
        <div className="col-12">
          <div className="alert alert-danger">{error}</div>
        </div>
      )}

      <div className="col-lg-4">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <h5 className="fw-bold mb-3">Tester Details</h5>
            <InfoRow label="Name" value={data.tester.fullName} />
            {/* <InfoRow label="Email" value={data.tester.email ?? "-"} />
            <InfoRow label="Mobile" value={data.tester.mobile ?? "-"} /> */}
            <InfoRow label="Gender" value={data.tester.gender ?? "-"} />
            <InfoRow
              label="Location"
              value={
                [data.tester.city, data.tester.state]
                  .filter(Boolean)
                  .join(", ") || "-"
              }
            />
            <InfoRow
              label="Current Task"
              value={`Task ${data.testerCampaign.currentTask}`}
            />
          </div>
        </div>
      </div>

      <div className="col-lg-8">
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h5 className="fw-bold mb-4">Task Activity & Progress</h5>

            <div className="d-flex flex-column gap-3">
              {data.tasks.map((task) => (
                <div key={task.id} className="border rounded p-3">
                  <div className="d-flex justify-content-between gap-3">
                    <div>
                      <div className="fw-bold">Task {task.taskNumber}</div>
                      <div className="small text-muted">
                        {taskTitle(task.taskNumber)}
                      </div>
                    </div>
                    <span className="badge bg-light text-dark border align-self-start">
                      {task.status}
                    </span>
                  </div>

                  <div className="row g-3 mt-1">
                    <div className="col-md-4">
                      <small className="text-muted d-block">Submitted</small>
                      {formatDateTime(task.submittedAt)}
                    </div>
                    <div className="col-md-4">
                      <small className="text-muted d-block">Approved</small>
                      {formatDateTime(task.approvedAt)}
                    </div>
                    <div className="col-md-4">
                      <small className="text-muted d-block">Attempt</small>
                      {task.latestSubmission?.attemptNumber ?? "-"}
                    </div>
                  </div>

                  {task.rejectionReason && (
                    <div className="alert alert-danger py-2 mt-3 mb-0">
                      {task.rejectionReason}
                    </div>
                  )}

                  <TaskSubmission task={task} />

                  {task.taskNumber === 3 && task.status === "SUBMITTED" && (
                    <div className="mt-3 pt-3 border-top">
                      <button
                        type="button"
                        className="btn btn-success"
                        disabled={reviewingTaskId === task.id}
                        onClick={() => approveTask3(task)}
                      >
                        {reviewingTaskId === task.id
                          ? "Approving..."
                          : "Approve Task 3"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function TaskSubmission({ task }: { task: Task }) {
  const submission = task.latestSubmission;
  if (!submission) return null;

  if (task.taskNumber === 1 && submission.task1Purchase) {
    return (
      <div className="mt-3 pt-3 border-top">
        <div className="fw-semibold mb-2">Purchase Details</div>
        <InfoRow
          label="Order ID"
          value={submission.task1Purchase.orderId ?? "-"}
        />
        <InfoRow
          label="Purchase Amount"
          value={
            submission.task1Purchase.purchaseAmount != null
              ? `₹${submission.task1Purchase.purchaseAmount}`
              : "-"
          }
        />
        {submission.task1Purchase.proofImage && (
          <ProofLink
            url={submission.task1Purchase.proofImage}
            label="View Purchase Proof"
          />
        )}
      </div>
    );
  }

  if (task.taskNumber === 2 && submission.task2Received) {
    return (
      <div className="mt-3 pt-3 border-top">
        <div className="fw-semibold mb-2">Product Received Proof</div>
        {submission.task2Received.proofImage ? (
          <ProofLink
            url={submission.task2Received.proofImage}
            label="View Received Proof"
          />
        ) : (
          <span className="text-muted">No proof image.</span>
        )}
      </div>
    );
  }

  if (task.taskNumber === 3 && submission.task3Review) {
    const review = submission.task3Review;

    return (
      <div className="mt-3 pt-3 border-top">
        <div className="fw-semibold mb-2">Task 3 Review</div>
        <InfoRow
          label="Rating"
          value={review.rating != null ? `${review.rating}/5` : "-"}
        />

        <div className="mt-3">
          <div className="text-muted small mb-1">Review Text</div>
          <div>{review.reviewText ?? "-"}</div>
        </div>

        {review.answers.length > 0 && (
          <div className="mt-3">
            <div className="fw-semibold mb-2">Questionnaire Answers</div>
            {[...review.answers]
              .sort((a, b) => a.question.order - b.question.order)
              .map((answer, index) => (
                <div key={answer.id} className="border rounded p-2 mb-2">
                  <div className="fw-semibold small">
                    {index + 1}. {answer.question.text}
                  </div>
                  <div className="text-muted mt-1">
                    {answer.answerText ?? "-"}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    );
  }

  if (task.taskNumber === 4 && submission.task4Publish) {
    return (
      <div className="mt-3 pt-3 border-top">
        <div className="fw-semibold mb-2">Published Review</div>
        {submission.task4Publish.publishedUrl && (
          <ProofLink
            url={submission.task4Publish.publishedUrl}
            label="Open Published Review"
          />
        )}
        {submission.task4Publish.proofImage && (
          <div className="mt-2">
            <ProofLink
              url={submission.task4Publish.proofImage}
              label="View Publish Proof"
            />
          </div>
        )}
      </div>
    );
  }

  return null;
}

function ProofLink({ url, label }: { url: string; label: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="btn btn-outline-primary btn-sm"
    >
      <i className="bi bi-box-arrow-up-right me-2" />
      {label}
    </a>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="d-flex justify-content-between gap-3 border-bottom py-2">
      <span className="text-muted">{label}</span>
      <span className="fw-semibold text-end">{value}</span>
    </div>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function taskTitle(taskNumber: number) {
  switch (taskNumber) {
    case 1:
      return "Purchase Product";
    case 2:
      return "Product Received";
    case 3:
      return "Review & Questionnaire";
    case 4:
      return "Publish Review";
    default:
      return `Task ${taskNumber}`;
  }
}
