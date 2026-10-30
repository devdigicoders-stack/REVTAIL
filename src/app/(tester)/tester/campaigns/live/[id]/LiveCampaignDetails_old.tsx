"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
} from "react";

// ============================================================
// TYPES
// ============================================================

type CampaignImage = {
  id?: number;

  imagePath: string;

  imageOrder: number;
};

type Brand = {
  id: number | null;

  companyName: string | null;
};

type Application = {
  id: number;

  status: string;

  appliedAt?: string | null;

  reviewedAt?: string | null;

  rejectionReason?:
    | string
    | null;
};

type TaskStep = {
  number: number;

  title: string;

  description?: string;
};

type CampaignDetails = {
  id: number;

  campaignCode?: string;

  productName: string;

  productImage?:
    | string
    | null;

  productLink?:
    | string
    | null;

  productDescription?:
    | string
    | null;

  brand: Brand;
  

  earningAmount:
    | string
    | number;

  currency?: string;

  status: string;

  totalSlots?: number;

  filledSlots?: number;

  availableSlots?: number;

  slots?: {
    total: number;

    filled: number;

    available: number;
  };

  startDate?:
    | string
    | null;

  endDate?:
    | string
    | null;

  task4Required: boolean;

  images?: CampaignImage[];

  tasks?: TaskStep[];

  application:
    | Application
    | null;

  canApply: boolean;
};

type CampaignDetailsApiResponse = {
  success: boolean;

  message?: string;

  data?: {
    campaign: Omit<
      CampaignDetails,
      "application" | "canApply" | "tasks"
    >;

    application: Application | null;

    canApply: boolean;

    steps?: Array<{
      taskNumber: number;
      title: string;
      description?: string;
    }>;
  };
};

// ============================================================
// PROPS
// ============================================================

type Props = {
  campaignId: number;

  userId: number;
};

// ============================================================
// COMPONENT
// ============================================================

export default function LiveCampaignDetails({
  campaignId,
  userId,
}: Props) {
  const router =
    useRouter();

  // ==========================================================
  // STATE
  // ==========================================================

  const [
    campaign,
    setCampaign,
  ] =
    useState<CampaignDetails | null>(
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
    selectedImage,
    setSelectedImage,
  ] =
    useState<string | null>(
      null
    );

  const [
    applying,
    setApplying,
  ] =
    useState(false);

  const [
    applyError,
    setApplyError,
  ] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState("");

  const [
    showConfirmModal,
    setShowConfirmModal,
  ] =
    useState(false);

  // ==========================================================
  // LOAD CAMPAIGN
  // ==========================================================

  const loadCampaign =
    async () => {
      try {
        setLoading(true);

        setError("");

        const response =
          await fetch(
            `/api/tester/campaigns/${campaignId}`,
            // `/api/tester/campaigns/${campaignId}?userId=${userId}`,
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

        if (
          !response.ok
        ) {
          throw new Error(
            result.message ||
              "Unable to load campaign."
          );
        }

        const apiResult =
          result as CampaignDetailsApiResponse;

        if (
          !apiResult.data ||
          !apiResult.data.campaign
        ) {
          throw new Error(
            "Campaign data is missing from the API response."
          );
        }

        const campaignData: CampaignDetails = {
          ...apiResult.data.campaign,

          application:
            apiResult.data.application ??
            null,

          canApply:
            Boolean(
              apiResult.data.canApply
            ),

          tasks:
            apiResult.data.steps?.map(
              (step) => ({
                number:
                  step.taskNumber,

                title:
                  step.title,

                description:
                  step.description,
              })
            ),
        };

        setCampaign(
          campaignData
        );

        // ====================================================
        // SELECT PRIMARY IMAGE
        // ====================================================

        if (
          campaignData
            .images &&
          campaignData
            .images.length >
            0
        ) {
          const ordered =
            [
              ...campaignData.images,
            ].sort(
              (
                a,
                b
              ) =>
                a.imageOrder -
                b.imageOrder
            );

          setSelectedImage(
            ordered[0]
              .imagePath
          );
        } else if (
          campaignData.productImage
        ) {
          setSelectedImage(
            campaignData.productImage
          );
        }
      } catch (err) {
        console.error(
          "TESTER CAMPAIGN DETAILS ERROR:",
          err
        );

        setError(
          err instanceof
            Error
            ? err.message
            : "Unable to load campaign."
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  useEffect(() => {
    loadCampaign();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  // ==========================================================
  // APPLY
  // ==========================================================

  const applyForCampaign =
    async () => {
      try {
        setApplying(
          true
        );

        setApplyError(
          ""
        );

        setSuccessMessage(
          ""
        );

        const response =
          await fetch(
            "/api/tester/campaigns/apply",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              credentials:
                "include",

              body:
                JSON.stringify(
                  {
                    userId,

                    campaignId,
                  }
                ),
            }
          );

        const result =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            result.message ||
              "Unable to apply for this campaign."
          );
        }

        setSuccessMessage(
          result.message ||
            "Your application has been submitted successfully."
        );

        setShowConfirmModal(
          false
        );

        // ====================================================
        // REFRESH DETAILS
        //
        // This retrieves application.status=PENDING and
        // canApply=false from Tester campaign details API.
        // ====================================================

        await loadCampaign();

        router.refresh();
      } catch (err) {
        console.error(
          "CAMPAIGN APPLY ERROR:",
          err
        );

        setApplyError(
          err instanceof
            Error
            ? err.message
            : "Unable to apply for this campaign."
        );
      } finally {
        setApplying(
          false
        );
      }
    };

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatDate = (
    value?:
      | string
      | null
  ) => {
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
        day: "2-digit",

        month:
          "short",

        year:
          "numeric",
      }
    ).format(date);
  };

  // ==========================================================
  // FORMAT AMOUNT
  // ==========================================================

  const formatAmount = (
    value:
      | number
      | string
  ) => {
    return Number(
      value
    ).toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2,
      }
    );
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="col-12">

        <div className="card border-0 shadow-sm text-center py-5">

          <div className="card-body">

            <div
              className="spinner-border text-primary"
              role="status"
            >
              <span className="visually-hidden">
                Loading...
              </span>
            </div>

            <p className="text-muted mt-3 mb-0">
              Loading campaign...
            </p>

          </div>

        </div>

      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (
    error ||
    !campaign
  ) {
    return (
      <div className="col-12">

        <div className="alert alert-danger">

          <i className="bi bi-exclamation-triangle me-2"></i>

          {error ||
            "Campaign not found."}

        </div>

        <Link
          href="/tester/campaigns/live"
          className="btn btn-outline-secondary"
        >
          <i className="bi bi-arrow-left me-2"></i>

          Back to Live Campaigns
        </Link>

      </div>
    );
  }

  // ==========================================================
  // SLOT DATA
  //
  // Supports both tester-specific API shape:
  // slots.available
  //
  // and normal Campaign shape:
  // availableSlots
  // ==========================================================

  const totalSlots =
    campaign.slots
      ?.total ??
    campaign.totalSlots ??
    0;

  const filledSlots =
    campaign.slots
      ?.filled ??
    campaign.filledSlots ??
    0;

  const availableSlots =
    campaign.slots
      ?.available ??
    campaign.availableSlots ??
    0;

  // ==========================================================
  // IMAGE GALLERY
  // ==========================================================

  const campaignImages =
    campaign.images &&
    campaign.images
      .length > 0
      ? [
          ...campaign.images,
        ].sort(
          (
            a,
            b
          ) =>
            a.imageOrder -
            b.imageOrder
        )
      : campaign.productImage
      ? [
          {
            imagePath:
              campaign.productImage,

            imageOrder:
              0,
          },
        ]
      : [];

  // ==========================================================
  // APPLICATION STATUS
  // ==========================================================

  const application =
    campaign.application;

  const alreadyApplied =
    application !== null;

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <>
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="col-12">

        <div className="d-flex justify-content-between align-items-center gap-3">

          <div>

            <div className="mb-2">

              <Link
                href="/tester/campaigns/live"
                className="text-decoration-none text-muted"
              >
                <i className="bi bi-arrow-left me-1"></i>

                Live Campaigns
              </Link>

            </div>

            <h4 className="fw-bold mb-1">
              Campaign Details
            </h4>

            <p className="text-muted mb-0">
              Review the campaign details before applying.
            </p>

          </div>

          <span className="badge bg-success fs-6 px-3 py-2">
            LIVE
          </span>

        </div>

      </div>

      {/* ======================================================
          SUCCESS MESSAGE
      ====================================================== */}

      {successMessage && (

        <div className="col-12">

          <div className="alert alert-success">

            <i className="bi bi-check-circle-fill me-2"></i>

            {
              successMessage
            }

          </div>

        </div>

      )}

      {/* ======================================================
          APPLY ERROR
      ====================================================== */}

      {applyError &&
        !showConfirmModal && (

          <div className="col-12">

            <div className="alert alert-danger">

              <i className="bi bi-exclamation-circle me-2"></i>

              {
                applyError
              }

            </div>

          </div>

        )}

      {/* ======================================================
          PRODUCT IMAGE
      ====================================================== */}

      <div className="col-xl-5">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-body p-4">

            {/* Main image */}

            <div
              className="border rounded bg-light d-flex align-items-center justify-content-center overflow-hidden mb-3"
              style={{
                minHeight:
                  "320px",
              }}
            >

              {selectedImage ? (

                <Image
                  src={
                    selectedImage
                  }
                  alt={
                    campaign.productName
                  }
                  width={500}
                  height={400}
                  style={{
                    width:
                      "100%",

                    height:
                      "320px",

                    objectFit:
                      "contain",
                  }}
                />

              ) : (

                <div className="text-center text-muted">

                  <i className="bi bi-image fs-1"></i>

                  <div>
                    No image
                  </div>

                </div>

              )}

            </div>

            {/* Thumbnails */}

            {campaignImages.length >
              1 && (

              <div className="d-flex flex-wrap gap-2">

                {campaignImages.map(
                  (
                    campaignImage,
                    index
                  ) => {

                    const selected =
                      selectedImage ===
                      campaignImage.imagePath;

                    return (

                      <button
                        key={
                          `${campaignImage.imagePath}-${index}`
                        }
                        type="button"
                        className={`border rounded bg-white p-1 ${
                          selected
                            ? "border-primary border-2"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedImage(
                            campaignImage.imagePath
                          )
                        }
                        style={{
                          width:
                            "65px",

                          height:
                            "65px",
                        }}
                      >

                        <Image
                          src={
                            campaignImage.imagePath
                          }
                          alt={`${campaign.productName} ${index + 1}`}
                          width={55}
                          height={55}
                          style={{
                            width:
                              "100%",

                            height:
                              "100%",

                            objectFit:
                              "cover",
                          }}
                        />

                      </button>

                    );
                  }
                )}

              </div>

            )}

          </div>

        </div>

      </div>

      {/* ======================================================
          CAMPAIGN INFORMATION
      ====================================================== */}

      <div className="col-xl-7">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-body p-4">

            <div className="mb-2">

              <span className="badge bg-primary-subtle text-primary">

                {
                  campaign.brand?.companyName ||
                  "-"
                }

              </span>

            </div>

            <h3 className="fw-bold">

              {
                campaign.productName
              }

            </h3>

            {campaign.campaignCode && (

              <div className="text-muted small mb-3">

                Campaign:{" "}

                {
                  campaign.campaignCode
                }

              </div>

            )}

            {/* Description */}

            {campaign.productDescription && (

              <p className="text-muted">

                {
                  campaign.productDescription
                }

              </p>

            )}

            <hr />

            {/* ==================================================
                EARNING + SLOTS
            ================================================== */}

            <div className="row g-3 mb-4">

              <div className="col-6">

                <div className="border rounded p-3">

                  <small className="text-muted d-block">
                    You Earn
                  </small>

                  <span className="fs-4 fw-bold text-success">

                    ₹
                    {formatAmount(
                      campaign.earningAmount
                    )}

                  </span>

                </div>

              </div>

              <div className="col-6">

                <div className="border rounded p-3">

                  <small className="text-muted d-block">
                    Available Slots
                  </small>

                  <span className="fs-4 fw-bold">

                    {
                      availableSlots
                    }

                  </span>

                  <small className="text-muted">
                    {" "}
                    /{" "}
                    {
                      totalSlots
                    }
                  </small>

                </div>

              </div>

            </div>

            {/* ==================================================
                CAMPAIGN DATES
            ================================================== */}

            <div className="row g-3 mb-4">

              <div className="col-sm-6">

                <div className="text-muted small">
                  Start Date
                </div>

                <div className="fw-semibold">

                  {formatDate(
                    campaign.startDate
                  )}

                </div>

              </div>

              <div className="col-sm-6">

                <div className="text-muted small">
                  End Date
                </div>

                <div className="fw-semibold">

                  {formatDate(
                    campaign.endDate
                  )}

                </div>

              </div>

            </div>

            {/* ==================================================
                PRODUCT LINK
            ================================================== */}

            {campaign.productLink && (

              <div className="mb-4">

                <a
                  href={
                    campaign.productLink
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-primary btn-sm"
                >

                  <i className="bi bi-box-arrow-up-right me-2"></i>

                  View Product

                </a>

              </div>

            )}

            {/* ==================================================
                APPLICATION STATUS / APPLY BUTTON
            ================================================== */}

            {alreadyApplied ? (

              <ApplicationStatus
                application={
                  application
                }
              />

            ) : campaign.canApply ? (

              <button
                type="button"
                className="btn btn-primary btn-lg w-100"
                onClick={() => {

                  setApplyError(
                    ""
                  );

                  setShowConfirmModal(
                    true
                  );

                }}
                disabled={
                  applying
                }
              >

                <i className="bi bi-send me-2"></i>

                Apply for this Campaign

              </button>

            ) : (

              <button
                type="button"
                className="btn btn-secondary btn-lg w-100"
                disabled
              >

                <i className="bi bi-slash-circle me-2"></i>

                Not Eligible to Apply

              </button>

            )}

          </div>

        </div>

      </div>

      {/* ======================================================
          CAMPAIGN PROCESS / TASKS
      ====================================================== */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-header bg-white border-0 pt-4 px-4">

            <h5 className="fw-bold mb-1">
              How this Campaign Works
            </h5>

            <p className="text-muted small mb-0">
              Complete each task after your application is approved.
            </p>

          </div>

          <div className="card-body px-4">

            <div className="row g-3">

              <TaskCard
                number={1}
                title="Buy Product"
                description="Purchase the product and submit your order details and proof."
              />

              <TaskCard
                number={2}
                title="Product Received"
                description="Upload proof after receiving the product."
              />

              <TaskCard
                number={3}
                title="Review & Rating"
                description="Answer campaign questions, write your review and submit your rating."
              />

              {campaign.task4Required && (

                <TaskCard
                  number={4}
                  title="Post Review"
                  description="Post the approved review on the required platform and submit proof."
                />

              )}

            </div>

            <div className="alert alert-info mt-4 mb-0">

              <i className="bi bi-info-circle me-2"></i>

              Tasks become available sequentially. The next
              task is unlocked only after the previous task
              has been approved.

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          SLOT INFORMATION
      ====================================================== */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body">

            <div className="row text-center">

              <div className="col-4">

                <div className="fs-4 fw-bold">

                  {
                    totalSlots
                  }

                </div>

                <small className="text-muted">
                  Total Slots
                </small>

              </div>

              <div className="col-4 border-start border-end">

                <div className="fs-4 fw-bold">

                  {
                    filledSlots
                  }

                </div>

                <small className="text-muted">
                  Filled
                </small>

              </div>

              <div className="col-4">

                <div className="fs-4 fw-bold text-success">

                  {
                    availableSlots
                  }

                </div>

                <small className="text-muted">
                  Available
                </small>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          APPLY CONFIRMATION MODAL
      ====================================================== */}

      {showConfirmModal && (

        <div
          className="modal fade show"
          style={{
            display:
              "block",

            backgroundColor:
              "rgba(0, 0, 0, 0.5)",
          }}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >

          <div className="modal-dialog modal-dialog-centered">

            <div className="modal-content">

              <div className="modal-header">

                <h5 className="modal-title fw-bold">

                  Apply for Campaign

                </h5>

                <button
                  type="button"
                  className="btn-close"
                  disabled={
                    applying
                  }
                  onClick={() =>
                    setShowConfirmModal(
                      false
                    )
                  }
                ></button>

              </div>

              <div className="modal-body">

                {applyError && (

                  <div className="alert alert-danger">

                    {
                      applyError
                    }

                  </div>

                )}

                <p>

                  Are you sure you want to apply for{" "}

                  <strong>
                    {
                      campaign.productName
                    }
                  </strong>
                  ?

                </p>

                <div className="bg-light rounded p-3">

                  <div className="d-flex justify-content-between mb-2">

                    <span className="text-muted">
                      Brand
                    </span>

                    <strong>

                      {
                        campaign.brand?.companyName ||
                        "-"
                      }

                    </strong>

                  </div>

                  <div className="d-flex justify-content-between mb-2">

                    <span className="text-muted">
                      Earning
                    </span>

                    <strong className="text-success">

                      ₹
                      {formatAmount(
                        campaign.earningAmount
                      )}

                    </strong>

                  </div>

                  <div className="d-flex justify-content-between">

                    <span className="text-muted">
                      Slots Available
                    </span>

                    <strong>

                      {
                        availableSlots
                      }

                    </strong>

                  </div>

                </div>

                <p className="small text-muted mt-3 mb-0">

                  Your application will be sent for approval.
                  A campaign slot is not reserved until your
                  application is approved.

                </p>

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="btn btn-light"
                  disabled={
                    applying
                  }
                  onClick={() =>
                    setShowConfirmModal(
                      false
                    )
                  }
                >

                  Cancel

                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={
                    applying
                  }
                  onClick={
                    applyForCampaign
                  }
                >

                  {applying ? (

                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>

                      Applying...
                    </>

                  ) : (

                    <>
                      <i className="bi bi-send me-2"></i>

                      Confirm Apply
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

// ============================================================
// APPLICATION STATUS
// ============================================================

function ApplicationStatus({
  application,
}: {
  application: Application;
}) {
  const status =
    application.status;

  if (
    status === "PENDING"
  ) {
    return (
      <div className="alert alert-warning mb-0">

        <div className="d-flex align-items-center gap-3">

          <i className="bi bi-hourglass-split fs-4"></i>

          <div>

            <div className="fw-bold">
              Application Pending
            </div>

            <small>
              Your application has been submitted and is waiting for approval.
            </small>

          </div>

        </div>

      </div>
    );
  }

  if (
    status === "APPROVED"
  ) {
    return (
      <div className="alert alert-success mb-0">

        <div className="fw-bold">

          <i className="bi bi-check-circle me-2"></i>

          Application Approved

        </div>

        <small>
          You are enrolled in this campaign. Check your ongoing campaigns.
        </small>

      </div>
    );
  }

  if (
    status === "REJECTED"
  ) {
    return (
      <div className="alert alert-danger mb-0">

        <div className="fw-bold">

          <i className="bi bi-x-circle me-2"></i>

          Application Rejected

        </div>

        {application.rejectionReason && (

          <small>

            Reason:{" "}

            {
              application.rejectionReason
            }

          </small>

        )}

      </div>
    );
  }

  return (
    <div className="alert alert-secondary mb-0">

      Application status:{" "}

      <strong>
        {status}
      </strong>

    </div>
  );
}

// ============================================================
// TASK CARD
// ============================================================

function TaskCard({
  number,
  title,
  description,
}: {
  number: number;

  title: string;

  description: string;
}) {
  return (
    <div className="col-md-6 col-xl-3">

      <div className="border rounded h-100 p-3">

        <div
          className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-bold mb-3"
          style={{
            width: "42px",

            height: "42px",
          }}
        >
          {number}
        </div>

        <h6 className="fw-bold">
          {title}
        </h6>

        <p className="text-muted small mb-0">
          {description}
        </p>

      </div>

    </div>
  );
}