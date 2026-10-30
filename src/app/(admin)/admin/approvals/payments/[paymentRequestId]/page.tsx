"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

type PaymentStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "PAID";

type PaymentMethod =
  | "UPI"
  | "BANK_TRANSFER";

type TimelineItem = {
  type: string;

  title: string;

  description: string;

  date: string;

  actor:
    | string
    | null;
};

type WalletTransaction = {
  id: number;

  type: string;

  amount:
    | string
    | number;

  balanceAfter:
    | string
    | number;

  description:
    | string
    | null;

  createdAt:
    string;
};

type DetailResponse = {
  success: boolean;

  message: string;

  data?: {
    paymentRequest: {
      id: number;

      amount:
        | string
        | number;

      preferredPaymentMethod:
        PaymentMethod;

      status:
        PaymentStatus;

      requestedAt:
        string;

      reviewedAt:
        | string
        | null;

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

      adminNote:
        | string
        | null;
    };

    tester: {
      id: number;

      fullName: string;

      email:
        | string
        | null;

      mobile:
        | string
        | null;

      bankDetails:
        | {
            accountHolderName:
              string;

            bankName:
              string;

            accountNumber:
              string;

            accountNumberLast4:
              | string
              | null;

            ifscCode:
              string;

            upiId:
              | string
              | null;

            isActive:
              boolean;

            isVerified:
              boolean;
          }
        | null;

      wallet:
        | {
            id: number;

            totalEarned:
              | string
              | number;

            availableBalance:
              | string
              | number;

            totalPaid:
              | string
              | number;
          }
        | null;
    };

    campaign: {
      testerCampaignId:
        number;

      testerCampaignStatus:
        string;

      earningAmount:
        | string
        | number;

      completedAt:
        | string
        | null;

      id: number;

      productName:
        string;

      productImage:
        | string
        | null;

      task4Required:
        boolean;

      brandName:
        | string
        | null;
    };

    reviewer:
      | {
          id: number;

          name:
            | string
            | null;

          role:
            string;
        }
      | null;

    payer:
      | {
          id: number;

          name:
            | string
            | null;

          role:
            string;
        }
      | null;

    timeline:
      TimelineItem[];

    walletTransactions:
      WalletTransaction[];
  };
};

type DetailData =
  NonNullable<
    DetailResponse["data"]
  >;

export default function AdminPaymentDetailPage() {
  const params =
    useParams<{
      paymentRequestId:
        string;
    }>();

  const paymentRequestId =
    Number(
      params.paymentRequestId
    );

  const [
    data,
    setData,
  ] =
    useState<
      DetailData | null
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

  const loadDetails =
    useCallback(
      async () => {
        if (
          !Number.isInteger(
            paymentRequestId
          ) ||
          paymentRequestId <= 0
        ) {
          setError(
            "Invalid payment request."
          );

          setLoading(false);

          return;
        }

        try {
          setLoading(true);
          setError("");

          const response =
            await fetch(
              `/api/admin/payments/${paymentRequestId}`,
              {
                cache:
                  "no-store",
              }
            );

          const result =
            (await response.json()) as
              DetailResponse;

          if (!response.ok) {
            throw new Error(
              result.message ||
                "Unable to load payment details."
            );
          }

          setData(
            result.data ??
              null
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load payment details."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        paymentRequestId,
      ]
    );

  useEffect(() => {
    loadDetails();
  }, [
    loadDetails,
  ]);

  if (loading) {
    return (
      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body py-5 text-center">

            <div className="spinner-border text-primary" />

            <div className="text-muted mt-3">
              Loading payment details...
            </div>

          </div>

        </div>

      </div>
    );
  }

  if (
    error ||
    !data
  ) {
    return (
      <div className="col-12">

        <div className="alert alert-danger">
          {
            error ||
            "Payment request not found."
          }
        </div>

        <Link
          href="/admin/approvals/payments"
          className="btn btn-outline-primary"
        >
          Back to Payments
        </Link>

      </div>
    );
  }

  const {
    paymentRequest,
    tester,
    campaign,
    reviewer,
    payer,
    timeline,
    walletTransactions,
  } = data;

  return (
    <>
      {/* HEADER */}

      <div className="col-12">

        <Link
          href="/admin/approvals/payments"
          className="text-decoration-none small"
        >
          <i className="bi bi-arrow-left me-1"></i>

          Payment Requests
        </Link>

      </div>

      <div className="col-12">

        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-start gap-3">

          <div>

            <h3 className="fw-bold mb-1">
              Payment Request #
              {
                paymentRequest.id
              }
            </h3>

            <p className="text-muted mb-0">
              Complete payment request details
              and manual payment history.
            </p>

          </div>

          <StatusBadge
            status={
              paymentRequest.status
            }
          />

        </div>

      </div>

      {/* SUMMARY */}

      <div className="col-md-4">

        <SummaryCard
          label="Requested Amount"
          value={`₹${Number(
            paymentRequest.amount
          ).toLocaleString(
            "en-IN"
          )}`}
        />

      </div>

      <div className="col-md-4">

        <SummaryCard
          label="Preferred Method"
          value={
            formatMethod(
              paymentRequest
                .preferredPaymentMethod
            )
          }
        />

      </div>

      <div className="col-md-4">

        <SummaryCard
          label="Requested"
          value={
            formatDateTime(
              paymentRequest
                .requestedAt
            )
          }
        />

      </div>

      {/* TESTER + CAMPAIGN */}

      <div className="col-xl-6">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-body p-4">

            <h5 className="fw-bold mb-3">
              Tester
            </h5>

            <InfoRow
              label="Name"
              value={
                tester.fullName
              }
            />

            <InfoRow
              label="Email"
              value={
                tester.email ??
                "-"
              }
            />

            <InfoRow
              label="Mobile"
              value={
                tester.mobile ??
                "-"
              }
            />

            {tester.wallet && (
              <>
                <hr />

                <InfoRow
                  label="Wallet Balance"
                  value={`₹${Number(
                    tester.wallet
                      .availableBalance
                  ).toLocaleString(
                    "en-IN"
                  )}`}
                />

                <InfoRow
                  label="Total Earned"
                  value={`₹${Number(
                    tester.wallet
                      .totalEarned
                  ).toLocaleString(
                    "en-IN"
                  )}`}
                />

                <InfoRow
                  label="Total Paid"
                  value={`₹${Number(
                    tester.wallet
                      .totalPaid
                  ).toLocaleString(
                    "en-IN"
                  )}`}
                />
              </>
            )}

          </div>

        </div>

      </div>

      <div className="col-xl-6">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-body p-4">

            <h5 className="fw-bold mb-3">
              Campaign
            </h5>

            <div className="d-flex gap-3 mb-3">

              <div
                className="rounded overflow-hidden bg-light flex-shrink-0 d-flex align-items-center justify-content-center"
                style={{
                  width:
                    "72px",

                  height:
                    "72px",
                }}
              >

                {campaign.productImage ? (

                  <img
                    src={
                      campaign.productImage
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
                        "cover",
                    }}
                  />

                ) : (

                  <i className="bi bi-image text-muted fs-4"></i>

                )}

              </div>

              <div>

                <div className="small text-primary fw-bold">
                  {
                    campaign.brandName ??
                    "Brand"
                  }
                </div>

                <strong>
                  {
                    campaign.productName
                  }
                </strong>

              </div>

            </div>

            <InfoRow
              label="Tester Campaign ID"
              value={
                String(
                  campaign
                    .testerCampaignId
                )
              }
            />

            <InfoRow
              label="Campaign Earning"
              value={`₹${Number(
                campaign
                  .earningAmount
              ).toLocaleString(
                "en-IN"
              )}`}
            />

            <InfoRow
              label="Campaign Status"
              value={
                campaign
                  .testerCampaignStatus
              }
            />

            <InfoRow
              label="Completed"
              value={
                formatDateTime(
                  campaign.completedAt
                )
              }
            />

          </div>

        </div>

      </div>

      {/* PAYMENT DESTINATION */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body p-4">

            <h5 className="fw-bold mb-3">
              Manual Payment Destination
            </h5>

            {!tester.bankDetails ? (

              <div className="alert alert-warning mb-0">
                Tester payment details are
                unavailable.
              </div>

            ) : paymentRequest
                .preferredPaymentMethod ===
              "UPI" ? (

              <div className="row g-3">

                <div className="col-md-6">

                  <InfoBox
                    label="UPI ID"
                    value={
                      tester
                        .bankDetails
                        .upiId ??
                      "-"
                    }
                  />

                </div>

                <div className="col-md-6">

                  <InfoBox
                    label="Status"
                    value={
                      tester
                        .bankDetails
                        .isActive
                        ? "Active"
                        : "Inactive"
                    }
                  />

                </div>

              </div>

            ) : (

              <div className="row g-3">

                <div className="col-md-6">

                  <InfoBox
                    label="Account Holder"
                    value={
                      tester
                        .bankDetails
                        .accountHolderName
                    }
                  />

                </div>

                <div className="col-md-6">

                  <InfoBox
                    label="Bank"
                    value={
                      tester
                        .bankDetails
                        .bankName
                    }
                  />

                </div>

                <div className="col-md-6">

                  <InfoBox
                    label="Account Number"
                    value={
                      tester
                        .bankDetails
                        .accountNumber
                    }
                  />

                </div>

                <div className="col-md-6">

                  <InfoBox
                    label="IFSC"
                    value={
                      tester
                        .bankDetails
                        .ifscCode
                    }
                  />

                </div>

              </div>

            )}

          </div>

        </div>

      </div>

      {/* REVIEW / PAYMENT RECORD */}

      <div className="col-xl-6">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-body p-4">

            <h5 className="fw-bold mb-3">
              Admin Review
            </h5>

            <InfoRow
              label="Status"
              value={
                paymentRequest.status
              }
            />

            <InfoRow
              label="Reviewed By"
              value={
                reviewer?.name ??
                "-"
              }
            />

            <InfoRow
              label="Reviewed At"
              value={
                formatDateTime(
                  paymentRequest
                    .reviewedAt
                )
              }
            />

            <InfoRow
              label="Approved At"
              value={
                formatDateTime(
                  paymentRequest
                    .approvedAt
                )
              }
            />

            {paymentRequest
              .rejectionReason && (

              <div className="alert alert-danger mt-3 mb-0">

                <strong>
                  Rejection reason
                </strong>

                <div className="mt-1">
                  {
                    paymentRequest
                      .rejectionReason
                  }
                </div>

              </div>

            )}

          </div>

        </div>

      </div>

      <div className="col-xl-6">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-body p-4">

            <h5 className="fw-bold mb-3">
              Manual Payment Record
            </h5>

            <InfoRow
              label="Paid By"
              value={
                payer?.name ??
                "-"
              }
            />

            <InfoRow
              label="Paid Amount"
              value={
                paymentRequest
                  .paidAmount !=
                null
                  ? `₹${Number(
                      paymentRequest
                        .paidAmount
                    ).toLocaleString(
                      "en-IN"
                    )}`
                  : "-"
              }
            />

            <InfoRow
              label="Paid Method"
              value={
                formatMethod(
                  paymentRequest
                    .paidMethod
                )
              }
            />

            <InfoRow
              label="Reference ID"
              value={
                paymentRequest
                  .transactionReference ??
                "-"
              }
            />

            <InfoRow
              label="Paid At"
              value={
                formatDateTime(
                  paymentRequest
                    .paidAt
                )
              }
            />

            {paymentRequest
              .adminNote && (

              <div className="border rounded p-3 bg-light mt-3">

                <small className="text-muted d-block">
                  Admin Note
                </small>

                {
                  paymentRequest
                    .adminNote
                }

              </div>

            )}

          </div>

        </div>

      </div>

      {/* TIMELINE */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body p-4">

            <h5 className="fw-bold mb-4">
              Payment Timeline
            </h5>

            <div className="d-flex flex-column gap-3">

              {timeline.map(
                (
                  item,
                  index
                ) => (

                  <div
                    key={`${item.type}-${index}`}
                    className="border rounded-3 p-3"
                  >

                    <div className="d-flex flex-column flex-md-row justify-content-between gap-2">

                      <div>

                        <div className="fw-bold">
                          {
                            item.title
                          }
                        </div>

                        <div className="text-muted small mt-1">
                          {
                            item.description
                          }
                        </div>

                        {item.actor && (

                          <div className="small mt-2">

                            By:{" "}

                            <strong>
                              {
                                item.actor
                              }
                            </strong>

                          </div>

                        )}

                      </div>

                      <div className="small text-muted text-md-end">

                        {formatDateTime(
                          item.date
                        )}

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          </div>

        </div>

      </div>

      {/* WALLET TRANSACTION */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body p-4">

            <h5 className="fw-bold mb-3">
              Related Wallet Transactions
            </h5>

            {walletTransactions.length ===
            0 ? (

              <p className="text-muted mb-0">
                No payment-related wallet
                transaction has been recorded yet.
              </p>

            ) : (

              <div className="table-responsive">

                <table className="table align-middle mb-0">

                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Balance After</th>
                      <th>Date</th>
                    </tr>
                  </thead>

                  <tbody>

                    {walletTransactions.map(
                      (transaction) => (

                        <tr
                          key={
                            transaction.id
                          }
                        >
                          <td>
                            {
                              transaction.type
                            }
                          </td>

                          <td>
                            ₹
                            {Number(
                              transaction.amount
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </td>

                          <td>
                            ₹
                            {Number(
                              transaction
                                .balanceAfter
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </td>

                          <td>
                            {formatDateTime(
                              transaction.createdAt
                            )}
                          </td>
                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </div>

      </div>
    </>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div className="card border-0 shadow-sm h-100">

      <div className="card-body">

        <small className="text-muted d-block mb-1">
          {label}
        </small>

        <strong className="fs-5">
          {value}
        </strong>

      </div>

    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div className="d-flex justify-content-between gap-3 py-2 border-bottom">

      <span className="text-muted">
        {label}
      </span>

      <strong className="text-end text-break">
        {value}
      </strong>

    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div className="border rounded-3 p-3 h-100">

      <small className="text-muted d-block mb-1">
        {label}
      </small>

      <strong className="text-break">
        {value}
      </strong>

    </div>
  );
}

function StatusBadge({
  status,
}: {
  status:
    PaymentStatus;
}) {
  const className =
    status === "PAID"
      ? "bg-success"
      : status ===
          "APPROVED"
        ? "bg-info text-dark"
        : status ===
            "REJECTED"
          ? "bg-danger"
          : "bg-warning text-dark";

  return (
    <span
      className={`badge ${className} fs-6 px-3 py-2 align-self-start`}
    >
      {status}
    </span>
  );
}

function formatMethod(
  method:
    | string
    | null
) {
  if (!method) {
    return "-";
  }

  return method ===
    "BANK_TRANSFER"
    ? "Bank Transfer"
    : "UPI";
}

function formatDateTime(
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
