"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

// ============================================================
// TYPES
// ============================================================

type PaymentMethod =
  | "UPI"
  | "BANK_TRANSFER";

type PaymentRequest = {
  id: number;

  status:
    string;

  amount:
    string | number;

  preferredPaymentMethod:
    PaymentMethod;

  requestedAt:
    string;

  approvedAt:
    | string
    | null;

  rejectionReason:
    | string
    | null;

  paidAt:
    | string
    | null;

  paidAmount:
    | string
    | number
    | null;

  paidMethod:
    | PaymentMethod
    | null;

  transactionReference:
    | string
    | null;
};

type EligibleCampaign = {
  testerCampaignId:
    number;

  earningAmount:
    string | number;

  completedAt:
    string | null;

  campaign: {
    id: number;

    productName:
      string;

    productImage:
      | string
      | null;

    brandName:
      | string
      | null;

    task4Required:
      boolean;
  };

  eligibility: {
    eligible:
      boolean;

    reason:
      string;
  };

  paymentRequest:
    | PaymentRequest
    | null;
};

type EligibilityResponse = {
  success: boolean;

  message:
    string;

  data?: {
    tester: {
      id: number;

      fullName:
        string;
    };

    paymentProfile: {
      hasActivePaymentDetails:
        boolean;

      upiAvailable:
        boolean;

      bankTransferAvailable:
        boolean;

      upiId:
        string | null;

      bankAccount:
        | {
            accountHolderName:
              string;

            bankName:
              string;

            accountNumberLast4:
              string | null;

            ifscCode:
              string;

            isVerified:
              boolean;
          }
        | null;
    };

    summary: {
      completedCampaigns:
        number;

      eligible:
        number;

      pending:
        number;

      approved:
        number;

      paid:
        number;
    };

    campaigns:
      EligibleCampaign[];
  };
};

type PaymentProfile =
  NonNullable<
    EligibilityResponse["data"]
  >["paymentProfile"];

type PaymentSummary =
  NonNullable<
    EligibilityResponse["data"]
  >["summary"];

// ============================================================
// PAGE
// ============================================================

export default function TesterPaymentsPage() {
  const [
    campaigns,
    setCampaigns,
  ] =
    useState<
      EligibleCampaign[]
    >([]);

  const [
    paymentProfile,
    setPaymentProfile,
  ] =
    useState<
      PaymentProfile | null
    >(null);

  const [
    summary,
    setSummary,
  ] =
    useState<
      PaymentSummary | null
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
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState("");

  const [
    requestingCampaignId,
    setRequestingCampaignId,
  ] =
    useState<
      number | null
    >(null);

  const [
    selectedMethods,
    setSelectedMethods,
  ] =
    useState<
      Record<
        number,
        PaymentMethod
      >
    >({});

  // ============================================================
  // LOAD
  // ============================================================

  const loadEligibility =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await fetch(
              "/api/tester/payments/eligible",
              {
                cache:
                  "no-store",
              }
            );

          const result =
            (await response.json()) as
              EligibilityResponse;

          if (!response.ok) {
            throw new Error(
              result.message ||
                "Unable to load payment information."
            );
          }

          const loadedCampaigns =
            result.data
              ?.campaigns ??
            [];

          setCampaigns(
            loadedCampaigns
          );

          setPaymentProfile(
            result.data
              ?.paymentProfile ??
              null
          );

          setSummary(
            result.data
              ?.summary ??
              null
          );

          const defaultMethods: Record<
            number,
            PaymentMethod
          > = {};

          for (
            const campaign
            of loadedCampaigns
          ) {
            if (
              result.data
                ?.paymentProfile
                .upiAvailable
            ) {
              defaultMethods[
                campaign.testerCampaignId
              ] =
                "UPI";
            } else if (
              result.data
                ?.paymentProfile
                .bankTransferAvailable
            ) {
              defaultMethods[
                campaign.testerCampaignId
              ] =
                "BANK_TRANSFER";
            }
          }

          setSelectedMethods(
            defaultMethods
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load payment information."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    loadEligibility();
  }, [
    loadEligibility,
  ]);

  // ============================================================
  // REQUEST PAYMENT
  // ============================================================

  async function requestPayment(
    campaign:
      EligibleCampaign
  ) {
    const method =
      selectedMethods[
        campaign.testerCampaignId
      ];

    if (!method) {
      setError(
        "Please select a payment method."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Request ₹${Number(
          campaign.earningAmount
        ).toLocaleString(
          "en-IN"
        )} payment for ${campaign.campaign.productName}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setRequestingCampaignId(
        campaign.testerCampaignId
      );

      setError("");
      setSuccessMessage("");

      const response =
        await fetch(
          "/api/tester/payments/request",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                testerCampaignId:
                  campaign.testerCampaignId,

                preferredPaymentMethod:
                  method,
              }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to submit payment request."
        );
      }

      setSuccessMessage(
        result.message ||
          "Payment request submitted successfully."
      );

      await loadEligibility();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit payment request."
      );
    } finally {
      setRequestingCampaignId(
        null
      );
    }
  }

  // ============================================================
  // TOTAL ELIGIBLE AMOUNT
  // ============================================================

  const eligibleAmount =
    useMemo(() => {
      return campaigns
        .filter(
          (campaign) =>
            campaign
              .eligibility
              .eligible
        )
        .reduce(
          (
            total,
            campaign
          ) =>
            total +
            Number(
              campaign
                .earningAmount
            ),
          0
        );
    }, [
      campaigns,
    ]);

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body py-5 text-center">

            <div className="spinner-border text-primary" />

            <div className="text-muted mt-3">
              Loading payments...
            </div>

          </div>

        </div>

      </div>
    );
  }

  return (
    <>
      {/* HEADER */}

      <div className="col-12">

        <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">

          <div>

            <h3 className="fw-bold mb-1">
              Payments
            </h3>

            <p className="text-muted mb-0">
              Request payment for completed
              campaigns and track request status.
            </p>

          </div>

          <Link
            href="/tester/wallet"
            className="btn btn-outline-primary align-self-start"
          >
            <i className="bi bi-wallet2 me-2"></i>

            View Wallet
          </Link>

        </div>

      </div>

      {/* SUMMARY */}

      {/* <div className="col-md-4">

        <SummaryCard
          label="Eligible Campaigns"
          value={
            summary?.eligible ??
            0
          }
        />

      </div> */}

      {/* <div className="col-md-4">

        <SummaryCard
          label="Pending / Approved"
          value={
            (summary?.pending ??
              0) +
            (summary?.approved ??
              0)
          }
        />

      </div> */}

      {/* <div className="col-md-4">

        <SummaryCard
          label="Eligible Amount"
          value={`₹${eligibleAmount.toLocaleString(
            "en-IN"
          )}`}
        />

      </div> */}

      {/* MESSAGES */}

      {successMessage && (

        <div className="col-12">

          <div className="alert alert-success">
            {
              successMessage
            }
          </div>

        </div>

      )}

      {error && (

        <div className="col-12">

          <div className="alert alert-danger">
            {error}
          </div>

        </div>

      )}

      {/* PAYMENT DETAILS */}

      {paymentProfile &&
        !paymentProfile
          .upiAvailable &&
        !paymentProfile
          .bankTransferAvailable && (

        <div className="col-12">

          <div className="alert alert-warning">

            <strong>
              Payment details required.
            </strong>

            <div className="mt-1">
              Add an active UPI ID or complete
              bank account information before
              requesting payment.
            </div>

          </div>

        </div>

      )}

      {/* EMPTY */}

      {campaigns.length ===
        0 && (

        <div className="col-12">

          <div className="card border-0 shadow-sm">

            <div className="card-body py-5 text-center">

              <i className="bi bi-cash-stack fs-1 text-muted"></i>

              <h5 className="fw-bold mt-3">
                No completed campaigns
              </h5>

              <p className="text-muted mb-0">
                Payment eligibility appears
                after a campaign is completed.
              </p>

            </div>

          </div>

        </div>

      )}

      {/* CAMPAIGNS */}

      {campaigns.map(
        (campaign) => (

          <div
            key={
              campaign
                .testerCampaignId
            }
            className="col-xl-6"
          >

            <div className="card border-0 shadow-sm h-100">

              <div className="card-body p-4">

                <div className="d-flex gap-3">

                  <div
                    className="rounded overflow-hidden bg-light flex-shrink-0"
                    style={{
                      width:
                        "72px",

                      height:
                        "72px",
                    }}
                  >

                    {campaign
                      .campaign
                      .productImage ? (

                      <img
                        src={
                          campaign
                            .campaign
                            .productImage
                        }
                        alt={
                          campaign
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

                      <div className="h-100 d-flex align-items-center justify-content-center">

                        <i className="bi bi-image text-muted"></i>

                      </div>

                    )}

                  </div>

                  <div className="flex-grow-1">

                    <div className="small fw-bold text-primary">

                      {
                        campaign
                          .campaign
                          .brandName ??
                        "Brand"
                      }

                    </div>

                    <h5 className="fw-bold mb-1">

                      {
                        campaign
                          .campaign
                          .productName
                      }

                    </h5>

                    <small className="text-muted">

                      Completed{" "}

                      {formatDate(
                        campaign
                          .completedAt
                      )}

                    </small>

                  </div>

                </div>

                <hr />

                <div className="d-flex justify-content-between align-items-center mb-3">

                  <span className="text-muted">
                    Campaign Earning
                  </span>

                  <strong className="fs-5 text-success">

                    ₹
                    {Number(
                      campaign
                        .earningAmount
                    ).toLocaleString(
                      "en-IN"
                    )}

                  </strong>

                </div>

                {/* NO REQUEST / REJECTED */}

                {campaign
                  .eligibility
                  .eligible && (

                  <div>

                    {campaign
                      .paymentRequest
                      ?.status ===
                      "REJECTED" && (

                      <div className="alert alert-danger py-2">

                        <strong>
                          Previous request rejected
                        </strong>

                        {campaign
                          .paymentRequest
                          .rejectionReason && (

                          <div className="small mt-1">
                            {
                              campaign
                                .paymentRequest
                                .rejectionReason
                            }
                          </div>

                        )}

                      </div>

                    )}

                    <label className="form-label fw-semibold">
                      Payment Method
                    </label>

                    <select
                      className="form-select mb-3"
                      value={
                        selectedMethods[
                          campaign
                            .testerCampaignId
                        ] ??
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        setSelectedMethods(
                          (
                            previous
                          ) => ({
                            ...previous,

                            [campaign.testerCampaignId]:
                              event
                                .target
                                .value as PaymentMethod,
                          })
                        )
                      }
                    >

                      <option value="">
                        Select method
                      </option>

                      {paymentProfile
                        ?.upiAvailable && (

                        <option value="UPI">
                          UPI
                        </option>

                      )}

                      {paymentProfile
                        ?.bankTransferAvailable && (

                        <option value="BANK_TRANSFER">
                          Bank Transfer
                        </option>

                      )}

                    </select>

                    <button
                      type="button"
                      className="btn btn-primary w-100"
                      disabled={
                        requestingCampaignId ===
                        campaign
                          .testerCampaignId
                      }
                      onClick={() =>
                        requestPayment(
                          campaign
                        )
                      }
                    >

                      {requestingCampaignId ===
                      campaign
                        .testerCampaignId
                        ? "Submitting..."
                        : "Request Payment"}

                    </button>

                  </div>

                )}

                {/* EXISTING STATUS */}

                {!campaign
                  .eligibility
                  .eligible &&
                  campaign
                    .paymentRequest && (

                  <PaymentRequestStatus
                    request={
                      campaign.paymentRequest
                    }
                  />

                )}

                {!campaign
                  .eligibility
                  .eligible &&
                  !campaign
                    .paymentRequest && (

                  <div className="alert alert-warning mb-0">

                    {
                      campaign
                        .eligibility
                        .reason
                    }

                  </div>

                )}

              </div>

            </div>

          </div>

        )
      )}
    </>
  );
}

// ============================================================
// REQUEST STATUS
// ============================================================

function PaymentRequestStatus({
  request,
}: {
  request:
    PaymentRequest;
}) {
  if (
    request.status ===
    "PENDING"
  ) {
    return (
      <div className="alert alert-warning mb-0">

        <strong>
          <i className="bi bi-hourglass-split me-2"></i>

          Waiting for Admin Review
        </strong>

        <div className="small mt-2">
          Requested{" "}
          {formatDate(
            request.requestedAt
          )}
        </div>

      </div>
    );
  }

  if (
    request.status ===
    "APPROVED"
  ) {
    return (
      <div className="alert alert-info mb-0">

        <strong>
          <i className="bi bi-check-circle me-2"></i>

          Request Approved
        </strong>

        <div className="small mt-2">
          Admin will pay manually using your
          selected payout details.
        </div>

      </div>
    );
  }

  if (
    request.status ===
    "PAID"
  ) {
    return (
      <div className="alert alert-success mb-0">

        <strong>
          <i className="bi bi-check-circle-fill me-2"></i>

          Paid
        </strong>

        <div className="small mt-2">

          {request.paidAmount !=
            null && (
            <div>
              Amount: ₹
              {Number(
                request.paidAmount
              ).toLocaleString(
                "en-IN"
              )}
            </div>
          )}

          {request.paidMethod && (
            <div>
              Method:{" "}
              {formatMethod(
                request.paidMethod
              )}
            </div>
          )}

          {request
            .transactionReference && (
            <div>
              Reference:{" "}
              {
                request
                  .transactionReference
              }
            </div>
          )}

          {request.paidAt && (
            <div>
              Paid:{" "}
              {formatDate(
                request.paidAt
              )}
            </div>
          )}

        </div>

      </div>
    );
  }

  return (
    <div className="alert alert-secondary mb-0">
      {request.status}
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;

  value:
    string | number;
}) {
  return (
    <div className="card border-0 shadow-sm h-100">

      <div className="card-body">

        <small className="text-muted d-block">
          {label}
        </small>

        <strong className="fs-5">
          {value}
        </strong>

      </div>

    </div>
  );
}

function formatDate(
  value:
    | string
    | null
) {
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

  return date.toLocaleDateString(
    "en-IN",
    {
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",
    }
  );
}

function formatMethod(
  method: string
) {
  if (
    method ===
    "BANK_TRANSFER"
  ) {
    return "Bank Transfer";
  }

  return method;
}