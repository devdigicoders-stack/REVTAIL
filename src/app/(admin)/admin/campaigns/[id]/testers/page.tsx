"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type TesterCampaignStatus =
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED"
  | "ADMIN_STOPPED";

type CampaignTester = {
  applicationId: number;
  applicationStatus: string;
  appliedAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  tester: {
    id: number;
    userId: number;
    fullName: string;
    gender: string;
    ageCategory: string;
    pinCode: string;
    city: string | null;
    state: string | null;
    profileImage: string | null;
    approvalStatus: string;
    email: string | null;
    mobile: string | null;
    userStatus: string;
  };
  testerCampaign: {
    id: number;
    status: TesterCampaignStatus;
    currentTask: number;
    earningAmount: number;
    joinedAt: string;
    startedAt: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    cancellationReason: string | null;
  } | null;
};

type PageData = {
  campaign: {
    id: number;
    campaignCode: string;
    productName: string;
    productImage: string | null;
    status: string;
    totalSlots: number;
    filledSlots: number;
    availableSlots: number | null;
    brandName: string;
  };
  summary: {
    totalApplications: number;
    pending: number;
    approved: number;
    rejected: number;
    enrolled: number;
  };
  testers: CampaignTester[];
};

type ApiResponse = {
  success: boolean;
  message?: string;
  data?: PageData;
};

export default function AdminCampaignTestersPage() {
  const params = useParams<{ id: string }>();
  const campaignId = Number(params.id);

  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [stopTester, setStopTester] = useState<CampaignTester | null>(null);
  const [stopReason, setStopReason] = useState("");
  const [stopping, setStopping] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState<number | null>(null);

  const loadTesters = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/campaigns/${campaignId}/testers`,
        { method: "GET", cache: "no-store" }
      );

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load campaign testers.");
      }

      setData(result.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load campaign testers.");
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    loadTesters();
  }, [loadTesters]);

  function openStopModal(item: CampaignTester) {
    if (item.testerCampaign?.status !== "ONGOING") return;
    setError("");
    setSuccess("");
    setStopReason("");
    setStopTester(item);
  }

  async function handleStop() {
    if (!stopTester?.testerCampaign) return;

    const reason = stopReason.trim();
    if (!reason) {
      setError("Please enter a reason for stopping this tester.");
      return;
    }

    try {
      setStopping(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/admin/tester-campaigns/${stopTester.testerCampaign.id}/stop`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to stop tester.");
      }

      setSuccess(result.message || "Tester stopped successfully.");
      setStopTester(null);
      setStopReason("");
      await loadTesters();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to stop tester.");
    } finally {
      setStopping(false);
    }
  }


  async function handleReminder(item: CampaignTester) {
    if (
      !item.testerCampaign ||
      item.testerCampaign.status !== "ONGOING"
    ) {
      return;
    }

    if (!item.tester.mobile) {
      setError(
        `WhatsApp reminder cannot be sent because ${item.tester.fullName} does not have a mobile number.`
      );
      return;
    }

    try {
      setSendingReminderId(item.testerCampaign.id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/admin/tester-campaigns/${item.testerCampaign.id}/reminder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to send WhatsApp reminder."
        );
      }

      setSuccess(
        result.message ||
          `Reminder sent successfully to ${item.tester.fullName}.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send WhatsApp reminder."
      );
    } finally {
      setSendingReminderId(null);
    }
  }

  if (loading) {
    return (
      <div className="col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary" />
            <div className="text-muted mt-3">Loading campaign testers...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="col-12">
        <div className="alert alert-danger">{error || "Campaign information not found."}</div>
      </div>
    );
  }

  const { campaign, summary, testers } = data;

  return (
    <>
      <div className="col-12">
        <Link href={`/admin/campaigns/${campaign.id}`} className="text-decoration-none">
          <i className="bi bi-arrow-left me-2" />
          Back to Campaign
        </Link>
      </div>

      <div className="col-12">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          <div>
            <h3 className="fw-bold mb-1">Campaign Testers</h3>
            <div className="text-muted">
              {campaign.productName} • {campaign.campaignCode} • {campaign.brandName}
            </div>
          </div>
          <span className={`badge fs-6 ${campaign.status === "LIVE" ? "bg-success" : "bg-secondary"}`}>
            {campaign.status}
          </span>
        </div>
      </div>

      {success && (
        <div className="col-12">
          <div className="alert alert-success">
            <i className="bi bi-check-circle me-2" />{success}
          </div>
        </div>
      )}

      {error && (
        <div className="col-12">
          <div className="alert alert-danger">
            <i className="bi bi-exclamation-circle me-2" />{error}
          </div>
        </div>
      )}

      <div className="col-12">
        <div className="row g-3">
          <SummaryCard label="Applications" value={summary.totalApplications} />
          <SummaryCard label="Approved" value={summary.approved} />
          <SummaryCard label="Enrolled" value={summary.enrolled} />
          <SummaryCard label="Available Slots" value={campaign.availableSlots ?? 0} />
        </div>
      </div>

      <div className="col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            {testers.length === 0 ? (
              <div className="text-center text-muted py-5">No testers found for this campaign.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Tester</th>
                      <th>Location</th>
                      <th>Application</th>
                      <th>Campaign Status</th>
                      <th>Current Task</th>
                      <th>Earning</th>
                      <th className="text-end" colSpan={3}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {testers.map((item) => (
                      <tr key={item.applicationId}>
                        <td>
                          <div className="fw-semibold">{item.tester.fullName}</div>
                          <small className="text-muted d-block">
                            {item.tester.mobile || item.tester.email || "-"}
                          </small>
                        </td>
                        <td>
                          <div>{item.tester.city || "-"}</div>
                          <small className="text-muted">{item.tester.state || "-"}</small>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">{item.applicationStatus}</span>
                        </td>
                        <td>
                          {item.testerCampaign ? (
                            <CampaignStatusBadge status={item.testerCampaign.status} />
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>{item.testerCampaign ? `Task ${item.testerCampaign.currentTask}` : "-"}</td>
                        <td>
                          {item.testerCampaign
                            ? `₹${Number(item.testerCampaign.earningAmount).toLocaleString("en-IN")}`
                            : "-"}
                        </td>
                        <td className="text-end">
                          {item.testerCampaign?.status === "ONGOING" ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success"
                              disabled={
                                !item.tester.mobile ||
                                sendingReminderId === item.testerCampaign.id
                              }
                              onClick={() => handleReminder(item)}
                              title={
                                item.tester.mobile
                                  ? "Send WhatsApp reminder"
                                  : "Tester mobile number is not available"
                              }
                            >
                              {sendingReminderId === item.testerCampaign.id ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-1" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-whatsapp me-1" />
                                  Reminder
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="text-muted small">-</span>
                          )}
                        </td>

                        <td className="text-end">
                          {item.testerCampaign?.status === "ONGOING" && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => openStopModal(item)}
                            >
                              <i className="bi bi-stop-circle me-1" />
                              Stop
                            </button>
                          )}

                          {item.testerCampaign?.status === "ADMIN_STOPPED" && (
                            <span className="badge bg-danger">
                              Stopped by Admin
                            </span>
                          )}
                        </td>

                        <td className="text-end">
                          {item.testerCampaign ? (
                            <Link
                              href={`/admin/campaigns/${campaign.id}/testers/${item.testerCampaign.id}/tasks`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              View Tasks
                            </Link>
                          ) : (
                            <span className="text-muted small">
                              Not enrolled
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {stopTester && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ zIndex: 2000, background: "rgba(0,0,0,.55)", padding: 20 }}
          onClick={() => {
            if (!stopping) {
              setStopTester(null);
              setStopReason("");
            }
          }}
        >
          <div
            className="card border-0 shadow-lg w-100"
            style={{ maxWidth: 540 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="card-body p-4">
              <h5 className="fw-bold mb-2">Stop Tester from Campaign</h5>

              <div className="alert alert-warning">
                <strong>{stopTester.tester.fullName}</strong> will no longer be able to continue any task in this campaign. Existing task/submission history will remain saved.
              </div>

              <label className="form-label fw-semibold">
                Reason <span className="text-danger">*</span>
              </label>

              <textarea
                className="form-control"
                rows={5}
                maxLength={2000}
                value={stopReason}
                onChange={(event) => setStopReason(event.target.value)}
                placeholder="Enter why this tester is being stopped from the campaign..."
              />

              <div className="small text-muted text-end mt-1">{stopReason.length}/2000</div>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-light"
                  disabled={stopping}
                  onClick={() => {
                    setStopTester(null);
                    setStopReason("");
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={stopping || !stopReason.trim()}
                  onClick={handleStop}
                >
                  {stopping ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Stopping...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-stop-circle me-2" />
                      Stop Tester
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

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="col-md-3 col-6">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body">
          <div className="text-muted small">{label}</div>
          <h4 className="fw-bold mb-0 mt-1">{value}</h4>
        </div>
      </div>
    </div>
  );
}

function CampaignStatusBadge({ status }: { status: TesterCampaignStatus }) {
  const className =
    status === "ONGOING"
      ? "bg-warning text-dark"
      : status === "COMPLETED"
      ? "bg-success"
      : status === "ADMIN_STOPPED"
      ? "bg-danger"
      : "bg-secondary";

  return (
    <span className={`badge ${className}`}>
      {status === "ADMIN_STOPPED" ? "STOPPED" : status}
    </span>
  );
}
