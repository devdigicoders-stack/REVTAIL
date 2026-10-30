"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Submission = {
  id: number;
  attemptNumber: number;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  task1Purchase: { orderId: string; purchaseAmount: number; proofImage: string } | null;
  task2Received: { proofImage: string } | null;
  task3Review: {
    reviewText: string;
    rating: number;
    answers: Array<{
      id: number;
      answerText: string;
      question: { id: number; text: string; type: string; order: number };
    }>;
  } | null;
  task4Publish: { publishedUrl: string; proofImage: string } | null;
};

type Details = {
  testerCampaignId: number;
  taskNumber: number;
  taskStatus: string;
  campaign: { productName: string; brandName: string | null };
  submission: Submission;
};

const taskTitles: Record<number, string> = {
  1: "Buy Product",
  2: "Product Received",
  3: "Write Review & Rating",
  4: "Publish Your Review",
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function ProofImage({ image, title }: { image: string; title: string }) {
  return (
    <div className="mt-3">
      <div className="fw-semibold mb-2">{title}</div>
      <a href={image} target="_blank" rel="noopener noreferrer" title="Open full-size proof">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={title}
          className="img-fluid rounded border"
          style={{ maxHeight: 360, objectFit: "contain" }}
        />
      </a>
      <div className="small text-muted mt-1">Tap the image to view it full size.</div>
    </div>
  );
}

export default function TesterTaskSubmissionDetailsPage() {
  const params = useParams<{ testerCampaignId: string; taskNumber: string }>();
  const testerCampaignId = Number(params.testerCampaignId);
  const taskNumber = Number(params.taskNumber);
  const backHref = `/tester/campaigns/ongoing/${testerCampaignId}`;

  const [details, setDetails] = useState<Details | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(
          `/api/tester/campaigns/ongoing/${testerCampaignId}/tasks/${taskNumber}/submission`,
          { cache: "no-store" }
        );
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to load submission.");
        }
        if (!cancelled) setDetails(result.data as Details);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load submission.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (Number.isSafeInteger(testerCampaignId) && testerCampaignId > 0 &&
        Number.isSafeInteger(taskNumber) && taskNumber >= 1 && taskNumber <= 4) {
      load();
    } else {
      setError("Invalid campaign or task.");
      setLoading(false);
    }
    return () => { cancelled = true; };
  }, [testerCampaignId, taskNumber]);

  if (loading) {
    return (
      <div className="col-12 text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <div className="text-muted mt-3">Loading submitted task details...</div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="col-12">
        <div className="alert alert-danger">{error || "Submission not found."}</div>
        <Link href={backHref} className="btn btn-outline-primary btn-sm">Back to Campaign</Link>
      </div>
    );
  }

  const submission = details.submission;
  return (
    <>
      <div className="col-12">
        <Link href={backHref} className="text-decoration-none small">
          <i className="bi bi-arrow-left me-2" />Back to Campaign
        </Link>
      </div>

      <div className="col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-body p-3 p-sm-4">
            <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-3">
              <div>
                <div className="small text-muted">{details.campaign.brandName ?? "Brand"}</div>
                <h5 className="fw-bold mb-1">{details.campaign.productName}</h5>
                <div className="fw-semibold">
                  Task {details.taskNumber}: {taskTitles[details.taskNumber] ?? "Task Details"}
                </div>
              </div>
              <span className={`badge ${details.taskStatus === "APPROVED" ? "bg-success" : "bg-warning text-dark"}`}>
                {details.taskStatus === "APPROVED" ? "Completed" : "Pending Review"}
              </span>
            </div>

            <div className="alert alert-light border small">
              <div><strong>Attempt:</strong> {submission.attemptNumber}</div>
              <div><strong>Submitted:</strong> {formatDate(submission.submittedAt)}</div>
              {submission.reviewedAt && (
                <div><strong>Reviewed:</strong> {formatDate(submission.reviewedAt)}</div>
              )}
            </div>

            {details.taskNumber === 1 && submission.task1Purchase && (
              <div>
                <h6 className="fw-bold">Purchase Details</h6>
                <div><strong>Order ID:</strong> {submission.task1Purchase.orderId}</div>
                <div><strong>Purchase Amount:</strong> ₹{submission.task1Purchase.purchaseAmount.toLocaleString("en-IN")}</div>
                {submission.task1Purchase.proofImage && (
                  <ProofImage image={submission.task1Purchase.proofImage} title="Purchase Proof" />
                )}
              </div>
            )}

            {details.taskNumber === 2 && submission.task2Received && (
              <div>
                <h6 className="fw-bold">Product Received Proof</h6>
                {submission.task2Received.proofImage && (
                  <ProofImage image={submission.task2Received.proofImage} title="Received Product Image" />
                )}
              </div>
            )}

            {details.taskNumber === 3 && submission.task3Review && (
              <div>
                <h6 className="fw-bold">Your Review & Rating</h6>
                <div className="mb-3">
                  <strong>Rating:</strong> {submission.task3Review.rating} / 5
                </div>
                <div className="fw-semibold mb-1">Submitted Review</div>
                <p className="border rounded p-3" style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                  {submission.task3Review.reviewText}
                </p>
                {submission.task3Review.answers.length > 0 && (
                  <div className="mt-4">
                    <h6 className="fw-bold">Questionnaire Answers</h6>
                    {submission.task3Review.answers.map((answer) => (
                      <div key={answer.id} className="border-bottom py-3">
                        <div className="fw-semibold">{answer.question.text}</div>
                        <div className="mt-1" style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                          {answer.answerText}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {details.taskNumber === 4 && submission.task4Publish && (
              <div>
                <h6 className="fw-bold">Published Review</h6>
                <div className="mb-2">
                  <strong>Review Link: </strong>
                  <a href={submission.task4Publish.publishedUrl} target="_blank" rel="noopener noreferrer" className="text-break">
                    {submission.task4Publish.publishedUrl}
                  </a>
                </div>
                {submission.task4Publish.proofImage && (
                  <ProofImage image={submission.task4Publish.proofImage} title="Published Review Proof" />
                )}
              </div>
            )}

            {(
              (details.taskNumber === 1 && !submission.task1Purchase) ||
              (details.taskNumber === 2 && !submission.task2Received) ||
              (details.taskNumber === 3 && !submission.task3Review) ||
              (details.taskNumber === 4 && !submission.task4Publish)
            ) && (
              <div className="alert alert-warning mb-0">
                Submission record found, but its task-specific details are unavailable.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
