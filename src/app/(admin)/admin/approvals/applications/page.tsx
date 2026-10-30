"use client";

import Image from "next/image";
import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

type Application = {
  id: number;

  status:
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED";

  appliedAt:
    | string
    | null;

  testerProfile: {
    id: number;

    fullName: string;

    gender: string;

    pinCode: string;

    city:
      | string
      | null;

    state:
      | string
      | null;

    profileImage:
      | string
      | null;

    approvalStatus:
      | "PENDING"
      | "APPROVED"
      | "REJECTED"
      | "BLOCKED";

    user: {
      email:
        | string
        | null;

      mobile:
        | string
        | null;

      status: string;
    };
  };

  campaign: {
    id: number;

    campaignCode: string;

    productName: string;

    productImage:
      | string
      | null;

    earningAmount:
      | string
      | number;

    currency: string;

    status: string;

    totalSlots: number;

    filledSlots: number;

    availableSlots:
      | number
      | null;

    brand: {
      companyName: string;
    };
  };
};

export default function AdminApplicationsPage() {
  const [
    applications,
    setApplications,
  ] =
    useState<Application[]>(
      []
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

  const [successMessage, setSuccessMessage] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [approvalTarget, setApprovalTarget] = useState<Application | null>(null);
  const [rejectionTarget, setRejectionTarget] = useState<Application | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    const loadApplications =
      async () => {
        try {
          setLoading(true);

          setError("");

          const response =
            await fetch(
              "/api/admin/applications?status=PENDING",
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
            await response.json();

          if (!response.ok) {
            throw new Error(
              result.message ||
                "Failed to load applications."
            );
          }

          setApplications(
            result.data ??
              []
          );
        } catch (err) {
          console.error(
            "LOAD APPLICATIONS ERROR:",
            err
          );

          setError(
            err instanceof
              Error
              ? err.message
              : "Failed to load applications."
          );
        } finally {
          setLoading(
            false
          );
        }
      };

    loadApplications();
  }, []);

  // ==========================================================
  // APPROVE / REJECT FROM LIST
  // Uses the exact same PATCH API as the application details page.
  // ==========================================================

  async function updateApplication(
    application: Application,
    action: "APPROVE" | "REJECT"
  ) {
    if (actionLoadingId !== null || application.status !== "PENDING") {
      return;
    }

    const reason = action === "REJECT" ? rejectionReason.trim() : "";

    if (action === "REJECT" && !reason) {
      setError("Rejection reason is required.");
      return;
    }

    try {
      setActionLoadingId(application.id);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        `/api/admin/applications/${application.id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            reason: action === "REJECT" ? reason : undefined,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to update application.");
      }

      const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

      // Keep the processed row visible with its new status until page reload.
      // The existing GET endpoint still requests PENDING applications only.
      setApplications((previous) =>
        previous.map((item) =>
          item.id === application.id
            ? {
                ...item,
                status: newStatus,
                campaign:
                  action === "APPROVE"
                    ? {
                        ...item.campaign,
                        availableSlots: Math.max(
                          0,
                          (item.campaign.availableSlots ??
                            Math.max(
                              0,
                              item.campaign.totalSlots - item.campaign.filledSlots
                            )) - 1
                        ),
                        filledSlots: item.campaign.filledSlots + 1,
                      }
                    : item.campaign,
              }
            : item
        )
      );

      setSuccessMessage(
        (result.message || `Application ${newStatus.toLowerCase()} successfully.`) +
          (result.whatsappSent === true
            ? " WhatsApp notification sent successfully."
            : result.whatsappSent === false
              ? ` WhatsApp notification was not sent: ${
                  result.whatsappError || "Unknown delivery error."
                }`
              : "")
      );

      setApprovalTarget(null);
      setRejectionTarget(null);
      setRejectionReason("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update application."
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  // ==========================================================
  // SAFE DATE
  // ==========================================================

  const formatDate = (
    value:
      | string
      | null
  ) => {
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

    return new Intl.DateTimeFormat(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    ).format(date);
  };

  if (loading) {
    return (
      <div className="col-12 text-center py-5">

        <div className="spinner-border text-primary" />

        <p className="text-muted mt-3">
          Loading tester requests...
        </p>

      </div>
    );
  }

  return (
    <>
      {/* HEADER */}

      <div className="col-12">

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">

          <div>

            <h4 className="fw-bold mb-1">
              Tester's Request for Campaigns
            </h4>

            <p className="text-muted mb-0">
              Review testers requesting enrollment in live campaigns.
            </p>

          </div>

          <span className="badge bg-warning-subtle text-warning-emphasis fs-6 px-3 py-2">

            {applications.filter((application) => application.status === "PENDING").length} Pending

          </span>

        </div>

      </div>

      {/* ERROR */}

      {error && (
        <div className="col-12">

          <div className="alert alert-danger">

            <i className="bi bi-exclamation-triangle me-2" />

            {error}

          </div>

        </div>
      )}

      {successMessage && (
        <div className="col-12">
          <div className="alert alert-success">
            <i className="bi bi-check-circle me-2" />
            {successMessage}
          </div>
        </div>
      )}

      {/* TABLE */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body">

            {applications.length ===
            0 ? (

              <div className="text-center py-5">

                <i className="bi bi-check-circle text-success fs-1" />

                <h5 className="mt-3">
                  No pending requests
                </h5>

                <p className="text-muted mb-0">
                  All tester applications have been reviewed.
                </p>

              </div>

            ) : (

              <div className="table-responsive">

                <table className="table table-hover align-middle">

                  <thead>

                    <tr>

                      <th>
                        Tester
                      </th>

                      <th>
                        Location
                      </th>

                      <th>
                        Campaign
                      </th>

                      <th>
                        Brand
                      </th>

                      <th>
                        Earning
                      </th>

                      <th>
                        Available
                      </th>

                      <th>
                        Applied
                      </th>

                      <th>
                        Status
                      </th>

                      <th className="text-end">
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {applications.map(
                      (
                        application
                      ) => {

                        const tester =
                          application.testerProfile;

                        const campaign =
                          application.campaign;

                        const available =
                          campaign.availableSlots ??
                          Math.max(
                            0,
                            campaign.totalSlots -
                              campaign.filledSlots
                          );

                        return (

                          <tr
                            key={
                              application.id
                            }
                          >

                            <td>

                              <div className="d-flex align-items-center gap-2">

                                {tester.profileImage ? (

                                  <Image
                                    src={
                                      tester.profileImage
                                    }
                                    alt={
                                      tester.fullName
                                    }
                                    width={45}
                                    height={45}
                                    className="rounded-circle"
                                    style={{
                                      objectFit:
                                        "cover",
                                    }}
                                  />

                                ) : (

                                  <div
                                    className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                                    style={{
                                      width:
                                        "45px",

                                      height:
                                        "45px",
                                    }}
                                  >
                                    <i className="bi bi-person" />
                                  </div>

                                )}

                                <div>

                                  <div className="fw-semibold">

                                    {
                                      tester.fullName
                                    }

                                  </div>

                                  <small className="text-muted">

                                    {
                                      tester.user.mobile ??
                                      "-"
                                    }

                                  </small>

                                </div>

                              </div>

                            </td>

                            <td>

                              <div>
                                {tester.city ??
                                  "-"}
                              </div>

                              <small className="text-muted">

                                {tester.state ??
                                  tester.pinCode}

                              </small>

                            </td>

                            <td>

                              <div className="fw-semibold">

                                {
                                  campaign.productName
                                }

                              </div>

                              <small className="text-muted">

                                {
                                  campaign.campaignCode
                                }

                              </small>

                            </td>

                            <td>

                              {
                                campaign.brand.companyName
                              }

                            </td>

                            <td>

                              <strong className="text-success">

                                ₹
                                {Number(
                                  campaign.earningAmount
                                ).toLocaleString(
                                  "en-IN"
                                )}

                              </strong>

                            </td>

                            <td>

                              <span
                                className={`badge ${
                                  available >
                                  0
                                    ? "bg-success-subtle text-success"
                                    : "bg-danger-subtle text-danger"
                                }`}
                              >

                                {
                                  available
                                }

                              </span>

                            </td>

                            <td>

                              {formatDate(
                                application.appliedAt
                              )}

                            </td>

                            <td>
                              <span
                                className={`badge ${
                                  application.status === "APPROVED"
                                    ? "bg-success"
                                    : application.status === "REJECTED"
                                      ? "bg-danger"
                                      : application.status === "PENDING"
                                        ? "bg-warning text-dark"
                                        : "bg-secondary"
                                }`}
                              >
                                {application.status}
                              </span>
                            </td>

                            <td className="text-end text-nowrap">
                              <div className="d-inline-flex flex-nowrap align-items-center justify-content-end gap-1">

                                {application.status === "PENDING" && (
                                  <>
                                    {/* APPROVE */}
                                    <button
                                      type="button"
                                      className="btn btn-success btn-sm"
                                      title="Approve"
                                      aria-label="Approve"
                                      disabled={
                                        actionLoadingId !== null ||
                                        campaign.status !== "LIVE" ||
                                        available <= 0 ||
                                        tester.approvalStatus !== "APPROVED"
                                      }
                                      onClick={() => {
                                        setError("");
                                        setSuccessMessage("");
                                        setApprovalTarget(application);
                                      }}
                                    >
                                      <i className="bi bi-check-circle" />
                                    </button>

                                    {/* REJECT */}
                                    <button
                                      type="button"
                                      className="btn btn-outline-danger btn-sm"
                                      title="Reject"
                                      aria-label="Reject"
                                      disabled={actionLoadingId !== null}
                                      onClick={() => {
                                        setError("");
                                        setSuccessMessage("");
                                        setRejectionReason("");
                                        setRejectionTarget(application);
                                      }}
                                    >
                                      <i className="bi bi-x-circle" />
                                    </button>
                                  </>
                                )}

                                {/* REVIEW */}
                                <Link
                                  href={`/admin/approvals/applications/${application.id}`}
                                  className="btn btn-primary btn-sm"
                                  title="Review"
                                  aria-label="Review"
                                >
                                  <i className="bi bi-eye" />
                                </Link>

                              </div>
                            </td>

                          </tr>

                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </div>

      </div>

      {/* APPROVAL CONFIRMATION MODAL */}

      {approvalTarget && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,.5)" }}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="approve-application-modal-title"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="approve-application-modal-title">
                  Approve Tester Application
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  disabled={actionLoadingId !== null}
                  onClick={() => setApprovalTarget(null)}
                />
              </div>
              <div className="modal-body">
                Approve <strong>{approvalTarget.testerProfile.fullName}</strong> for{" "}
                <strong>{approvalTarget.campaign.productName}</strong>?
                <p className="text-muted small mt-2 mb-0">
                  One campaign slot will be allocated and Task 1 will be unlocked.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  disabled={actionLoadingId !== null}
                  onClick={() => setApprovalTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  disabled={actionLoadingId !== null}
                  onClick={() => updateApplication(approvalTarget, "APPROVE")}
                >
                  {actionLoadingId !== null ? "Processing..." : "Approve Tester"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION MODAL — matches the application review page */}

      {rejectionTarget && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,.5)" }}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-application-modal-title"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="reject-application-modal-title">
                  Reject Application
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  disabled={actionLoadingId !== null}
                  onClick={() => {
                    setRejectionTarget(null);
                    setRejectionReason("");
                  }}
                />
              </div>
              <div className="modal-body">
                <p className="small text-muted">
                  {rejectionTarget.testerProfile.fullName} —{" "}
                  {rejectionTarget.campaign.productName}
                </p>
                <label className="form-label fw-semibold" htmlFor="rejection-reason">
                  Rejection Reason
                </label>
                <textarea
                  id="rejection-reason"
                  className="form-control"
                  rows={4}
                  value={rejectionReason}
                  disabled={actionLoadingId !== null}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  placeholder="Enter reason for rejecting this tester..."
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  disabled={actionLoadingId !== null}
                  onClick={() => {
                    setRejectionTarget(null);
                    setRejectionReason("");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={actionLoadingId !== null || !rejectionReason.trim()}
                  onClick={() => updateApplication(rejectionTarget, "REJECT")}
                >
                  {actionLoadingId !== null ? "Processing..." : "Confirm Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}