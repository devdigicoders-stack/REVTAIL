"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
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
  questionId: number | null;
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

  website?: string | null;

  pocFullName?: string | null;

  pocMobile?: string | null;

  designation?: string | null;
};

type Campaign = {
  id: number;

  campaignCode: string;

  productName: string;

  productImage?: string | null;

  productLink?: string | null;

  productDescription?: string | null;

  earningAmount:
    | number
    | string;

  currency: string;

  totalSlots: number;

  filledSlots: number;

  availableSlots:
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

  createdBy?: number;

  approvedBy?:
    | number
    | null;

  createdAt?: string;

  updatedAt?: string;

  brand: Brand;

  images: CampaignImage[];

  campaignQuestions: CampaignQuestion[];

  applicationCount?: number;

  enrolledCount?: number;

  _count?: {
    testerApplications: number;
    testerCampaigns: number;
  };
};

type CampaignApiResponse = {
  success: boolean;

  message?: string;

  data?: Campaign;
};

// ============================================================
// PAGE
// ============================================================

export default function AdminCampaignDetailPage() {
  const params =
    useParams<{
      id: string;
    }>();

  const campaignId =
    Array.isArray(params.id)
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
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState("");

  const [
    selectedImage,
    setSelectedImage,
  ] =
    useState<string | null>(
      null
    );

  // ==========================================================
  // EDIT STATE
  // ==========================================================

  const [
    isEditing,
    setIsEditing,
  ] =
    useState(false);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    earningAmount,
    setEarningAmount,
  ] =
    useState("");

  const [
    totalSlots,
    setTotalSlots,
  ] =
    useState("");

  const [
    productLink,
    setProductLink,
  ] =
    useState("");

  const [
    editError,
    setEditError,
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
  // ==========================================================
  // LOAD CAMPAIGN
  // ==========================================================

  const loadCampaign =
    useCallback(
      async () => {
        if (!campaignId) {
          return;
        }

        try {
          setLoading(true);

          setError("");

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

          const result:
            CampaignApiResponse =
            await response.json();

          if (
            !response.ok ||
            !result.success ||
            !result.data
          ) {
            throw new Error(
              result.message ||
                "Unable to load campaign."
            );
          }

          const campaignData =
            result.data;

          setCampaign(
            campaignData
          );

          // ====================================================
          // SET FORM VALUES
          // ====================================================

          setEarningAmount(
            String(
              campaignData.earningAmount
            )
          );

          setTotalSlots(
            String(
              campaignData.totalSlots
            )
          );

          setProductLink(
            campaignData.productLink ??
              ""
          );

          // ====================================================
          // SELECT PRIMARY IMAGE
          // ====================================================

          if (
            campaignData.images &&
            campaignData.images.length >
              0
          ) {
            const orderedImages =
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
              orderedImages[0]
                .imagePath
            );
          } else if (
            campaignData.productImage
          ) {
            setSelectedImage(
              campaignData.productImage
            );
          } else {
            setSelectedImage(
              null
            );
          }
        } catch (err) {
          console.error(
            "ADMIN CAMPAIGN DETAIL ERROR:",
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load campaign."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        campaignId,
      ]
    );

  useEffect(() => {
    loadCampaign();
  }, [loadCampaign]);

  // ==========================================================
  // COUNTS
  // ==========================================================

  const applicationCount =
    useMemo(() => {
      if (!campaign) {
        return 0;
      }

      return (
        campaign.applicationCount ??
        campaign._count
          ?.testerApplications ??
        0
      );
    }, [campaign]);

  const enrolledCount =
    useMemo(() => {
      if (!campaign) {
        return 0;
      }

      return (
        campaign.enrolledCount ??
        campaign._count
          ?.testerCampaigns ??
        0
      );
    }, [campaign]);

  // ==========================================================
  // START EDIT
  // ==========================================================

  const startEditing =
    () => {
      if (!campaign) {
        return;
      }

      setEarningAmount(
        String(
          campaign.earningAmount
        )
      );

      setTotalSlots(
        String(
          campaign.totalSlots
        )
      );

      setProductLink(
        campaign.productLink ??
          ""
      );

      setEditError("");

      setSuccessMessage("");

      setIsEditing(
        true
      );
    };

  // ==========================================================
  // CANCEL EDIT
  // ==========================================================

  const cancelEditing =
    () => {
      if (campaign) {
        setEarningAmount(
          String(
            campaign.earningAmount
          )
        );

        setTotalSlots(
          String(
            campaign.totalSlots
          )
        );

        setProductLink(
          campaign.productLink ??
            ""
        );
      }

      setEditError("");

      setIsEditing(
        false
      );
    };

  // ==========================================================
  // SAVE CHANGES
  // ==========================================================

  const saveChanges =
    async () => {
      if (!campaign) {
        return;
      }

      try {
        setSaving(
          true
        );

        setEditError("");

        setSuccessMessage("");

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
        // VALIDATION
        // ====================================================

        if (
          !Number.isFinite(
            earning
          ) ||
          earning <= 0
        ) {
          setEditError(
            "Earning amount must be greater than 0."
          );

          return;
        }

        if (
          !Number.isInteger(
            slots
          ) ||
          slots <= 0
        ) {
          setEditError(
            "Total slots must be a whole number greater than 0."
          );

          return;
        }

        if (
          slots <
          campaign.filledSlots
        ) {
          setEditError(
            `Total slots cannot be less than ${campaign.filledSlots}, because these slots are already filled.`
          );

          return;
        }

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
        // PATCH
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
                JSON.stringify({
                  earningAmount:
                    earning,

                  totalSlots:
                    slots,

                  productLink:
                    cleanProductLink,
                }),
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
            "Campaign updated successfully."
        );

        setIsEditing(
          false
        );

        await loadCampaign();
      } catch (err) {
        console.error(
          "CAMPAIGN UPDATE ERROR:",
          err
        );

        setEditError(
          err instanceof Error
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
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="col-12">

        <div className="text-center py-5">

          <div
            className="spinner-border text-primary"
            role="status"
          />

          <div className="text-muted mt-3">
            Loading campaign...
          </div>

        </div>

      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (
    error &&
    !campaign
  ) {
    return (
      <div className="col-12">

        <div className="alert alert-danger">

          <i className="bi bi-exclamation-triangle me-2" />

          {
            error
          }

        </div>

        <Link
          href="/admin/campaigns"
          className="btn btn-outline-primary"
        >

          <i className="bi bi-arrow-left me-1" />

          Back to Campaigns

        </Link>

      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <>
      {/* ======================================================
          BACK
      ====================================================== */}

      <div className="col-12">

        <Link
          href="/admin/campaigns"
          className="text-decoration-none"
        >

          <i className="bi bi-arrow-left me-1" />

          Back to Live Campaigns

        </Link>

      </div>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="col-12">

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3">

          <div>

            <h3 className="fw-bold mb-1">

              {
                campaign.productName
              }

            </h3>

            <div className="text-muted">

              {
                campaign.campaignCode
              }

            </div>

          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">

            <Link
              href={`/admin/campaigns/${campaign.id}/testers`}
              className="btn btn-outline-primary"
            >

              <i className="bi bi-people me-2" />

              See Testers in the Campaign

            </Link>

            <span
              className={`badge fs-6 ${
                campaign.status ===
                "LIVE"
                  ? "bg-success"
                  : "bg-secondary"
              }`}
            >

              {
                campaign.status
              }

            </span>

          </div>

        </div>

      </div>

      {/* ======================================================
          SUCCESS
      ====================================================== */}

      {successMessage && (

        <div className="col-12">

          <div
            className="alert alert-success"
            role="alert"
          >

            <i className="bi bi-check-circle me-2" />

            {
              successMessage
            }

          </div>

        </div>

      )}

      {/* ======================================================
          GENERAL ERROR
      ====================================================== */}

      {error && (

        <div className="col-12">

          <div className="alert alert-danger">

            {
              error
            }

          </div>

        </div>

      )}

      {/* ======================================================
          PRODUCT IMAGES
      ====================================================== */}

      <div className="col-xl-5 col-lg-6">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-body">

            <h5 className="fw-bold mb-3">
              Product
            </h5>

            <div
              className="border rounded bg-light overflow-hidden mb-3 d-flex align-items-center justify-content-center"
              style={{
                height:
                  340,
              }}
            >

              {selectedImage ? (

                <img
                  src={
                    selectedImage
                  }
                  alt={
                    campaign.productName
                  }
                  style={{
                    width:
                      "100%",

                    height:
                      "100%",

                    objectFit:
                      "contain",
                  }}
                />

              ) : (

                <div className="text-center text-muted">

                  <i className="bi bi-image fs-1" />

                  <div>
                    No product image
                  </div>

                </div>

              )}

            </div>

            {campaign.images &&
              campaign.images.length >
                1 && (

                <div className="d-flex gap-2 flex-wrap">

                  {[
                    ...campaign.images,
                  ]
                    .sort(
                      (
                        a,
                        b
                      ) =>
                        a.imageOrder -
                        b.imageOrder
                    )
                    .map(
                      (
                        image
                      ) => (

                        <button
                          type="button"
                          key={
                            image.id
                          }
                          className={`border rounded p-1 bg-white ${
                            selectedImage ===
                            image.imagePath
                              ? "border-primary"
                              : ""
                          }`}
                          onClick={() =>
                            setSelectedImage(
                              image.imagePath
                            )
                          }
                          style={{
                            width:
                              70,

                            height:
                              70,
                          }}
                        >

                          <img
                            src={
                              image.imagePath
                            }
                            alt=""
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

                      )
                    )}

                </div>

              )}

          </div>

        </div>

      </div>

      {/* ======================================================
          CAMPAIGN SETTINGS
      ====================================================== */}

      <div className="col-xl-7 col-lg-6">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-body">

            <div className="d-flex justify-content-between align-items-center mb-4">

              <h5 className="fw-bold mb-0">
                Campaign Settings
              </h5>

             {!isEditing &&
                ["SUBMITTED", "APPROVED", "LIVE"].includes(
                  campaign.status
                ) && (
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={startEditing}
                  >
                    <i className="bi bi-pencil me-1" />

                    Edit Amount, Slots & Product Link
                  </button>
                )}

            </div>

            {isEditing ? (
              <>
                {editError && (

                  <div className="alert alert-danger py-2">

                    {
                      editError
                    }

                  </div>

                )}

                <div className="mb-3">

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
                    onChange={(
                      event
                    ) =>
                      setEarningAmount(
                        event.target
                          .value
                      )
                    }
                  />

                </div>

                <div className="mb-3">

                  <label className="form-label fw-semibold">

                    Total Slots

                  </label>

                  <input
                    type="number"
                    min={
                      campaign.filledSlots
                    }
                    step="1"
                    className="form-control"
                    value={
                      totalSlots
                    }
                    onChange={(
                      event
                    ) =>
                      setTotalSlots(
                        event.target
                          .value
                      )
                    }
                  />

                  <div className="form-text">

                    Minimum allowed:{" "}

                    <strong>

                      {
                        campaign.filledSlots
                      }

                    </strong>

                    {" "}
                    because these slots are already filled.

                  </div>

                </div>

                <div className="mb-3">

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
                        event.target.value
                      );

                      setEditError("");
                    }}
                  />

                  <div className="form-text">
                   Admin can update the product link for this campaign.
                  </div>

                </div>

                <div className="alert alert-light border">

                  New available slots:{" "}

                  <strong>

                    {Math.max(
                      0,

                      Number(
                        totalSlots ||
                          0
                      ) -
                        campaign.filledSlots
                    )}

                  </strong>

                </div>

                <div className="d-flex gap-2">

                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={
                      saving
                    }
                    onClick={
                      saveChanges
                    }
                  >

                    {saving ? (

                      <>
                        <span className="spinner-border spinner-border-sm me-2" />

                        Saving...
                      </>

                    ) : (

                      <>
                        <i className="bi bi-check-lg me-1" />

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

              <>
                <InfoRow
                  label="Earning per Tester"
                  value={`₹${Number(
                    campaign.earningAmount
                  ).toLocaleString(
                    "en-IN"
                  )}`}
                />

                <InfoRow
                  label="Total Slots"
                  value={
                    String(
                      campaign.totalSlots
                    )
                  }
                />

                <InfoRow
                  label="Filled Slots"
                  value={
                    String(
                      campaign.filledSlots
                    )
                  }
                />

                <InfoRow
                  label="Available Slots"
                  value={
                    String(
                      campaign.availableSlots ??
                        0
                    )
                  }
                />

                <InfoRow
                  label="Applications"
                  value={
                    String(
                      applicationCount
                    )
                  }
                />

                <InfoRow
                  label="Enrolled Testers"
                  value={
                    String(
                      enrolledCount
                    )
                  }
                />

              </>
            )}

          </div>

        </div>

      </div>

      {/* ======================================================
          BRAND INFORMATION
      ====================================================== */}

      <div className="col-lg-6">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-body">

            <h5 className="fw-bold mb-3">
              Brand Information
            </h5>

            <InfoRow
              label="Brand"
              value={
                campaign.brand
                  .companyName
              }
            />

            <InfoRow
              label="Company Type"
              value={
                campaign.brand
                  .companyType ||
                "-"
              }
            />

            <InfoRow
              label="Category"
              value={
                campaign.brand
                  .category
                  ?.name ??
                "-"
              }
            />

            {campaign.brand.website && (

              <div className="d-flex justify-content-between gap-3 border-bottom py-2">

                <span className="text-muted">
                  Website
                </span>

                <a
                  href={
                    campaign.brand
                      .website
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="text-end"
                >

                  {
                    campaign.brand
                      .website
                  }

                </a>

              </div>

            )}

            <InfoRow
              label="Contact Person"
              value={
                campaign.brand
                  .pocFullName ||
                "-"
              }
            />

            <InfoRow
              label="Contact Mobile"
              value={
                campaign.brand
                  .pocMobile ||
                "-"
              }
            />

          </div>

        </div>

      </div>

      {/* ======================================================
          TARGETING / DATES
      ====================================================== */}

      <div className="col-lg-6">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-body">

            <h5 className="fw-bold mb-3">
              Campaign Targeting
            </h5>

            <InfoRow
              label="State"
              value={
                displayTarget(
                  campaign.targetState
                )
              }
            />

            <InfoRow
              label="City"
              value={
                displayTarget(
                  campaign.targetCity
                )
              }
            />

            <InfoRow
              label="Gender"
              value={
                displayTarget(
                  campaign.targetGender
                )
              }
            />

            <InfoRow
              label="Start Date"
              value={
                formatDate(
                  campaign.startDate
                )
              }
            />

            <InfoRow
              label="End Date"
              value={
                formatDate(
                  campaign.endDate
                )
              }
            />

            <InfoRow
              label="Task 4 Required"
              value={
                campaign.task4Required
                  ? "Yes"
                  : "No"
              }
            />

          </div>

        </div>

      </div>

      {/* ======================================================
          PRODUCT DETAILS
      ====================================================== */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body">

            <h5 className="fw-bold mb-3">
              Product Details
            </h5>

            {campaign.productLink && (

              <div className="mb-3">

                <div className="text-muted small mb-1">
                  Product Link
                </div>

                <a
                  href={
                    campaign.productLink
                  }
                  target="_blank"
                  rel="noreferrer"
                >

                  {
                    campaign.productLink
                  }

                  <i className="bi bi-box-arrow-up-right ms-2" />

                </a>

              </div>

            )}

            <div>

              <div className="text-muted small mb-1">
                Description
              </div>
                 {campaign
              .productDescription && (
                <div
                    className="text-muted campaign-description"
                    dangerouslySetInnerHTML={{
                      __html:
                        decodeHtml(
                          campaign.productDescription
                        ),
                    }}
                  >

              </div>
              )}

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          QUESTIONS
      ====================================================== */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body">

            <h5 className="fw-bold mb-4">
              Campaign Questionnaire
            </h5>

            {!campaign
              .campaignQuestions ||
            campaign
              .campaignQuestions
              .length ===
              0 ? (

              <div className="text-muted">
                No questions are configured for this campaign.
              </div>

            ) : (

              campaign
                .campaignQuestions
                .map(
                  (
                    question,
                    index
                  ) => (

                    <div
                      key={
                        question.id
                      }
                      className="border rounded p-3 mb-3"
                    >

                      <div className="d-flex flex-column flex-md-row justify-content-between gap-2">

                        <div className="fw-semibold">

                          {index +
                            1}
                          .{" "}

                          {
                            question.questionText
                          }

                        </div>

                        <div>

                          <span className="badge bg-secondary me-2">

                            {
                              question.source
                            }

                          </span>

                          <span className="badge bg-light text-dark border">

                            {
                              formatQuestionType(
                                question.questionType
                              )
                            }

                          </span>

                        </div>

                      </div>

                      {question.question
                        ?.options &&
                        question.question
                          .options
                          .length >
                          0 && (

                          <div className="mt-3">

                            {[
                              ...question
                                .question
                                .options,
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
                                      option.id
                                    }
                                    className="small mb-1"
                                  >

                                    <i className="bi bi-circle me-2 text-muted" />

                                    {
                                      option.optionText
                                    }

                                  </div>

                                )
                              )}

                          </div>

                        )}

                    </div>

                  )
                )

            )}

          </div>

        </div>

      </div>

      {/* ======================================================
          SYSTEM INFORMATION
      ====================================================== */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body">

            <h5 className="fw-bold mb-3">
              Campaign Information
            </h5>

            <div className="row">

              <div className="col-md-4">

                <InfoRow
                  label="Campaign ID"
                  value={
                    String(
                      campaign.id
                    )
                  }
                />

              </div>

              <div className="col-md-4">

                <InfoRow
                  label="Status"
                  value={
                    campaign.status
                  }
                />

              </div>

              <div className="col-md-4">

                <InfoRow
                  label="Approved At"
                  value={
                    formatDateTime(
                      campaign.approvedAt
                    )
                  }
                />

              </div>

            </div>

          </div>

        </div>

      </div>

    </>
  );
}

// ============================================================
// INFO ROW
// ============================================================

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="d-flex justify-content-between gap-3 border-bottom py-2">

      <span className="text-muted">

        {
          label
        }

      </span>

      <span className="fw-semibold text-end">

        {
          value
        }

      </span>

    </div>
  );
}

// ============================================================
// DATE
// ============================================================

function formatDate(
  value?:
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

  return date.toLocaleDateString(
    "en-IN",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",
    }
  );
}

// ============================================================
// DATE TIME
// ============================================================

function formatDateTime(
  value?:
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

  return date.toLocaleString(
    "en-IN",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  );
}

// ============================================================
// TARGET
// ============================================================

function displayTarget(
  value?:
    | string
    | null
) {
  if (
    !value ||
    value.trim() ===
      "" ||
    value.toLowerCase() ===
      "any"
  ) {
    return "Any";
  }

  return value;
}

// ============================================================
// QUESTION TYPE
// ============================================================

function formatQuestionType(
  type: string
) {
  switch (type) {
    case "SINGLE_CHOICE":
      return "Single Choice";

    case "MULTIPLE_CHOICE":
      return "Multiple Choice";

    case "TEXT":
      return "Text";

    default:
      return type;
  }
}