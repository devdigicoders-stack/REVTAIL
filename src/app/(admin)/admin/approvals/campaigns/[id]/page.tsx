"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

// ============================================================
// TYPES
// ============================================================

type QuestionOption = {
  id: number;
  optionText: string;
  optionOrder: number;
};

type CampaignQuestion = {
  id: number;

  questionId:
    | number
    | null;

  questionText: string;

  questionType:
    | "TEXT"
    | "SINGLE_CHOICE"
    | "MULTIPLE_CHOICE";

  source:
    | "FIXED"
    | "CUSTOM";

  isRequired: boolean;

  questionOrder: number;

  question?: {
    id?: number;

    options?: QuestionOption[];
  } | null;
};

type CampaignImage = {
  id: number;

  imagePath: string;

  imageOrder: number;
};

type Brand = {
  id: number;

  companyName: string;

  companyType: string;

  categoryId?:
    | number
    | null;

  category?:
    | {
        id: number;
        name: string;
      }
    | null;

  website?:
    | string
    | null;

  pocFullName?:
    | string
    | null;

  pocMobile?:
    | string
    | null;

  designation?:
    | string
    | null;
};

type Campaign = {
  id: number;

  campaignCode: string;

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

  earningAmount:
    | string
    | number;

  currency: string;

  totalSlots: number;

  filledSlots: number;

  availableSlots?:
    | number
    | null;

  targetGender: string;

  targetState?:
    | string
    | null;

  targetCity?:
    | string
    | null;

  task4Required: boolean;

  startDate?:
    | string
    | null;

  endDate?:
    | string
    | null;

  status: string;

  submittedAt?:
    | string
    | null;

  approvedAt?:
    | string
    | null;

  rejectedAt?:
    | string
    | null;

  rejectionReason?:
    | string
    | null;

  brand: Brand;

  images: CampaignImage[];

  campaignQuestions:
    CampaignQuestion[];
};

// ============================================================
// PAGE COMPONENT
// ============================================================

export default function AdminCampaignReviewPage() {
  const params =
    useParams();

  const router =
    useRouter();

  // ==========================================================
  // CAMPAIGN ID
  // ==========================================================

  const campaignId =
    Array.isArray(
      params.id
    )
      ? params.id[0]
      : params.id;

  // ==========================================================
  // STATE
  // ==========================================================

  const [
    campaign,
    setCampaign,
  ] =
    useState<Campaign | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );

  const [
    actionLoading,
    setActionLoading,
  ] =
    useState(
      false
    );

  const [
    actionError,
    setActionError,
  ] =
    useState(
      ""
    );

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState(
      ""
    );

  const [
    rejectReason,
    setRejectReason,
  ] =
    useState(
      ""
    );

  const [
    showRejectModal,
    setShowRejectModal,
  ] =
    useState(
      false
    );

  const [
    selectedImage,
    setSelectedImage,
  ] =
    useState<
      string | null
    >(
      null
    );

  // ==========================================================
  // EDIT STATE
  // Admin may edit these fields while approval is pending.
  // ==========================================================

  const [
    isEditing,
    setIsEditing,
  ] =
    useState(
      false
    );

  const [
    saving,
    setSaving,
  ] =
    useState(
      false
    );

  const [
    earningAmount,
    setEarningAmount,
  ] =
    useState(
      ""
    );

  const [
    totalSlots,
    setTotalSlots,
  ] =
    useState(
      ""
    );

  const [
    productLink,
    setProductLink,
  ] =
    useState(
      ""
    );

  const [
    editError,
    setEditError,
  ] =
    useState(
      ""
    );

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

  // ==========================================================
  // LOAD CAMPAIGN
  // ==========================================================

  const loadCampaign =
    useCallback(
      async () => {
        if (
          !campaignId
        ) {
          return;
        }

        try {
          setLoading(
            true
          );

          setError(
            ""
          );

          const response =
            await fetch(
              `/api/campaigns/${campaignId}`,
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

          const campaignData =
            result.data as Campaign;

          setCampaign(
            campaignData
          );

          // ----------------------------------------------------
          // Keep edit form in sync
          // ----------------------------------------------------

          setEarningAmount(
            String(
              campaignData
                .earningAmount
            )
          );

          setTotalSlots(
            String(
              campaignData
                .totalSlots
            )
          );

          setProductLink(
            campaignData
              .productLink ??
              ""
          );

          // ----------------------------------------------------
          // Select first product image
          // ----------------------------------------------------

          if (
            campaignData
              .images &&
            campaignData
              .images
              .length >
              0
          ) {
            setSelectedImage(
              campaignData
                .images[0]
                .imagePath
            );
          } else if (
            campaignData
              .productImage
          ) {
            setSelectedImage(
              campaignData
                .productImage
            );
          } else {
            setSelectedImage(
              null
            );
          }
        } catch (
          err
        ) {
          console.error(
            "CAMPAIGN LOAD ERROR:",
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
      },
      [
        campaignId,
      ]
    );

  useEffect(
    () => {
      loadCampaign();
    },
    [
      loadCampaign,
    ]
  );

  // ==========================================================
  // START EDITING
  // ==========================================================

  const startEditing =
    () => {
      if (
        !campaign ||
        campaign.status !==
          "SUBMITTED"
      ) {
        return;
      }

      setEarningAmount(
        String(
          campaign
            .earningAmount
        )
      );

      setTotalSlots(
        String(
          campaign
            .totalSlots
        )
      );

      setProductLink(
        campaign
          .productLink ??
          ""
      );

      setEditError(
        ""
      );

      setActionError(
        ""
      );

      setSuccessMessage(
        ""
      );

      setIsEditing(
        true
      );
    };

  // ==========================================================
  // CANCEL EDITING
  // ==========================================================

  const cancelEditing =
    () => {
      if (
        campaign
      ) {
        setEarningAmount(
          String(
            campaign
              .earningAmount
          )
        );

        setTotalSlots(
          String(
            campaign
              .totalSlots
          )
        );

        setProductLink(
          campaign
            .productLink ??
            ""
        );
      }

      setEditError(
        ""
      );

      setIsEditing(
        false
      );
    };

  // ==========================================================
  // SAVE AMOUNT / SLOTS / PRODUCT LINK
  // ==========================================================

  const saveChanges =
    async () => {
      if (
        !campaign ||
        campaign.status !==
          "SUBMITTED"
      ) {
        return;
      }

      try {
        setSaving(
          true
        );

        setEditError(
          ""
        );

        setActionError(
          ""
        );

        setSuccessMessage(
          ""
        );

        const earning =
          Number(
            earningAmount
          );

        const slots =
          Number(
            totalSlots
          );

        const cleanProductLink =
          productLink.trim();

        // ====================================================
        // EARNING VALIDATION
        // ====================================================

        if (
          !Number.isFinite(
            earning
          ) ||
          earning <=
            0
        ) {
          setEditError(
            "Earning amount must be greater than 0."
          );

          return;
        }

        // ====================================================
        // SLOT VALIDATION
        // ====================================================

        if (
          !Number.isInteger(
            slots
          ) ||
          slots <=
            0
        ) {
          setEditError(
            "Total slots must be a whole number greater than 0."
          );

          return;
        }

        if (
          slots <
          campaign
            .filledSlots
        ) {
          setEditError(
            `Total slots cannot be less than ${campaign.filledSlots}, because these slots are already filled.`
          );

          return;
        }

        // ====================================================
        // PRODUCT LINK VALIDATION
        // ====================================================

        if (
          !cleanProductLink
        ) {
          setEditError(
            "Product Link is required."
          );

          return;
        }

        try {
          const url =
            new URL(
              cleanProductLink
            );

          if (
            url.protocol !==
              "http:" &&
            url.protocol !==
              "https:"
          ) {
            setEditError(
              "Product Link must start with http:// or https://."
            );

            return;
          }
        } catch {
          setEditError(
            "Please enter a valid Product Link."
          );

          return;
        }

        // ====================================================
        // EXISTING PATCH API
        // ====================================================

        const response =
          await fetch(
            `/api/campaigns/${campaign.id}`,
            {
              method:
                "PATCH",

              credentials:
                "include",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  {
                    earningAmount:
                      earning,

                    totalSlots:
                      slots,

                    productLink:
                      cleanProductLink,
                  }
                ),
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              "Unable to update campaign."
          );
        }

        setSuccessMessage(
          result.message ||
            "Campaign details updated successfully."
        );

        setIsEditing(
          false
        );

        await loadCampaign();
      } catch (
        err
      ) {
        console.error(
          "CAMPAIGN UPDATE ERROR:",
          err
        );

        setEditError(
          err instanceof
            Error
            ? err.message
            : "Unable to update campaign."
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  // ==========================================================
  // CHANGE STATUS
  // ==========================================================

  const changeStatus =
    async (
      status:
        | "APPROVED"
        | "REJECTED",
      reason?: string
    ) => {
      if (
        !campaign
      ) {
        return;
      }

      try {
        setActionLoading(
          true
        );

        setActionError(
          ""
        );

        setSuccessMessage(
          ""
        );

        const response =
          await fetch(
            "/api/campaigns/change-status",
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
                JSON.stringify(
                  {
                    campaignId:
                      campaign.id,

                    status,

                    reason:
                      status ===
                      "REJECTED"
                        ? reason
                        : undefined,
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
              "Unable to update campaign."
          );
        }

        // ====================================================
        // APPROVAL RETURNS LIVE STATUS
        // ====================================================

        setCampaign(
          (
            current
          ) =>
            current
              ? {
                  ...current,

                  status:
                    result.data
                      ?.status ??
                    current
                      .status,

                  approvedAt:
                    result.data
                      ?.approvedAt ??
                    current
                      .approvedAt,

                  rejectedAt:
                    result.data
                      ?.rejectedAt ??
                    current
                      .rejectedAt,

                  rejectionReason:
                    result.data
                      ?.rejectionReason ??
                    null,
                }
              : null
        );

        setSuccessMessage(
          result.message ||
            (
              status ===
              "APPROVED"
                ? "Campaign approved successfully and is now LIVE."
                : "Campaign rejected successfully."
            )
        );

        setShowRejectModal(
          false
        );

        setRejectReason(
          ""
        );

        // ====================================================
        // RETURN TO APPROVAL LIST
        // ====================================================

        window.setTimeout(
          () => {
            router.push(
              "/admin/approvals/campaigns"
            );

            router.refresh();
          },
          1000
        );
      } catch (
        err
      ) {
        console.error(
          "CHANGE CAMPAIGN STATUS ERROR:",
          err
        );

        setActionError(
          err instanceof
            Error
            ? err.message
            : "Unable to update campaign."
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  // ==========================================================
  // APPROVE CAMPAIGN
  // ==========================================================

  const handleApprove =
    async () => {
      if (
        !campaign
      ) {
        return;
      }

      if (
        isEditing ||
        saving
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `Approve campaign "${campaign.productName}"? Once approved, the campaign will immediately become LIVE.`
        );

      if (
        !confirmed
      ) {
        return;
      }

      await changeStatus(
        "APPROVED"
      );
    };

  // ==========================================================
  // OPEN REJECTION MODAL
  // ==========================================================

  const handleRejectClick =
    () => {
      if (
        isEditing ||
        saving
      ) {
        return;
      }

      setActionError(
        ""
      );

      setRejectReason(
        ""
      );

      setShowRejectModal(
        true
      );
    };

  // ==========================================================
  // SUBMIT REJECTION
  // ==========================================================

  const handleRejectSubmit =
    async () => {
      const reason =
        rejectReason.trim();

      if (
        !reason
      ) {
        setActionError(
          "Please provide a rejection reason."
        );

        return;
      }

      await changeStatus(
        "REJECTED",
        reason
      );
    };

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatDate =
    (
      value?:
        | string
        | null
    ) => {
      if (
        !value
      ) {
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
    };

  // ==========================================================
  // FORMAT AMOUNT
  // ==========================================================

  const formatAmount =
    (
      amount:
        | string
        | number
    ) => {
      return Number(
        amount
      ).toLocaleString(
        "en-IN",
        {
          minimumFractionDigits:
            0,

          maximumFractionDigits:
            2,
        }
      );
    };

  // ==========================================================
  // FORMAT GENDER
  // ==========================================================

  const formatGender =
    (
      gender?: string
    ) => {
      if (
        !gender ||
        gender ===
          "ANY"
      ) {
        return "Any";
      }

      return (
        gender.charAt(
          0
        ) +
        gender
          .slice(
            1
          )
          .toLowerCase()
      );
    };

  // ==========================================================
  // QUESTION TYPE LABEL
  // ==========================================================

  const getQuestionTypeLabel =
    (
      type:
        CampaignQuestion[
          "questionType"
        ]
    ) => {
      switch (
        type
      ) {
        case "TEXT":
          return "Text";

        case "SINGLE_CHOICE":
          return "Single Choice";

        case "MULTIPLE_CHOICE":
          return "Multiple Choice";

        default:
          return type;
      }
    };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    loading
  ) {
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
              Loading campaign details...
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

          {
            error ||
            "Campaign not found."
          }

        </div>

        <Link
          href="/admin/approvals/campaigns"
          className="btn btn-outline-secondary"
        >

          <i className="bi bi-arrow-left me-2"></i>

          Back to Campaign Approvals

        </Link>

      </div>
    );
  }

  // ==========================================================
  // PRODUCT IMAGES
  // ==========================================================

  const campaignImages:
    CampaignImage[] =
      campaign.images &&
      campaign.images
        .length >
        0
        ? campaign.images
        : campaign
            .productImage
          ? [
              {
                id:
                  0,

                imagePath:
                  campaign
                    .productImage,

                imageOrder:
                  0,
              },
            ]
          : [];

  // ==========================================================
  // ONLY SUBMITTED CAMPAIGN CAN BE REVIEWED / EDITED
  // ==========================================================

  const canReview =
    campaign.status ===
    "SUBMITTED";

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <>
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="col-12">

        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">

          <div>

            {/* Breadcrumb */}

            <div className="mb-2">

              <Link
                href="/admin"
                className="text-muted text-decoration-none"
              >
                Dashboard
              </Link>

              <i className="bi bi-chevron-right mx-2 text-muted small"></i>

              <Link
                href="/admin/approvals/campaigns"
                className="text-muted text-decoration-none"
              >
                Campaign Approvals
              </Link>

              <i className="bi bi-chevron-right mx-2 text-muted small"></i>

              <span className="text-dark">

                {
                  campaign
                    .campaignCode
                }

              </span>

            </div>

            <h4 className="fw-bold mb-1">
              Campaign Review
            </h4>

            <p className="text-muted mb-0">
              Review all campaign details before approving or rejecting the request.
            </p>

          </div>

          {/* STATUS */}

          <div>

            {campaign.status ===
              "SUBMITTED" && (
              <span className="badge bg-warning-subtle text-warning-emphasis fs-6 px-3 py-2">
                Pending Approval
              </span>
            )}

            {campaign.status ===
              "LIVE" && (
              <span className="badge bg-success fs-6 px-3 py-2">
                Live
              </span>
            )}

            {campaign.status ===
              "REJECTED" && (
              <span className="badge bg-danger-subtle text-danger fs-6 px-3 py-2">
                Rejected
              </span>
            )}

            {campaign.status ===
              "COMPLETED" && (
              <span className="badge bg-primary fs-6 px-3 py-2">
                Completed
              </span>
            )}

            {campaign.status ===
              "CANCELLED" && (
              <span className="badge bg-secondary fs-6 px-3 py-2">
                Cancelled
              </span>
            )}

          </div>

        </div>

      </div>

      {/* ======================================================
          SUCCESS MESSAGE
      ====================================================== */}

      {successMessage && (
        <div className="col-12">

          <div className="alert alert-success">

            <i className="bi bi-check-circle me-2"></i>

            {
              successMessage
            }

          </div>

        </div>
      )}

      {/* ======================================================
          ACTION ERROR
      ====================================================== */}

      {actionError &&
        !showRejectModal && (
          <div className="col-12">

            <div className="alert alert-danger">

              <i className="bi bi-exclamation-triangle me-2"></i>

              {
                actionError
              }

            </div>

          </div>
        )}

      {/* ======================================================
          PRODUCT DETAILS
      ====================================================== */}

      <div className="col-xl-5">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-header bg-white border-0 pt-4 px-4">

            <h5 className="fw-bold mb-0">
              Product Details
            </h5>

          </div>

          <div className="card-body px-4">

            {/* ==================================================
                MAIN PRODUCT IMAGE
            ================================================== */}

            <div
              className="
                border
                rounded
                bg-light
                d-flex
                align-items-center
                justify-content-center
                overflow-hidden
                mb-3
              "
              style={{
                minHeight:
                  "330px",
              }}
            >

              {selectedImage ? (

                <Image
                  src={
                    selectedImage
                  }
                  alt={
                    campaign
                      .productName
                  }
                  width={
                    500
                  }
                  height={
                    400
                  }
                  className="img-fluid"
                  style={{
                    width:
                      "100%",

                    maxHeight:
                      "400px",

                    objectFit:
                      "contain",
                  }}
                />

              ) : (

                <div className="text-center text-muted py-5">

                  <i className="bi bi-image fs-1"></i>

                  <div className="mt-2">
                    No product image
                  </div>

                </div>

              )}

            </div>

            {/* ==================================================
                THUMBNAIL GALLERY
            ================================================== */}

            {campaignImages
              .length >
              1 && (

              <div className="d-flex flex-wrap gap-2 mb-4">

                {campaignImages.map(
                  (
                    campaignImage
                  ) => {
                    const isSelected =
                      selectedImage ===
                      campaignImage
                        .imagePath;

                    return (
                      <button
                        key={
                          campaignImage
                            .id
                        }
                        type="button"
                        className={`border rounded p-1 bg-white ${
                          isSelected
                            ? "border-primary border-2"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedImage(
                            campaignImage
                              .imagePath
                          )
                        }
                        style={{
                          width:
                            "70px",

                          height:
                            "70px",

                          cursor:
                            "pointer",
                        }}
                        aria-label={`View ${campaign.productName} image`}
                      >

                        <Image
                          src={
                            campaignImage
                              .imagePath
                          }
                          alt={
                            campaign
                              .productName
                          }
                          width={
                            60
                          }
                          height={
                            60
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

                      </button>
                    );
                  }
                )}

              </div>

            )}

            {/* ==================================================
                PRODUCT NAME
            ================================================== */}

            <h4 className="fw-bold">

              {
                campaign
                  .productName
              }

            </h4>

            <div className="text-muted mb-3">

              Campaign ID:{" "}

              <span className="fw-semibold">

                {
                  campaign
                    .campaignCode
                }

              </span>

            </div>

            {/* DESCRIPTION */}

            {campaign
              .productDescription && (

              <div className="mb-3">

                <label className="fw-semibold mb-1">
                  Product Description
                </label>

                 <div
                    className="text-muted campaign-description"
                    dangerouslySetInnerHTML={{
                      __html:
                        decodeHtml(
                          campaign.productDescription
                        ),
                    }}
                  />

              </div>

            )}

            {/* PRODUCT LINK */}

            {campaign
              .productLink && (

              <div>

                <label className="fw-semibold d-block mb-1">
                  Product Link
                </label>

                <a
                  href={
                    campaign
                      .productLink
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-break"
                >

                  {
                    campaign
                      .productLink
                  }

                  <i className="bi bi-box-arrow-up-right ms-2"></i>

                </a>

              </div>

            )}

          </div>

        </div>

      </div>

      {/* ======================================================
          CAMPAIGN DETAILS
      ====================================================== */}

      <div className="col-xl-7">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-header bg-white border-0 pt-4 px-4">

            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">

              <h5 className="fw-bold mb-0">
                Campaign Details
              </h5>

              {!isEditing &&
                canReview && (

                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={
                      startEditing
                    }
                    disabled={
                      actionLoading ||
                      saving
                    }
                  >

                    <i className="bi bi-pencil me-1"></i>

                    Edit Amount, Slots & Product Link

                  </button>

                )}

            </div>

          </div>

          <div className="card-body px-4">

            {isEditing ? (

              <>
                {/* EDIT ERROR */}

                {editError && (

                  <div className="alert alert-danger py-2">

                    <i className="bi bi-exclamation-triangle me-2"></i>

                    {
                      editError
                    }

                  </div>

                )}

                <div className="alert alert-info py-2">

                  <i className="bi bi-info-circle me-2"></i>

                  Update the campaign details before approving it.

                </div>

                <div className="row g-3">

                  {/* ==========================================
                      EARNING
                  ========================================== */}

                  <div className="col-md-6">

                    <label className="form-label fw-semibold">

                      Earning per Tester (₹)

                    </label>

                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      className="form-control"
                      value={
                        earningAmount
                      }
                      disabled={
                        saving
                      }
                      onChange={(
                        event
                      ) => {
                        setEarningAmount(
                          event
                            .target
                            .value
                        );

                        setEditError(
                          ""
                        );
                      }}
                    />

                  </div>

                  {/* ==========================================
                      TOTAL SLOTS
                  ========================================== */}

                  <div className="col-md-6">

                    <label className="form-label fw-semibold">

                      Total Slots

                    </label>

                    <input
                      type="number"
                      min={
                        Math.max(
                          1,
                          campaign
                            .filledSlots
                        )
                      }
                      step="1"
                      className="form-control"
                      value={
                        totalSlots
                      }
                      disabled={
                        saving
                      }
                      onChange={(
                        event
                      ) => {
                        setTotalSlots(
                          event
                            .target
                            .value
                        );

                        setEditError(
                          ""
                        );
                      }}
                    />

                    <div className="form-text">

                      Minimum allowed:{" "}

                      <strong>

                        {
                          Math.max(
                            1,
                            campaign
                              .filledSlots
                          )
                        }

                      </strong>

                    </div>

                  </div>

                  {/* ==========================================
                      PRODUCT LINK
                  ========================================== */}

                  <div className="col-12">

                    <label
                      htmlFor="editProductLink"
                      className="form-label fw-semibold"
                    >

                      Product Link

                    </label>

                    <input
                      id="editProductLink"
                      type="url"
                      className="form-control"
                      placeholder="https://example.com/product"
                      value={
                        productLink
                      }
                      disabled={
                        saving
                      }
                      onChange={(
                        event
                      ) => {
                        setProductLink(
                          event
                            .target
                            .value
                        );

                        setEditError(
                          ""
                        );
                      }}
                    />

                  </div>

                  {/* ==========================================
                      AVAILABLE SLOT PREVIEW
                  ========================================== */}

                  <div className="col-12">

                    <div className="alert alert-light border mb-0">

                      New available slots:{" "}

                      <strong>

                        {Math.max(
                          0,
                          Number(
                            totalSlots ||
                              0
                          ) -
                            campaign
                              .filledSlots
                        )}

                      </strong>

                    </div>

                  </div>

                </div>

                {/* ============================================
                    EDIT BUTTONS
                ============================================ */}

                <div className="d-flex flex-wrap gap-2 mt-3">

                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={
                      saving ||
                      actionLoading
                    }
                    onClick={
                      saveChanges
                    }
                  >

                    {saving ? (

                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>

                        Saving...
                      </>

                    ) : (

                      <>
                        <i className="bi bi-check-lg me-1"></i>

                        Save Changes
                      </>

                    )}

                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    disabled={
                      saving
                    }
                    onClick={
                      cancelEditing
                    }
                  >

                    Cancel

                  </button>

                </div>

              </>

            ) : (

              <div className="row g-4">

                {/* EARNING */}

                <div className="col-md-4">

                  <div className="text-muted small">
                    Tester Earning
                  </div>

                  <div className="fs-5 fw-bold text-success">

                    ₹
                    {formatAmount(
                      campaign
                        .earningAmount
                    )}

                  </div>

                  <small className="text-muted">
                    per approved tester
                  </small>

                </div>

                {/* TOTAL SLOTS */}

                <div className="col-md-4">

                  <div className="text-muted small">
                    Total Slots
                  </div>

                  <div className="fs-5 fw-bold">

                    {
                      campaign
                        .totalSlots
                    }

                  </div>

                </div>

                {/* AVAILABLE SLOTS */}

                <div className="col-md-4">

                  <div className="text-muted small">
                    Available Slots
                  </div>

                  <div className="fs-5 fw-bold">

                    {
                      campaign
                        .availableSlots ??
                      campaign
                        .totalSlots
                    }

                  </div>

                </div>

                <div className="col-12">

                  <hr />

                </div>

                {/* START DATE */}

                <div className="col-md-6">

                  <div className="text-muted small">
                    Start Date
                  </div>

                  <div className="fw-semibold">

                    {formatDate(
                      campaign
                        .startDate
                    )}

                  </div>

                </div>

                {/* END DATE */}

                <div className="col-md-6">

                  <div className="text-muted small">
                    End Date
                  </div>

                  <div className="fw-semibold">

                    {formatDate(
                      campaign
                        .endDate
                    )}

                  </div>

                </div>

                {/* SUBMITTED */}

                <div className="col-md-6">

                  <div className="text-muted small">
                    Submitted On
                  </div>

                  <div className="fw-semibold">

                    {formatDate(
                      campaign
                        .submittedAt
                    )}

                  </div>

                </div>

                {/* TASK 4 */}

                <div className="col-md-6">

                  <div className="text-muted small mb-1">
                    Task 4 Required
                  </div>

                  {campaign
                    .task4Required ? (

                    <span className="badge bg-success-subtle text-success">
                      Yes
                    </span>

                  ) : (

                    <span className="badge bg-secondary-subtle text-secondary">
                      No
                    </span>

                  )}

                </div>

              </div>

            )}

          </div>

        </div>

      </div>

      {/* ======================================================
          TARGET AUDIENCE
      ====================================================== */}

      <div className="col-lg-6">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-header bg-white border-0 pt-4 px-4">

            <h5 className="fw-bold mb-0">

              <i className="bi bi-bullseye me-2 text-primary"></i>

              Target Audience

            </h5>

          </div>

          <div className="card-body px-4">

            <div className="row g-4">

              {/* Gender */}

              <div className="col-md-4">

                <div className="text-muted small mb-1">
                  Gender
                </div>

                <div className="fw-semibold">

                  {formatGender(
                    campaign
                      .targetGender
                  )}

                </div>

              </div>

              {/* State */}

              <div className="col-md-4">

                <div className="text-muted small mb-1">
                  State
                </div>

                <div className="fw-semibold">

                  {campaign
                    .targetState &&
                  campaign
                    .targetState
                    .toLowerCase() !==
                    "any"
                    ? campaign
                        .targetState
                    : "Any"}

                </div>

              </div>

              {/* City */}

              <div className="col-md-4">

                <div className="text-muted small mb-1">
                  City
                </div>

                <div className="fw-semibold">

                  {campaign
                    .targetCity &&
                  campaign
                    .targetCity
                    .toLowerCase() !==
                    "any"
                    ? campaign
                        .targetCity
                    : "Any"}

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          BRAND DETAILS
      ====================================================== */}

      <div className="col-lg-6">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-header bg-white border-0 pt-4 px-4">

            <h5 className="fw-bold mb-0">

              <i className="bi bi-building me-2 text-primary"></i>

              Brand Details

            </h5>

          </div>

          <div className="card-body px-4">

            <div className="row g-3">

              {/* COMPANY */}

              <div className="col-md-6">

                <div className="text-muted small">
                  Company
                </div>

                <div className="fw-semibold">

                  {
                    campaign
                      .brand
                      .companyName
                  }

                </div>

              </div>

              {/* COMPANY TYPE */}

              <div className="col-md-6">

                <div className="text-muted small">
                  Company Type
                </div>

                <div className="fw-semibold">

                  {
                    campaign
                      .brand
                      .companyType
                  }

                </div>

              </div>

              {/* CATEGORY */}

              <div className="col-md-6">

                <div className="text-muted small">
                  Category
                </div>

                <div className="fw-semibold">

                  {
                    campaign
                      .brand
                      .category
                      ?.name ??
                    "-"
                  }

                </div>

              </div>

              {/* CONTACT PERSON */}

              <div className="col-md-6">

                <div className="text-muted small">
                  Contact Person
                </div>

                <div className="fw-semibold">

                  {
                    campaign
                      .brand
                      .pocFullName ||
                    "-"
                  }

                </div>

              </div>

              {/* DESIGNATION */}

              <div className="col-md-6">

                <div className="text-muted small">
                  Designation
                </div>

                <div className="fw-semibold">

                  {
                    campaign
                      .brand
                      .designation ||
                    "-"
                  }

                </div>

              </div>

              {/* MOBILE */}

              <div className="col-md-6">

                <div className="text-muted small">
                  Mobile
                </div>

                <div className="fw-semibold">

                  {
                    campaign
                      .brand
                      .pocMobile ||
                    "-"
                  }

                </div>

              </div>

              {/* WEBSITE */}

              {campaign
                .brand
                .website && (

                <div className="col-12">

                  <div className="text-muted small">
                    Website
                  </div>

                  <a
                    href={
                      campaign
                        .brand
                        .website
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >

                    {
                      campaign
                        .brand
                        .website
                    }

                    <i className="bi bi-box-arrow-up-right ms-2"></i>

                  </a>

                </div>

              )}

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          QUESTIONNAIRE
      ====================================================== */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-header bg-white border-0 pt-4 px-4">

            <div className="d-flex justify-content-between align-items-center">

              <div>

                <h5 className="fw-bold mb-1">
                  Campaign Questionnaire
                </h5>

                <p className="text-muted small mb-0">
                  Fixed and custom questions selected by the Brand.
                </p>

              </div>

              <span className="badge bg-primary-subtle text-primary">

                {
                  campaign
                    .campaignQuestions
                    .length
                }{" "}
                Questions

              </span>

            </div>

          </div>

          <div className="card-body px-4">

            {campaign
              .campaignQuestions
              .length ===
              0 ? (

              <div className="text-center text-muted py-4">

                No campaign questions.

              </div>

            ) : (

              <div className="row g-3">

                {[
                  ...campaign
                    .campaignQuestions,
                ]
                  .sort(
                    (
                      a,
                      b
                    ) =>
                      a.questionOrder -
                      b.questionOrder
                  )
                  .map(
                    (
                      question,
                      index
                    ) => {
                      const options =
                        question
                          .question
                          ?.options ||
                        [];

                      return (
                        <div
                          className="col-12"
                          key={
                            question
                              .id
                          }
                        >

                          <div className="border rounded p-3">

                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-2">

                              <div>

                                <div className="fw-semibold">

                                  {
                                    index +
                                    1
                                  }
                                  .{" "}

                                  {
                                    question
                                      .questionText
                                  }

                                </div>

                              </div>

                              <div className="d-flex gap-2">

                                <span
                                  className={`badge ${
                                    question
                                      .source ===
                                    "FIXED"
                                      ? "bg-primary-subtle text-primary"
                                      : "bg-info-subtle text-info"
                                  }`}
                                >

                                  {
                                    question
                                      .source
                                  }

                                </span>

                                <span className="badge bg-light text-dark border">

                                  {getQuestionTypeLabel(
                                    question
                                      .questionType
                                  )}

                                </span>

                              </div>

                            </div>

                            {/* OPTIONS */}

                            {options
                              .length >
                              0 && (

                              <div className="mt-3">

                                {[
                                  ...options,
                                ]
                                  .sort(
                                    (
                                      a,
                                      b
                                    ) =>
                                      a.optionOrder -
                                      b.optionOrder
                                  )
                                  .map(
                                    (
                                      option
                                    ) => (

                                      <div
                                        key={
                                          option
                                            .id
                                        }
                                        className="small text-muted mb-1"
                                      >

                                        <i
                                          className={`bi ${
                                            question
                                              .questionType ===
                                            "SINGLE_CHOICE"
                                              ? "bi-circle"
                                              : "bi-square"
                                          } me-2`}
                                        ></i>

                                        {
                                          option
                                            .optionText
                                        }

                                      </div>

                                    )
                                  )}

                              </div>

                            )}

                          </div>

                        </div>
                      );
                    }
                  )}

              </div>

            )}

          </div>

        </div>

      </div>

      {/* ======================================================
          REJECTION INFORMATION
      ====================================================== */}

      {campaign.status ===
        "REJECTED" &&
        campaign
          .rejectionReason && (

          <div className="col-12">

            <div className="alert alert-danger">

              <h6 className="fw-bold">

                <i className="bi bi-x-circle me-2"></i>

                Rejection Reason

              </h6>

              <div>

                {
                  campaign
                    .rejectionReason
                }

              </div>

            </div>

          </div>

        )}

      {/* ======================================================
          ADMIN ACTIONS
      ====================================================== */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body">

            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">

              {/* BACK */}

              <Link
                href="/admin/approvals/campaigns"
                className="btn btn-outline-secondary"
              >

                <i className="bi bi-arrow-left me-2"></i>

                Back to List

              </Link>

              {/* ==================================================
                  REVIEW ACTIONS
              ================================================== */}

              {canReview && (

                <div>

                  {isEditing && (

                    <div className="small text-warning-emphasis mb-2">

                      <i className="bi bi-info-circle me-1"></i>

                      Save or cancel your edits before approving or rejecting this campaign.

                    </div>

                  )}

                  <div className="d-flex flex-column flex-sm-row gap-2">

                    {/* REJECT */}

                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={
                        handleRejectClick
                      }
                      disabled={
                        actionLoading ||
                        saving ||
                        isEditing
                      }
                    >

                      <i className="bi bi-x-circle me-2"></i>

                      Reject Campaign

                    </button>

                    {/* APPROVE */}

                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={
                        handleApprove
                      }
                      disabled={
                        actionLoading ||
                        saving ||
                        isEditing
                      }
                    >

                      {actionLoading ? (

                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                          ></span>

                          Processing...
                        </>

                      ) : (

                        <>
                          <i className="bi bi-check-circle me-2"></i>

                          Approve & Make Live
                        </>

                      )}

                    </button>

                  </div>

                </div>

              )}

              {!canReview && (

                <div className="text-muted">

                  <i className="bi bi-info-circle me-2"></i>

                  This campaign has already been reviewed.

                </div>

              )}

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          REJECTION MODAL
      ====================================================== */}

      {showRejectModal && (

        <div
          className="modal fade show"
          style={{
            display:
              "block",

            backgroundColor:
              "rgba(0,0,0,0.45)",
          }}
          tabIndex={
            -1
          }
          role="dialog"
          aria-modal="true"
        >

          <div className="modal-dialog modal-dialog-centered">

            <div className="modal-content">

              {/* ==============================================
                  MODAL HEADER
              ============================================== */}

              <div className="modal-header">

                <h5 className="modal-title">

                  <i className="bi bi-x-circle text-danger me-2"></i>

                  Reject Campaign

                </h5>

                <button
                  type="button"
                  className="btn-close"
                  disabled={
                    actionLoading
                  }
                  onClick={() => {
                    setShowRejectModal(
                      false
                    );

                    setActionError(
                      ""
                    );
                  }}
                  aria-label="Close"
                ></button>

              </div>

              {/* ==============================================
                  MODAL BODY
              ============================================== */}

              <div className="modal-body">

                <div className="alert alert-warning">

                  You are rejecting{" "}

                  <strong>

                    {
                      campaign
                        .productName
                    }

                  </strong>

                  .

                </div>

                {actionError && (

                  <div className="alert alert-danger py-2">

                    {
                      actionError
                    }

                  </div>

                )}

                <label
                  htmlFor="rejectReason"
                  className="form-label fw-semibold"
                >

                  Rejection Reason{" "}

                  <span className="text-danger">
                    *
                  </span>

                </label>

                <textarea
                  id="rejectReason"
                  className="form-control"
                  rows={
                    4
                  }
                  placeholder="Explain why this campaign is being rejected..."
                  value={
                    rejectReason
                  }
                  disabled={
                    actionLoading
                  }
                  onChange={(
                    event
                  ) => {
                    setRejectReason(
                      event
                        .target
                        .value
                    );

                    setActionError(
                      ""
                    );
                  }}
                />

                <div className="form-text">

                  The rejection reason will be stored with the campaign and can be shown to the Brand.

                </div>

              </div>

              {/* ==============================================
                  MODAL FOOTER
              ============================================== */}

              <div className="modal-footer">

                <button
                  type="button"
                  className="btn btn-light"
                  disabled={
                    actionLoading
                  }
                  onClick={() => {
                    setShowRejectModal(
                      false
                    );

                    setActionError(
                      ""
                    );
                  }}
                >

                  Cancel

                </button>

                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={
                    actionLoading ||
                    !rejectReason
                      .trim()
                  }
                  onClick={
                    handleRejectSubmit
                  }
                >

                  {actionLoading ? (

                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></span>

                      Rejecting...
                    </>

                  ) : (

                    <>
                      <i className="bi bi-x-circle me-2"></i>

                      Confirm Reject
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