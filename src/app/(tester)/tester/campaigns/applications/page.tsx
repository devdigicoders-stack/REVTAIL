"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

type ApplicationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

type TesterCampaignStatus =
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED";

type CampaignApplication = {
  id: number;

  status:
    ApplicationStatus;

  appliedAt:
    string;

  reviewedAt:
    | string
    | null;

  rejectionReason:
    | string
    | null;

  campaign: {
    id: number;

    productName:
      string;

    productImage:
      | string
      | null;

    productDescription:
      | string
      | null;

    earningAmount:
      | number
      | string;

    startDate:
      | string
      | null;

    endDate:
      | string
      | null;

    availableSlots:
      number;

    task4Required:
      boolean;

    brandName:
      | string
      | null;
  };

  testerCampaign:
    | {
        id:
          number;

        status:
          TesterCampaignStatus;

        currentTask:
          number;
      }
    | null;
};

type ApplicationsResponse = {
  success:
    boolean;

  message:
    string;

  data?: {
    tester: {
      id:
        number;

      fullName:
        string;
    };

    totalApplications:
      number;

    applications:
      CampaignApplication[];
  };
};


export default function TesterCampaignApplicationsPage() {
  // ============================================================
  // STATE
  // ============================================================

  const [
    applications,
    setApplications,
  ] =
    useState<
      CampaignApplication[]
    >([]);

  const [
    testerName,
    setTesterName,
  ] =
    useState("");

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

  // ============================================================
  // LOAD APPLICATIONS
  // ============================================================

  useEffect(() => {
    async function loadApplications() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            "/api/tester/campaigns/applications",
            {
              method:
                "GET",

              cache:
                "no-store",
            }
          );

        const result =
          (await response.json()) as
            ApplicationsResponse;

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Unable to load campaign applications."
          );
        }

        setApplications(
          result.data
            ?.applications ??
            []
        );

        setTesterName(
          result.data
            ?.tester
            .fullName ??
            ""
        );
      } catch (err) {
        console.error(
          "Campaign applications error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load campaign applications."
        );
      } finally {
        setLoading(false);
      }
    }

    loadApplications();
  }, []);

  // ============================================================
  // SUMMARY COUNTS
  // ============================================================

  const summary =
    useMemo(
      () => {
        const pending =
          applications.filter(
            (application) =>
              application.status ===
              "PENDING"
          ).length;

        const approved =
          applications.filter(
            (application) =>
              application.status ===
              "APPROVED"
          ).length;

        const rejected =
          applications.filter(
            (application) =>
              application.status ===
              "REJECTED"
          ).length;

        const assigned =
          applications.filter(
            (application) =>
              application
                .testerCampaign !==
              null
          ).length;

        return {
          pending,
          approved,
          rejected,
          assigned,
        };
      },
      [
        applications,
      ]
    );

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
            ></div>

            <div className="text-muted mt-3">
              Loading your campaign applications...
            </div>

          </div>

        </div>

      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <div className="col-12">

        <div className="alert alert-danger border-0 shadow-sm">

          <div className="d-flex align-items-start gap-2">

            <i className="bi bi-exclamation-circle"></i>

            <div>
              <strong>
                Unable to load applications
              </strong>

              <div className="small mt-1">
                {error}
              </div>
            </div>

          </div>

        </div>

        <Link
          href="/tester/campaigns/live"
          className="btn btn-outline-primary"
        >
          <i className="bi bi-arrow-left me-2"></i>
          Browse Live Campaigns
        </Link>

      </div>
    );
  }

  return (
    <>
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="col-12">

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">

          <div>

            <h3 className="fw-bold mb-1">
              My Campaigns
            </h3>

            <p className="text-muted mb-0">
              {testerName
                ? `${testerName}, track your campaign applications and assigned campaigns here.`
                : "Track your campaign applications and assigned campaigns here."}
            </p>

          </div>

          <Link
            href="/tester/campaigns/live"
            className="btn btn-primary"
          >
            <i className="bi bi-search me-2"></i>
            Find Campaigns
          </Link>

        </div>

      </div>

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div className="col-xl-3 col-md-6">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-body">

            <div className="text-muted small mb-1">
              Total Applications
            </div>

            <div className="d-flex align-items-center justify-content-between">

              <h3 className="fw-bold mb-0">
                {
                  applications.length
                }
              </h3>

              <i className="bi bi-send-check fs-2 text-primary"></i>

            </div>

          </div>

        </div>

      </div>

      <div className="col-xl-3 col-md-6">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-body">

            <div className="text-muted small mb-1">
              Pending Review
            </div>

            <div className="d-flex align-items-center justify-content-between">

              <h3 className="fw-bold mb-0">
                {
                  summary.pending
                }
              </h3>

              <i className="bi bi-clock-history fs-2 text-warning"></i>

            </div>

          </div>

        </div>

      </div>

      <div className="col-xl-3 col-md-6">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-body">

            <div className="text-muted small mb-1">
              Approved
            </div>

            <div className="d-flex align-items-center justify-content-between">

              <h3 className="fw-bold mb-0">
                {
                  summary.approved
                }
              </h3>

              <i className="bi bi-check-circle fs-2 text-success"></i>

            </div>

          </div>

        </div>

      </div>

      <div className="col-xl-3 col-md-6">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-body">

            <div className="text-muted small mb-1">
              Assigned Campaigns
            </div>

            <div className="d-flex align-items-center justify-content-between">

              <h3 className="fw-bold mb-0">
                {
                  summary.assigned
                }
              </h3>

              <i className="bi bi-megaphone fs-2 text-info"></i>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          EMPTY
      ====================================================== */}

      {applications.length ===
        0 && (

        <div className="col-12">

          <div className="card border-0 shadow-sm">

            <div className="card-body text-center py-5">

              <div className="fs-1 text-muted mb-3">
                <i className="bi bi-send"></i>
              </div>

              <h5 className="fw-bold">
                No campaign applications yet
              </h5>

              <p className="text-muted">
                Browse live campaigns and apply to campaigns that match your profile.
              </p>

              <Link
                href="/tester/campaigns/live"
                className="btn btn-primary"
              >
                Browse Live Campaigns
              </Link>

            </div>

          </div>

        </div>

      )}

      {/* ======================================================
          APPLICATIONS
      ====================================================== */}

      {applications.length >
        0 && (

        <div className="col-12">

          <div className="card border-0 shadow-sm">

            <div className="card-header bg-white border-0 pt-4 px-4">

              <div className="d-flex justify-content-between align-items-center">

                <div>

                  <h5 className="fw-bold mb-1">
                    Campaign Applications
                  </h5>

                  <p className="text-muted small mb-0">
                    Your latest applications are shown first.
                  </p>

                </div>

              </div>

            </div>

            <div className="card-body px-4">

              <div className="d-flex flex-column gap-3">

                {applications.map(
                  (
                    application
                  ) => (

                    <div
                      key={
                        application.id
                      }
                      className="border rounded-3 p-3"
                    >

                      <div className="row g-3 align-items-center">

                        {/* IMAGE */}

                        <div className="col-auto">

                          <div
                            className="rounded overflow-hidden bg-light d-flex align-items-center justify-content-center"
                            style={{
                              width:
                                "84px",

                              height:
                                "84px",
                            }}
                          >

                            {application
                              .campaign
                              .productImage ? (

                              <img
                                src={
                                  application
                                    .campaign
                                    .productImage
                                }
                                alt={
                                  application
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

                              <i className="bi bi-image fs-3 text-muted"></i>

                            )}

                          </div>

                        </div>

                        {/* CAMPAIGN */}

                        <div className="col">

                          <div className="text-primary small fw-semibold mb-1">

                            {
                              application
                                .campaign
                                .brandName ??
                              "Brand"
                            }

                          </div>

                          <h6 className="fw-bold mb-1">

                            {
                              application
                                .campaign
                                .productName
                            }

                          </h6>
                     

                          <div className="d-flex flex-wrap gap-3 small">

                            <div>
                              <span className="text-muted">
                                Earn:{" "}
                              </span>

                              <strong>
                                ₹
                                {Number(
                                  application
                                    .campaign
                                    .earningAmount
                                ).toLocaleString(
                                  "en-IN"
                                )}
                              </strong>
                            </div>

                            <div>
                              <span className="text-muted">
                                Applied:{" "}
                              </span>

                              <strong>
                                {formatDate(
                                  application
                                    .appliedAt
                                )}
                              </strong>
                            </div>

                            <div>
                              <span className="text-muted">
                                Tasks:{" "}
                              </span>

                              <strong>
                                {application
                                  .campaign
                                  .task4Required
                                  ? "4"
                                  : "3"}
                              </strong>
                            </div>

                          </div>

                        </div>

                        {/* STATUS + ACTION */}

                        <div className="col-12 col-lg-auto">

                          <div className="d-flex flex-column align-items-lg-end gap-2">

                            <span
                              className={`badge ${getApplicationBadgeClass(
                                application
                                  .status
                              )}`}
                            >
                              {
                                getApplicationStatusLabel(
                                  application
                                    .status
                                )
                              }
                            </span>

                            {application
                              .testerCampaign ? (

                              <AssignedCampaignAction
                                testerCampaign={
                                  application
                                    .testerCampaign
                                }
                              />

                            ) : (

                              <Link
                                href={`/tester/campaigns/live/${application.campaign.id}`}
                                className="btn btn-sm btn-outline-primary"
                              >
                                View Campaign
                              </Link>

                            )}

                          </div>

                        </div>

                      </div>

                      {/* REJECTION */}

                      {application.status ===
                        "REJECTED" &&
                        application
                          .rejectionReason && (

                        <div className="alert alert-danger py-2 px-3 mt-3 mb-0 small">

                          <i className="bi bi-exclamation-circle me-2"></i>

                          <strong>
                            Reason:
                          </strong>{" "}

                          {
                            application
                              .rejectionReason
                          }

                        </div>

                      )}

                      {/* ASSIGNED */}

                      {application
                        .testerCampaign && (

                        <div className="alert alert-success py-2 px-3 mt-3 mb-0 small">

                          <i className="bi bi-check-circle me-2"></i>

                          Campaign assigned to you.

                          {application
                            .testerCampaign
                            .status ===
                            "ONGOING" && (
                            <>
                              {" "}
                              Current task:{" "}
                              <strong>
                                Task{" "}
                                {
                                  application
                                    .testerCampaign
                                    .currentTask
                                }
                              </strong>
                            </>
                          )}

                        </div>

                      )}

                    </div>

                  )
                )}

              </div>

            </div>

          </div>

        </div>

      )}
    </>
  );
}


// ============================================================
// ASSIGNED CAMPAIGN ACTION
// ============================================================

function AssignedCampaignAction({
  testerCampaign,
}: {
  testerCampaign: {
    id:
      number;

    status:
      TesterCampaignStatus;

    currentTask:
      number;
  };
}) {
  if (
    testerCampaign.status ===
    "ONGOING"
  ) {
    return (
      <Link
        href={`/tester/campaigns/ongoing/${testerCampaign.id}`}
        className="btn btn-sm btn-primary"
      >
        Open Campaign

        <i className="bi bi-arrow-right ms-2"></i>
      </Link>
    );
  }

  if (
    testerCampaign.status ===
    "COMPLETED"
  ) {
    return (
      <Link
        href={`/tester/campaigns/history/${testerCampaign.id}`}
        className="btn btn-sm btn-outline-success"
      >
        View Completed
      </Link>
    );
  }

  return (
    <span className="small text-muted">
      Campaign{" "}
      {
        testerCampaign.status
      }
    </span>
  );
}


// ============================================================
// APPLICATION BADGE
// ============================================================

function getApplicationBadgeClass(
  status:
    ApplicationStatus
) {
  switch (status) {
    case "PENDING":
      return "bg-warning text-dark";

    case "APPROVED":
      return "bg-success";

    case "REJECTED":
      return "bg-danger";

    case "CANCELLED":
      return "bg-secondary";

    default:
      return "bg-secondary";
  }
}


// ============================================================
// APPLICATION STATUS LABEL
// ============================================================

function getApplicationStatusLabel(
  status:
    ApplicationStatus
) {
  switch (status) {
    case "PENDING":
      return "Pending";

    case "APPROVED":
      return "Approved";

    case "REJECTED":
      return "Rejected";

    case "CANCELLED":
      return "Cancelled";

    default:
      return status;
  }
}


// ============================================================
// DATE FORMAT
// ============================================================

function formatDate(
  value:
    | string
    | null
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

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",
    }
  ).format(
    date
  );
}
