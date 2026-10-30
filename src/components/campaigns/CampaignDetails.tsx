'use client';

import {
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';

// ============================================================
// TYPES
// ============================================================

type CampaignImage = {
  imagePath: string;
  imageOrder: number;
};

type QuestionOption = {
  id: number;
  optionText: string;
  optionOrder: number;
};

type Question = {
  id: number;

  questionText: string;
  questionType: string;

  source: string;

  options: QuestionOption[];
};

type CampaignQuestion = {
  id: number;

  questionId: number | null;

  questionText: string;
  questionType: string;

  source: string;

  isRequired: boolean;

  questionOrder: number;

  question?: Question | null;
};

type Brand = {
  id: number;

  companyName: string | null;

  companyType: string | null;

   categoryId?:
    | number
    | null;

  category?:
    | {
        id: number;
        name: string;
      }
    | null;

  website: string | null;

  pocFullName: string | null;

  pocMobile: string | null;

  designation: string | null;
};

export type CampaignDetailsData = {
  id: number;

  campaignCode: string;

  // ==========================================================
  // PRODUCT
  // ==========================================================

  productName: string;

  // Old primary image
  productImage: string | null;

  // New multiple images
  images: CampaignImage[];

  productLink: string | null;

  productDescription: string | null;

  // ==========================================================
  // EARNING
  // ==========================================================

  earningAmount: number;

  currency: string;

  // ==========================================================
  // SLOTS
  // ==========================================================

  totalSlots: number;

  filledSlots: number;

  availableSlots: number;

  // ==========================================================
  // TARGETING
  // ==========================================================

  targetState: string | null;

  targetCity: string | null;

  targetGender: string | null;

  // ==========================================================
  // TASK
  // ==========================================================

  task4Required:
    | string
    | boolean
    | null;

  // ==========================================================
  // DATES
  // ==========================================================

  startDate: string | null;

  endDate: string | null;

  // ==========================================================
  // STATUS
  // ==========================================================

  status: string;

  submittedAt: string | null;

  approvedAt: string | null;

  approvedBy: number | null;

  rejectedAt: string | null;

  rejectionReason: string | null;

  // ==========================================================
  // AUDIT
  // ==========================================================

  createdBy: number | null;

  createdAt: string;

  updatedAt: string;

  // ==========================================================
  // BRAND
  // ==========================================================

  brandId: number;

  brand: Brand;

  // ==========================================================
  // QUESTIONS
  // ==========================================================

  campaignQuestions:
    CampaignQuestion[];
};

// ============================================================
// API RESPONSE
// ============================================================

type CampaignApiResponse = {
  success: boolean;

  role?: 'ADMIN' | 'BRAND';

  data?: CampaignDetailsData;

  message?: string;
};

// ============================================================
// PROPS
// ============================================================

interface CampaignDetailsProps {
  campaignId: number;

  backUrl?: string;
}

// ============================================================
// COMPONENT
// ============================================================

export default function CampaignDetails({
  campaignId,
  backUrl,
}: CampaignDetailsProps) {
  // ==========================================================
  // STATE
  // ==========================================================

  const [
    campaign,
    setCampaign,
  ] =
    useState<CampaignDetailsData | null>(
      null
    );

  const [
    role,
    setRole,
  ] =
    useState<
      'ADMIN' | 'BRAND' | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState('');

  // Selected image in gallery
  const [
    selectedImage,
    setSelectedImage,
  ] =
    useState<string | null>(
      null
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
  // FETCH CAMPAIGN
  // ==========================================================

  useEffect(() => {
    const fetchCampaignDetails =
      async () => {
        try {
          setLoading(true);

          setError('');

          const response =
            await fetch(
              `/api/campaigns/${campaignId}`,
              {
                method: 'GET',
                cache: 'no-store',
              }
            );

          const result: CampaignApiResponse =
            await response.json();

          if (
            !response.ok ||
            !result.success
          ) {
            throw new Error(
              result.message ||
                'Unable to load campaign details.'
            );
          }

          if (!result.data) {
            throw new Error(
              'Campaign data not found.'
            );
          }

          const campaignData =
            result.data;

          setCampaign(
            campaignData
          );

          if (result.role) {
            setRole(
              result.role
            );
          }

          // ==================================================
          // SELECT FIRST IMAGE
          // ==================================================

          if (
            campaignData.images &&
            campaignData.images
              .length > 0
          ) {
            setSelectedImage(
              campaignData.images[0]
                .imagePath
            );
          } else if (
            campaignData.productImage
          ) {
            // Backward compatibility
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
            'Campaign details fetch error:',
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load campaign details.'
          );
        } finally {
          setLoading(false);
        }
      };

    if (campaignId) {
      fetchCampaignDetails();
    }
  }, [campaignId]);

  // ==========================================================
  // DATE FORMAT
  // ==========================================================

  const formatDate = (
    date:
      | string
      | null
      | undefined
  ) => {
    if (!date) {
      return '-';
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return date;
    }

    return parsedDate.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    );
  };

  // ==========================================================
  // DATE TIME FORMAT
  // ==========================================================

  const formatDateTime = (
    date:
      | string
      | null
      | undefined
  ) => {
    if (!date) {
      return '-';
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return date;
    }

    return parsedDate.toLocaleString(
      'en-IN',
      {
        day: '2-digit',

        month: 'short',

        year: 'numeric',

        hour: '2-digit',

        minute: '2-digit',
      }
    );
  };

  // ==========================================================
  // STATUS BADGE
  // ==========================================================

  const getStatusBadgeClass = (
    status: string
  ) => {
    switch (
      status.toUpperCase()
    ) {
      case 'LIVE':
        return 'bg-success';

      case 'APPROVED':
        return 'bg-primary';

      case 'SUBMITTED':
        return 'bg-warning text-dark';

      case 'PENDING':
        return 'bg-warning text-dark';

      case 'COMPLETED':
        return 'bg-info text-dark';

      case 'REJECTED':
        return 'bg-danger';

      case 'CANCELLED':
        return 'bg-danger';

      case 'DEACTIVATED':
        return 'bg-secondary';

      default:
        return 'bg-secondary';
    }
  };

  // ==========================================================
  // QUESTION OPTIONS
  // ==========================================================

  const getQuestionOptions = (
    campaignQuestion:
      CampaignQuestion
  ) => {
    return (
      campaignQuestion.question
        ?.options ?? []
    );
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="card border-0 shadow-sm">

        <div className="card-body text-center py-5">

          <div
            className="spinner-border text-primary"
            role="status"
          >
            <span className="visually-hidden">
              Loading...
            </span>
          </div>

          <div className="mt-3 text-muted">
            Loading campaign
            details...
          </div>

        </div>

      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <div
        className="alert alert-danger"
        role="alert"
      >

        <strong>
          Unable to load campaign.
        </strong>

        <div className="mt-1">
          {error}
        </div>

      </div>
    );
  }

  // ==========================================================
  // NO DATA
  // ==========================================================

  if (!campaign) {
    return (
      <div
        className="alert alert-warning"
        role="alert"
      >
        Campaign information is
        not available.
      </div>
    );
  }

  // ==========================================================
  // PRODUCT IMAGE ARRAY
  // ==========================================================

  const productImages:
    CampaignImage[] =
    campaign.images &&
    campaign.images.length > 0
      ? campaign.images
      : campaign.productImage
      ? [
          {
            imagePath:
              campaign.productImage,

            imageOrder: 1,
          },
        ]
      : [];

  // ==========================================================
  // SELECTED IMAGE INDEX
  // ==========================================================

  const selectedImageIndex =
    productImages.findIndex(
      (image) =>
        image.imagePath ===
        selectedImage
    );

  // ==========================================================
  // TASK 4
  // ==========================================================

  const isTask4Required =
    campaign.task4Required ===
      true ||
    campaign.task4Required ===
      'YES' ||
    campaign.task4Required ===
      'true';

  // ==========================================================
  // BACK URL
  // ==========================================================

  const resolvedBackUrl =
    backUrl ??
    (role === 'ADMIN'
      ? '/admin/campaigns'
      : '/brand/campaigns');

  // ==========================================================
  // RETURN
  // ==========================================================

  return (
    <div className="w-100">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">

        <div>

          <div className="d-flex align-items-center gap-2 mb-1">

            <h4 className="fw-bold mb-0">
              Campaign Details
            </h4>           

            <span
              className={`badge ${getStatusBadgeClass(
                campaign.status
              )}`}
            >
              {campaign.status}
            </span>

          </div>

          <div className="text-muted">

            Campaign ID:{' '}

            <span className="fw-semibold">
              {
                campaign.campaignCode
              }
            </span>

          </div>

        </div>
        <Link href={`/brand/campaigns/${campaign.id}/testers`} className="btn btn-outline-primary">
          <i className="bi bi-people me-2" /> See Testers in Campaign
        </Link>
        <Link
          href={resolvedBackUrl}
          className="btn btn-outline-secondary"
        >
          ← Back to Campaigns
        </Link>

      </div>

      {/* ====================================================
          PRODUCT DETAILS
      ==================================================== */}

      <div className="card border-0 shadow-sm mb-4">

        <div className="card-header bg-white py-3">

          <h5 className="mb-0 fw-bold">
            Product Details
          </h5>

        </div>

        <div className="card-body">

          <div className="row g-4">

            {/* ================================================
                PRODUCT IMAGE GALLERY
            ================================================ */}

            <div className="col-lg-5">

              {/* MAIN IMAGE */}

              <div
                className="border rounded bg-light d-flex align-items-center justify-content-center overflow-hidden position-relative"
                style={{
                  minHeight:
                    '330px',
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
                      width: '100%',
                      height:
                        '330px',
                      objectFit:
                        'contain',
                    }}
                  />

                ) : (

                  <div className="text-muted text-center py-5">

                    <i className="bi bi-image fs-1"></i>

                    <div className="mt-2">
                      No product image
                    </div>

                  </div>

                )}

                {/* IMAGE NUMBER */}

                {productImages.length >
                  0 && (
                  <span
                    className="badge bg-dark position-absolute"
                    style={{
                      right: '10px',
                      bottom: '10px',
                    }}
                  >
                    {selectedImageIndex >=
                    0
                      ? selectedImageIndex +
                        1
                      : 1}
                    {' / '}
                    {
                      productImages.length
                    }
                  </span>
                )}

              </div>

              {/* ==============================================
                  THUMBNAILS
              ============================================== */}

              {productImages.length >
                1 && (
                <div className="row g-2 mt-2">

                  {productImages.map(
                    (
                      image,
                      index
                    ) => {

                      const isSelected =
                        selectedImage ===
                        image.imagePath;

                      return (
                        <div
                          className="col-3"
                          key={`${image.imageOrder}-${image.imagePath}`}
                        >

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedImage(
                                image.imagePath
                              )
                            }
                            className={`btn p-1 w-100 ${
                              isSelected
                                ? 'border-primary border-2'
                                : 'border'
                            }`}
                            style={{
                              backgroundColor:
                                '#fff',
                            }}
                            aria-label={`View product image ${
                              index +
                              1
                            }`}
                          >

                            <img
                              src={
                                image.imagePath
                              }
                              alt={`${campaign.productName} image ${
                                index +
                                1
                              }`}
                              loading="lazy"
                              style={{
                                width:
                                  '100%',

                                height:
                                  '75px',

                                objectFit:
                                  'cover',

                                borderRadius:
                                  '4px',
                              }}
                            />

                          </button>

                        </div>
                      );
                    }
                  )}

                </div>
              )}

              {/* IMAGE COUNT */}

              {productImages.length >
                0 && (
                <div className="small text-muted mt-2">
                  {
                    productImages.length
                  }{' '}
                  product{' '}
                  {productImages.length ===
                  1
                    ? 'image'
                    : 'images'}
                </div>
              )}

            </div>

            {/* ================================================
                PRODUCT INFORMATION
            ================================================ */}

            <div className="col-lg-7">

              <div className="row g-4">

                <div className="col-md-6">

                  <label className="text-muted small">
                    Product Name
                  </label>

                  <div className="fw-semibold">
                    {
                      campaign.productName
                    }
                  </div>

                </div>

                <div className="col-md-6">

                  <label className="text-muted small">
                    Product Link
                  </label>

                  <div>

                    {campaign.productLink ? (

                      <a
                        href={
                          campaign.productLink
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-decoration-none"
                      >
                        View Product

                        <i className="bi bi-box-arrow-up-right ms-1"></i>

                      </a>

                    ) : (
                      '-'
                    )}

                  </div>

                </div>

                <div className="col-12">

                  <label className="text-muted small">
                    Product Description
                  </label>
                  

                  {/* <div
                    className="border rounded bg-light p-3 mt-1"
                    style={{
                      whiteSpace:
                        'pre-wrap',
                    }}
                  >
                    {campaign.productDescription ||
                      '-'}
                  </div> */}
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

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ====================================================
          CAMPAIGN DETAILS
      ==================================================== */}

      <div className="card border-0 shadow-sm mb-4">

        <div className="card-header bg-white py-3">

          <h5 className="mb-0 fw-bold">
            Campaign Details
          </h5>

        </div>

        <div className="card-body">

          <div className="row g-4">

            <DetailItem
              label="Campaign Code"
              value={
                campaign.campaignCode
              }
            />

            <DetailItem
              label="Earning Per Tester"
              value={`${
                campaign.currency ===
                'INR'
                  ? '₹'
                  : `${campaign.currency} `
              }${campaign.earningAmount.toLocaleString(
                'en-IN'
              )}`}
            />

            <DetailItem
              label="Total Slots"
              value={
                campaign.totalSlots
              }
            />

            <DetailItem
              label="Filled Slots"
              value={
                campaign.filledSlots
              }
            />

            <DetailItem
              label="Available Slots"
              value={
                campaign.availableSlots
              }
            />

            <DetailItem
              label="Task 4 Required"
              value={
                isTask4Required
                  ? 'Yes'
                  : 'No'
              }
            />

            <DetailItem
              label="Start Date"
              value={formatDate(
                campaign.startDate
              )}
            />

            <DetailItem
              label="End Date"
              value={formatDate(
                campaign.endDate
              )}
            />

          </div>

        </div>

      </div>

      {/* ====================================================
          TARGETING
      ==================================================== */}

      <div className="card border-0 shadow-sm mb-4">

        <div className="card-header bg-white py-3">

          <h5 className="mb-0 fw-bold">
            Targeting
          </h5>

        </div>

        <div className="card-body">

          <div className="row g-4">

            <DetailItem
              label="State"
              value={
                campaign.targetState ||
                'Any'
              }
            />

            <DetailItem
              label="City"
              value={
                campaign.targetCity ||
                'Any'
              }
            />

            <DetailItem
              label="Gender"
              value={
                campaign.targetGender ||
                'Any'
              }
            />

          </div>

        </div>

      </div>

      {/* ====================================================
          QUESTIONS
      ==================================================== */}

      <div className="card border-0 shadow-sm mb-4">

        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">

          <h5 className="mb-0 fw-bold">
            Campaign Questions
          </h5>

          <span className="badge bg-secondary">

            {
              campaign
                .campaignQuestions
                .length
            }{' '}

            Questions

          </span>

        </div>

        <div className="card-body">

          {campaign
            .campaignQuestions
            .length > 0 ? (

            <div className="d-flex flex-column gap-3">

              {campaign.campaignQuestions.map(
                (
                  campaignQuestion,
                  index
                ) => {

                  const options =
                    getQuestionOptions(
                      campaignQuestion
                    );

                  return (
                    <div
                      key={
                        campaignQuestion.id
                      }
                      className="border rounded p-3"
                    >

                      <div className="d-flex justify-content-between gap-3 mb-2">

                        <div className="fw-semibold">

                          {index +
                            1}
                          .{' '}

                          {
                            campaignQuestion.questionText
                          }

                          {campaignQuestion.isRequired && (
                            <span className="text-danger ms-1">
                              *
                            </span>
                          )}

                        </div>

                        <div className="d-flex gap-2 flex-wrap">

                          <span className="badge bg-light text-dark border">

                            {
                              campaignQuestion.questionType
                            }

                          </span>

                          <span
                            className={`badge ${
                              campaignQuestion.source ===
                              'FIXED'
                                ? 'bg-primary'
                                : 'bg-info text-dark'
                            }`}
                          >

                            {
                              campaignQuestion.source
                            }

                          </span>

                        </div>

                      </div>

                      {options.length >
                        0 && (

                        <div className="mt-3">

                          <div className="text-muted small mb-2">
                            Options
                          </div>

                          <div className="d-flex flex-wrap gap-2">

                            {options.map(
                              (
                                option
                              ) => (

                                <span
                                  key={
                                    option.id
                                  }
                                  className="badge bg-light text-dark border px-3 py-2"
                                >
                                  {
                                    option.optionText
                                  }
                                </span>

                              )
                            )}

                          </div>

                        </div>
                      )}

                    </div>
                  );
                }
              )}

            </div>

          ) : (

            <div className="text-muted text-center py-4">
              No questions have
              been added to this
              campaign.
            </div>

          )}

        </div>

      </div>

      {/* ====================================================
          BRAND DETAILS
      ==================================================== */}
{/* 
      <div className="card border-0 shadow-sm mb-4">

        <div className="card-header bg-white py-3">

          <h5 className="mb-0 fw-bold">
            Brand Details
          </h5>

        </div>

        <div className="card-body">

          <div className="row g-4">

            <DetailItem
              label="Company Name"
              value={
                campaign.brand
                  ?.companyName ||
                '-'
              }
            />

            <DetailItem
              label="Company Type"
              value={
                campaign.brand
                  ?.companyType ||
                '-'
              }
            />

            <DetailItem
              label="Category"
              value={
                campaign.brand
                  .category
                  ?.name ||
                "-"
              }
            />

            <div className="col-md-6 col-lg-4">

              <label className="text-muted small">
                Website
              </label>

              <div className="fw-semibold">

                {campaign.brand
                  ?.website ? (

                  <a
                    href={
                      campaign.brand
                        .website
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-decoration-none"
                  >
                    {
                      campaign.brand
                        .website
                    }
                  </a>

                ) : (
                  '-'
                )}

              </div>

            </div>

            <DetailItem
              label="POC Full Name"
              value={
                campaign.brand
                  ?.pocFullName ||
                '-'
              }
            />

            <DetailItem
              label="POC Mobile"
              value={
                campaign.brand
                  ?.pocMobile ||
                '-'
              }
            />

            <DetailItem
              label="Designation"
              value={
                campaign.brand
                  ?.designation ||
                '-'
              }
            />

          </div>

        </div>

      </div> */}

      {/* ====================================================
          APPROVAL / STATUS
      ==================================================== */}

      {/* <div className="card border-0 shadow-sm mb-4">

        <div className="card-header bg-white py-3">

          <h5 className="mb-0 fw-bold">
            Approval / Status
          </h5>

        </div>

        <div className="card-body">

          <div className="row g-4">

            <div className="col-md-6 col-lg-4">

              <label className="text-muted small">
                Current Status
              </label>

              <div className="mt-1">

                <span
                  className={`badge ${getStatusBadgeClass(
                    campaign.status
                  )}`}
                >
                  {
                    campaign.status
                  }
                </span>

              </div>

            </div>

            <DetailItem
              label="Submitted At"
              value={formatDateTime(
                campaign.submittedAt
              )}
            />

            <DetailItem
              label="Approved At"
              value={formatDateTime(
                campaign.approvedAt
              )}
            />

            <DetailItem
              label="Approved By"
              value={
                campaign.approvedBy ??
                '-'
              }
            />

            <DetailItem
              label="Rejected At"
              value={formatDateTime(
                campaign.rejectedAt
              )}
            />

            <div className="col-12">

              <label className="text-muted small">
                Rejection Reason
              </label>

              <div className="border rounded p-3 mt-1">

                {campaign.rejectionReason ||
                  '-'}

              </div>

            </div>

          </div>

        </div>

      </div> */}

      {/* ====================================================
          SYSTEM INFORMATION
      ==================================================== */}
{/* 
      <div className="card border-0 shadow-sm mb-4">

        <div className="card-header bg-white py-3">

          <h5 className="mb-0 fw-bold">
            System Information
          </h5>

        </div>

        <div className="card-body">

          <div className="row g-4">

            <DetailItem
              label="Database ID"
              value={
                campaign.id
              }
            />

            <DetailItem
              label="Brand ID"
              value={
                campaign.brandId
              }
            />

            <DetailItem
              label="Created By"
              value={
                campaign.createdBy ??
                '-'
              }
            />

            <DetailItem
              label="Created At"
              value={formatDateTime(
                campaign.createdAt
              )}
            />

            <DetailItem
              label="Last Updated"
              value={formatDateTime(
                campaign.updatedAt
              )}
            />

          </div>

        </div>

      </div> */}

    </div>
  );
}

// ============================================================
// REUSABLE DETAIL ITEM
// ============================================================

function DetailItem({
  label,
  value,
}: {
  label: string;

  value:
    | string
    | number
    | null
    | undefined;
}) {
  return (
    <div className="col-md-6 col-lg-4">

      <label className="text-muted small">
        {label}
      </label>

      <div className="fw-semibold">

        {value === null ||
        value === undefined ||
        value === ''
          ? '-'
          : value}

      </div>

    </div>
  );
}