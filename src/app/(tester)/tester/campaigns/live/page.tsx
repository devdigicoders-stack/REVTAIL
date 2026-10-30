"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

type ApplicationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

type LiveCampaign = {
  id: number;

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
    | number
    | string;

  totalSlots: number;
  filledSlots: number;
  availableSlots: number;

  startDate: string;
  endDate: string;

  task4Required: boolean;

  brand: {
    id:
      | number
      | null;

    companyName:
      | string
      | null;

    categoryId:
      | number
      | null;

    category:
      | {
          id: number;
          name: string;
        }
      | null;
  };

  application:
    | {
        id: number;
        status:
          ApplicationStatus;
        appliedAt: string;
      }
    | null;

  canApply: boolean;
};

type LiveCampaignResponse = {
  success: boolean;

  message: string;

  data?: {
    tester: {
      id: number;
      fullName: string;
      city:
        | string
        | null;
      state:
        | string
        | null;

      interestIds:
        number[];
    };

    totalCampaigns: number;

    campaigns:
      LiveCampaign[];
  };
};

export default function LiveCampaignsPage() {
  // ============================================================
  // STATE
  // ============================================================

  const [
    campaigns,
    setCampaigns,
  ] =
    useState<
      LiveCampaign[]
    >([]);

  const [
    testerLocation,
    setTesterLocation,
  ] = useState<{
    city:
      | string
      | null;

    state:
      | string
      | null;
  }>({
    city: null,
    state: null,
  });

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

    const decodeHtml = (html: string) => {
    if (typeof window === "undefined") {
      return html;
    }

    const textarea =
      document.createElement(
        "textarea"
      );

    textarea.innerHTML =
      html;

    return textarea.value;
  };


  // ============================================================
  // LOAD LIVE CAMPAIGNS
  // ============================================================

  useEffect(() => {
    async function loadCampaigns() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            "/api/tester/campaigns/live",
            {
              method: "GET",

              cache:
                "no-store",
            }
          );

        const result =
          (await response.json()) as
            LiveCampaignResponse;

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Unable to load live campaigns."
          );
        }

        const testerInterestIds =
          result.data
            ?.tester
            .interestIds ??
          [];

        const interestMatchedCampaigns =
          (
            result.data
              ?.campaigns ??
            []
          ).filter(
            (campaign) =>
              campaign
                .brand
                .categoryId !==
                null &&
              testerInterestIds.includes(
                campaign
                  .brand
                  .categoryId
              )
          );

        setCampaigns(
          interestMatchedCampaigns
        );

        setTesterLocation({
          city:
            result.data
              ?.tester.city ??
            null,

          state:
            result.data
              ?.tester.state ??
            null,
        });
      } catch (err) {
        console.error(
          "Live campaigns error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load live campaigns."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCampaigns();
  }, []);

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
            />

            <div className="text-muted mt-3">
              Loading live campaigns...
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
                Unable to load campaigns
              </strong>

              <div className="small mt-1">
                {error}
              </div>
            </div>

          </div>

        </div>

      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <>
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="col-12">

        <div className="tester-live-page-header">

          <div>

            <h3 className="fw-bold mb-1">
              Live Campaigns
            </h3>

            <p className="text-muted mb-0">
              Campaigns currently available
              for your profile.
            </p>

          </div>

          <div className="tester-live-count">

            <span>
              {campaigns.length}
            </span>

            <small>
              Available
            </small>

          </div>

        </div>

      </div>

      {/* ======================================================
          LOCATION
      ====================================================== */}

      {testerLocation.city &&
        testerLocation.state && (

        <div className="col-12">

          <div className="tester-eligibility-bar">

            <div className="tester-eligibility-icon">
              <i className="bi bi-geo-alt-fill"></i>
            </div>

            <div>

              <div className="fw-semibold">
                Showing campaigns for you
              </div>

              <div className="small text-muted">
                {testerLocation.city},{" "}
                {testerLocation.state}
              </div>

            </div>

          </div>

        </div>

      )}

      {/* ======================================================
          EMPTY STATE
      ====================================================== */}

      {campaigns.length ===
        0 && (

        <div className="col-12">

          <div className="card border-0 shadow-sm">

            <div className="card-body text-center py-5">

              <div className="tester-empty-icon">
                <i className="bi bi-megaphone"></i>
              </div>

              <h5 className="fw-bold mt-3">
                No live campaigns right now
              </h5>

              <p className="text-muted mb-0">
                New campaigns matching
                your profile will
                appear here.
              </p>

            </div>

          </div>

        </div>

      )}

      {/* ======================================================
          DESKTOP DASHBOARD VIEW
      ====================================================== */}

      {campaigns.length >
        0 && (

        <div className="col-12 d-none d-md-block">

          <div className="row g-4">

            {campaigns.map(
              (
                campaign
              ) => (

                <div
                  key={
                    campaign.id
                  }
                  className="col-xl-4 col-lg-6"
                >

                  <div className="card tester-live-desktop-card border-0 shadow-sm h-100">

                    {/* Product Image */}

                    <div className="tester-live-desktop-image">

                      {campaign.productImage ? (

                        <img
                          src={
                            campaign.productImage
                          }
                          alt={
                            campaign.productName
                          }
                        />

                      ) : (

                        <div className="tester-campaign-image-placeholder">

                          <i className="bi bi-image"></i>

                        </div>

                      )}

                    </div>

                    <div className="card-body">

                      {/* Brand */}

                      <div className="tester-campaign-brand">

                        {
                          campaign
                            .brand
                            .companyName ??
                          "Brand"
                        }

                      </div>

                      {/* Product */}

                      <h5 className="fw-bold mb-2">

                        {
                          campaign.productName
                        }

                      </h5>

                      {campaign.productDescription && (

                        <div className="text-muted campaign-description"
                            dangerouslySetInnerHTML={{
                              __html:
                                decodeHtml(
                                  campaign.productDescription
                                ),
                            }}
                        />

                      )}

                      {/* Stats */}

                      <div className="tester-campaign-stats">

                        <div>

                          <span className="tester-stat-label">
                            Earn
                          </span>

                          <strong className="tester-stat-value">

                            ₹
                            {Number(
                              campaign.earningAmount
                            ).toLocaleString(
                              "en-IN"
                            )}

                          </strong>

                        </div>

                        <div>

                          <span className="tester-stat-label">
                            Slots
                          </span>

                          <strong className="tester-stat-value">

                            {
                              campaign.availableSlots
                            }

                          </strong>

                        </div>

                      </div>

                      {/* Task Count */}

                      <div className="tester-task-info">

                        <i className="bi bi-list-check"></i>

                        <span>

                          {
                            campaign.task4Required
                              ? "4 Tasks"
                              : "3 Tasks"
                          }

                        </span>

                      </div>

                    </div>

                    {/* Footer */}

                    <div className="card-footer bg-white border-0 pt-0 pb-4 px-4">

                      {campaign.canApply ? (

                        <Link
                          href={`/tester/campaigns/live/${campaign.id}`}
                          className="btn btn-primary w-100"
                        >
                          View Campaign
                        </Link>

                      ) : (

                        <div className="d-flex align-items-center gap-2">

                          <Link
                            href={`/tester/campaigns/live/${campaign.id}`}
                            className="btn btn-outline-primary flex-grow-1"
                          >
                            View
                          </Link>

                          {campaign.application && (

                            <span
                              className={`tester-application-status ${getApplicationClass(
                                campaign
                                  .application
                                  .status
                              )}`}
                            >

                              {
                                campaign
                                  .application
                                  .status
                              }

                            </span>

                          )}

                        </div>

                      )}

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        </div>

      )}

      {/* ======================================================
          MOBILE APP VIEW
      ====================================================== */}

      {campaigns.length > 0 && (
        <div className="col-12 d-md-none">
          <div className="tester-mobile-campaign-list">
            {campaigns.map((campaign) => {
              const filledCount =
                campaign.filledSlots ??
                (campaign.totalSlots - (campaign.availableSlots ?? 0));
              const isApplied = Boolean(campaign.application);

              return (
                <Link
                  key={campaign.id}
                  href={`/tester/campaigns/live/${campaign.id}`}
                  className="tester-mobile-campaign-card"
                >
                  {/* Square Product Image */}
                  <div className="tester-mobile-product-image">
                    {campaign.productImage ? (
                      <img
                        src={campaign.productImage}
                        alt={campaign.productName}
                      />
                    ) : (
                      <div className="tester-campaign-image-placeholder">
                        <i className="bi bi-image text-muted fs-4"></i>
                      </div>
                    )}
                  </div>

                  {/* Product Info & Stats */}
                  <div className="tester-mobile-product-info">
                    <div className="d-flex align-items-start justify-content-between gap-1">
                      <div className="tester-mobile-product-title">
                        {campaign.productName}
                      </div>
                      {isApplied && campaign.application && (
                        <span
                          className={`badge rounded-pill flex-shrink-0 bg-opacity-10 ${
                            campaign.application.status === "APPROVED"
                              ? "bg-success text-success"
                              : campaign.application.status === "REJECTED"
                              ? "bg-danger text-danger"
                              : "bg-warning text-dark"
                          }`}
                          style={{ fontSize: "10px", padding: "3px 8px" }}
                        >
                          {campaign.application.status}
                        </span>
                      )}
                    </div>

                    <div className="tester-mobile-brand-name">
                      {campaign.brand?.companyName ?? "Brand"}
                    </div>

                    {/* Stats */}
                    <div className="tester-mobile-stats-row">
                      <div className="tester-mobile-stat-col">
                        <div className="tester-mobile-stat-label">
                          <i className="bi bi-wallet2"></i>
                          <span>Earn Upto</span>
                        </div>
                        <div className="tester-mobile-stat-value-earn">
                          ₹{Number(campaign.earningAmount).toLocaleString("en-IN")}
                        </div>
                      </div>

                      <div className="tester-mobile-stat-col text-end">
                        <div className="tester-mobile-stat-label justify-content-end">
                          <i className="bi bi-people"></i>
                          <span>Slots</span>
                        </div>
                        <div className="tester-mobile-stat-value-slots">
                          {filledCount}/{campaign.totalSlots}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}


// ============================================================
// APPLICATION STATUS CLASS
// ============================================================

function getApplicationClass(
  status:
    | ApplicationStatus
    | null
) {
  switch (status) {
    case "PENDING":
      return "pending";

    case "APPROVED":
      return "approved";

    case "REJECTED":
      return "rejected";

    case "CANCELLED":
      return "cancelled";

    default:
      return "";
  }
}