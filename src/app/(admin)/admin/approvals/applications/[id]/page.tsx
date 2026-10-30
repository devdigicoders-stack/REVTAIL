"use client";

import Image from "next/image";
import Link from "next/link";

import {
  useParams,
  useRouter,
} from "next/navigation";

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

  reviewedAt:
    | string
    | null;

  rejectionReason:
    | string
    | null;

  testerProfile: {
    id: number;

    fullName: string;

    gender: string;

    dateOfBirth:
      | string
      | null;

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

    instagramId:
      | string
      | null;

    approvalStatus: string;

    user: {
      email:
        | string
        | null;

      mobile:
        | string
        | null;

      status: string;
    };

    interests: {
      interest: {
        id: number;
        name: string;
      };
    }[];
  };

  campaign: {
    id: number;

    campaignCode: string;

    productName: string;

    productImage:
      | string
      | null;

    productDescription:
      | string
      | null;

    productLink:
      | string
      | null;

    earningAmount:
      | string
      | number;

    currency: string;

    totalSlots: number;

    filledSlots: number;

    availableSlots:
      | number
      | null;

    targetGender: string;

    targetState:
      | string
      | null;

    targetCity:
      | string
      | null;

    startDate:
      | string
      | null;

    endDate:
      | string
      | null;

    task4Required: boolean;

    status: string;

    brand: {
      id: number;

      companyName: string;

      companyType: string;

      category: string;
    };

    images: {
      id: number;

      imagePath: string;

      imageOrder: number;
    }[];
  };
};

export default function AdminApplicationDetailsPage() {
  const params =
    useParams();

  const router =
    useRouter();

  const applicationId =
    Array.isArray(
      params.id
    )
      ? params.id[0]
      : params.id;

  const [
    application,
    setApplication,
  ] =
    useState<Application | null>(
      null
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

  const [
    actionLoading,
    setActionLoading,
  ] =
    useState(false);

  const [
    rejectionReason,
    setRejectionReason,
  ] =
    useState("");

  const [
    showRejectModal,
    setShowRejectModal,
  ] =
    useState(false);

  // ==========================================================
  // LOAD
  // ==========================================================

  useEffect(() => {
    if (!applicationId) {
      return;
    }

    const loadApplication =
      async () => {
        try {
          setLoading(true);

          setError("");

          const response =
            await fetch(
              `/api/admin/applications/${applicationId}`,
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
                "Failed to load application."
            );
          }

          setApplication(
            result.data
          );
        } catch (err) {
          console.error(
            "LOAD APPLICATION ERROR:",
            err
          );

          setError(
            err instanceof
              Error
              ? err.message
              : "Failed to load application."
          );
        } finally {
          setLoading(
            false
          );
        }
      };

    loadApplication();
  }, [applicationId]);

  // ==========================================================
  // SAFE DATE FORMATTER
  // ==========================================================

  const formatDate = (
    value:
      | string
      | null
      | undefined
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

  // ==========================================================
  // UPDATE
  // ==========================================================

  const updateApplication =
    async (
      action:
        | "APPROVE"
        | "REJECT"
    ) => {
      try {
        setActionLoading(
          true
        );

        setError("");

        const response =
          await fetch(
            `/api/admin/applications/${applicationId}`,
            {
              method:
                "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              credentials:
                "include",

              body:
                JSON.stringify({
                  action,

                  reason:
                    action ===
                    "REJECT"
                      ? rejectionReason
                      : undefined,
                }),
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Unable to update application."
          );
        }

        setShowRejectModal(
          false
        );

        window.alert(
          result.message +
            (result.whatsappSent === true
              ? "\n\nWhatsApp notification sent successfully."
              : result.whatsappSent === false
                ? "\n\nWhatsApp notification was not sent: " +
                  (result.whatsappError || "Unknown delivery error.")
                : "")
        );

        router.push(
          "/admin/approvals/applications"
        );

        router.refresh();
      } catch (err) {
        console.error(
          "UPDATE APPLICATION UI ERROR:",
          err
        );

        setError(
          err instanceof
            Error
            ? err.message
            : "Unable to update application."
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  if (loading) {
    return (
      <div className="col-12 text-center py-5">

        <div className="spinner-border text-primary" />

        <p className="text-muted mt-3">
          Loading tester application...
        </p>

      </div>
    );
  }

  if (!application) {
    return (
      <div className="col-12">

        <div className="alert alert-danger">

          {error ||
            "Application not found."}

        </div>

        <Link
          href="/admin/approvals/applications"
          className="btn btn-outline-secondary"
        >
          Back
        </Link>

      </div>
    );
  }

  const tester =
    application.testerProfile;

  const campaign =
    application.campaign;

  const availableSlots =
    campaign.availableSlots ??
    Math.max(
      0,
      campaign.totalSlots -
        campaign.filledSlots
    );

  const canApprove =
    application.status ===
      "PENDING" &&
    campaign.status ===
      "LIVE" &&
    availableSlots > 0 &&
    tester.approvalStatus ===
      "APPROVED";

  return (
    <>
      {/* HEADER */}

      <div className="col-12">

        <Link
          href="/admin/approvals/applications"
          className="text-decoration-none text-muted"
        >

          <i className="bi bi-arrow-left me-2" />

          Tester Applications

        </Link>

        <div className="d-flex justify-content-between align-items-start mt-3">

          <div>

            <h4 className="fw-bold mb-1">
              Review Tester Application
            </h4>

            <p className="text-muted mb-0">
              Review tester eligibility and campaign availability before approval.
            </p>

          </div>

          <span className="badge bg-warning-subtle text-warning-emphasis fs-6">

            {
              application.status
            }

          </span>

        </div>

      </div>

      {error && (

        <div className="col-12">

          <div className="alert alert-danger">

            <i className="bi bi-exclamation-triangle me-2" />

            {error}

          </div>

        </div>

      )}

      {/* TESTER */}

      <div className="col-lg-6">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-body p-4">

            <h5 className="fw-bold mb-4">
              Tester Details
            </h5>

            <div className="d-flex align-items-center gap-3 mb-4">

              {tester.profileImage ? (

                <Image
                  src={
                    tester.profileImage
                  }
                  alt={
                    tester.fullName
                  }
                  width={80}
                  height={80}
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
                      "80px",

                    height:
                      "80px",
                  }}
                >

                  <i className="bi bi-person fs-2" />

                </div>

              )}

              <div>

                <h5 className="mb-1">

                  {
                    tester.fullName
                  }

                </h5>

                <span className="badge bg-success-subtle text-success">

                  {
                    tester.approvalStatus
                  }

                </span>

              </div>

            </div>

            <div className="row g-3">

              <div className="col-md-6">

                <small className="text-muted">
                  Gender
                </small>

                <div className="fw-semibold">
                  {tester.gender}
                </div>

              </div>

              <div className="col-md-6">

                <small className="text-muted">
                  Date of Birth
                </small>

                <div className="fw-semibold">

                  {formatDate(
                    tester.dateOfBirth
                  )}

                </div>

              </div>

              <div className="col-md-6">

                <small className="text-muted">
                  Mobile
                </small>

                <div className="fw-semibold">

                  {tester.user.mobile ??
                    "-"}

                </div>

              </div>

              <div className="col-md-6">

                <small className="text-muted">
                  Email
                </small>

                <div className="fw-semibold text-break">

                  {tester.user.email ??
                    "-"}

                </div>

              </div>

              <div className="col-md-6">

                <small className="text-muted">
                  City
                </small>

                <div className="fw-semibold">

                  {tester.city ??
                    "-"}

                </div>

              </div>

              <div className="col-md-6">

                <small className="text-muted">
                  State
                </small>

                <div className="fw-semibold">

                  {tester.state ??
                    "-"}

                </div>

              </div>

              <div className="col-md-6">

                <small className="text-muted">
                  PIN Code
                </small>

                <div className="fw-semibold">

                  {
                    tester.pinCode
                  }

                </div>

              </div>

            </div>

            {tester.interests.length >
              0 && (

              <div className="mt-4">

                <small className="text-muted d-block mb-2">
                  Interests
                </small>

                <div className="d-flex flex-wrap gap-2">

                  {tester.interests.map(
                    (item) => (

                      <span
                        key={
                          item.interest.id
                        }
                        className="badge bg-light text-dark border"
                      >

                        {
                          item.interest.name
                        }

                      </span>

                    )
                  )}

                </div>

              </div>

            )}

          </div>

        </div>

      </div>

      {/* CAMPAIGN */}

      <div className="col-lg-6">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-body p-4">

            <h5 className="fw-bold mb-4">
              Campaign Details
            </h5>

            <h5 className="fw-bold">

              {
                campaign.productName
              }

            </h5>

            <div className="text-muted mb-3">

              {
                campaign.campaignCode
              }

            </div>

            <div className="mb-3">

              Brand:{" "}

              <strong>

                {
                  campaign.brand.companyName
                }

              </strong>

            </div>

            <div className="row g-3">

              <div className="col-6">

                <small className="text-muted">
                  Earning
                </small>

                <div className="fs-5 fw-bold text-success">

                  ₹
                  {Number(
                    campaign.earningAmount
                  ).toLocaleString(
                    "en-IN"
                  )}

                </div>

              </div>

              <div className="col-6">

                <small className="text-muted">
                  Available Slots
                </small>

                <div className="fs-5 fw-bold">

                  {
                    availableSlots
                  }

                </div>

              </div>

              <div className="col-6">

                <small className="text-muted">
                  Start
                </small>

                <div className="fw-semibold">

                  {formatDate(
                    campaign.startDate
                  )}

                </div>

              </div>

              <div className="col-6">

                <small className="text-muted">
                  End
                </small>

                <div className="fw-semibold">

                  {formatDate(
                    campaign.endDate
                  )}

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ACTION */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body">

            <div className="d-flex flex-column flex-md-row justify-content-between gap-3">

              <Link
                href="/admin/approvals/applications"
                className="btn btn-outline-secondary"
              >
                Back
              </Link>

              {application.status ===
                "PENDING" && (

                <div className="d-flex gap-2">

                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    disabled={
                      actionLoading
                    }
                    onClick={() =>
                      setShowRejectModal(
                        true
                      )
                    }
                  >

                    <i className="bi bi-x-circle me-2" />

                    Reject

                  </button>

                  <button
                    type="button"
                    className="btn btn-success"
                    disabled={
                      actionLoading ||
                      !canApprove
                    }
                    onClick={() => {

                      const confirmed =
                        window.confirm(
                          `Approve ${tester.fullName} for ${campaign.productName}? One campaign slot will be allocated and Task 1 will be unlocked.`
                        );

                      if (
                        confirmed
                      ) {
                        updateApplication(
                          "APPROVE"
                        );
                      }
                    }}
                  >

                    {actionLoading ? (

                      <>
                        <span className="spinner-border spinner-border-sm me-2" />

                        Processing...
                      </>

                    ) : (

                      <>
                        <i className="bi bi-check-circle me-2" />

                        Approve Tester
                      </>

                    )}

                  </button>

                </div>

              )}

            </div>

            {!canApprove &&
              application.status ===
                "PENDING" && (

                <div className="alert alert-warning mt-3 mb-0">

                  {!availableSlots
                    ? "This campaign has no available slots."
                    : campaign.status !==
                      "LIVE"
                    ? "This campaign is no longer LIVE."
                    : tester.approvalStatus !==
                      "APPROVED"
                    ? "This Tester profile is not approved."
                    : "This application cannot currently be approved."}

                </div>

              )}

          </div>

        </div>

      </div>

      {/* REJECT MODAL */}

      {showRejectModal && (

        <div
          className="modal fade show"
          style={{
            display:
              "block",

            backgroundColor:
              "rgba(0,0,0,.5)",
          }}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
        >

          <div className="modal-dialog modal-dialog-centered">

            <div className="modal-content">

              <div className="modal-header">

                <h5 className="modal-title">
                  Reject Application
                </h5>

                <button
                  type="button"
                  className="btn-close"
                  disabled={
                    actionLoading
                  }
                  onClick={() =>
                    setShowRejectModal(
                      false
                    )
                  }
                />

              </div>

              <div className="modal-body">

                <label className="form-label fw-semibold">
                  Rejection Reason
                </label>

                <textarea
                  className="form-control"
                  rows={4}
                  value={
                    rejectionReason
                  }
                  disabled={
                    actionLoading
                  }
                  onChange={(e) =>
                    setRejectionReason(
                      e.target.value
                    )
                  }
                  placeholder="Enter reason for rejecting this tester..."
                />

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="btn btn-light"
                  disabled={
                    actionLoading
                  }
                  onClick={() =>
                    setShowRejectModal(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={
                    actionLoading ||
                    !rejectionReason.trim()
                  }
                  onClick={() =>
                    updateApplication(
                      "REJECT"
                    )
                  }
                >

                  {actionLoading
                    ? "Processing..."
                    : "Confirm Reject"}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}
    </>
  );
}