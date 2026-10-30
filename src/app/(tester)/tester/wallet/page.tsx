"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

// ============================================================
// TYPES
// ============================================================

type WalletTransaction = {
  id: number;

  type:
    string;

  amount:
    string | number;

  balanceAfter:
    string | number;

  description:
    | string
    | null;

  createdAt:
    string;

  campaign:
    | {
        testerCampaignId:
          number;

        productName:
          string;

        brandName:
          | string
          | null;
      }
    | null;

  payment:
    | {
        id: number;

        status:
          string;

        paidMethod:
          string | null;

        transactionReference:
          string | null;

        paidAt:
          string | null;
      }
    | null;
};

type WalletPaymentRequest = {
  id: number;

  amount:
    string | number;

  status:
    string;

  requestedAt:
    string;

  approvedAt:
    | string
    | null;

  paidAt:
    | string
    | null;

  paidAmount:
    | string
    | number
    | null;

  preferredPaymentMethod:
    string;

  paidMethod:
    | string
    | null;

  transactionReference:
    | string
    | null;

  rejectionReason:
    | string
    | null;

  campaign: {
    testerCampaignId:
      number;

    productName:
      string;

    brandName:
      | string
      | null;
  };
};

type WalletResponse = {
  success: boolean;

  message:
    string;

  data?: {
    tester: {
      id: number;

      fullName:
        string;
    };

    wallet: {
      exists:
        boolean;

      totalEarned:
        string | number;

      availableBalance:
        string | number;

      totalPaid:
        string | number;

      pendingAmount:
        number;

      approvedAwaitingPayment:
        number;
    };

    transactions:
      WalletTransaction[];

    paymentRequests:
      WalletPaymentRequest[];
  };
};

// ============================================================
// PAGE
// ============================================================

export default function TesterWalletPage() {
  const [
    data,
    setData,
  ] =
    useState<
      WalletResponse["data"] | null
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

  useEffect(() => {
    async function loadWallet() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            "/api/tester/wallet",
            {
              cache:
                "no-store",
            }
          );

        const result =
          (await response.json()) as
            WalletResponse;

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Unable to load wallet."
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
            : "Unable to load wallet."
        );
      } finally {
        setLoading(false);
      }
    }

    loadWallet();
  }, []);

  const paidRequests =
    useMemo(() => {
      return (
        data?.paymentRequests.filter(
          (request) =>
            request.status ===
            "PAID"
        ) ?? []
      );
    }, [
      data,
    ]);

  if (loading) {
    return (
      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body text-center py-5">

            <div className="spinner-border text-primary" />

            <div className="text-muted mt-3">
              Loading wallet...
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
            "Unable to load wallet."
          }
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
              My Wallet
            </h3>

            <p className="text-muted mb-0">
              Campaign earnings and manual
              payment history.
            </p>

          </div>

          <Link
            href="/tester/payments"
            className="btn btn-primary align-self-start"
          >
            <i className="bi bi-cash-stack me-2"></i>

            Withdraw Payment Request 
          </Link>

        </div>

      </div>

      {/* WALLET SUMMARY */}

      <div className="col-md-4">

        <WalletCard
          title="Total Earned"
          amount={
            Number(
              data.wallet
                .totalEarned
            )
          }
          icon="bi-graph-up-arrow"
        />

      </div>

      <div className="col-md-4">

        <WalletCard
          title="Available Balance"
          amount={
            Number(
              data.wallet
                .availableBalance
            )
          }
          icon="bi-wallet2"
        />

      </div>

      <div className="col-md-4">

        <WalletCard
          title="Total Withdrawals"
          amount={
            Number(
              data.wallet
                .totalPaid
            )
          }
          icon="bi-check-circle"
        />

      </div>

      {/* REQUEST SUMMARY */}

      {/* <div className="col-md-6">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-body">

            <small className="text-muted d-block">
              Pending Admin Review
            </small>

            <strong className="fs-5">
              ₹
              {Number(
                data.wallet
                  .pendingAmount
              ).toLocaleString(
                "en-IN"
              )}
            </strong>

          </div>

        </div>

      </div> */}
{/* 
      <div className="col-md-6">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-body">

            <small className="text-muted d-block">
              Approved — Awaiting Manual Payment
            </small>

            <strong className="fs-5">
              ₹
              {Number(
                data.wallet
                  .approvedAwaitingPayment
              ).toLocaleString(
                "en-IN"
              )}
            </strong>

          </div>

        </div>

      </div> */}

      {/* TRANSACTIONS */}

      {/* <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body">

            <h5 className="fw-bold mb-1">
              Wallet Transactions
            </h5>

            <p className="text-muted small">
              Campaign earnings and paid
              payment entries.
            </p>

            {data.transactions.length ===
            0 ? (

              <div className="text-center py-5">

                <i className="bi bi-wallet2 fs-1 text-muted"></i>

                <p className="text-muted mt-3 mb-0">
                  No wallet transactions yet.
                </p>

              </div>

            ) : (

              <div className="d-flex flex-column">

                {data.transactions.map(
                  (transaction) => {

                    const isEarning =
                      transaction.type ===
                      "CAMPAIGN_EARNING";

                    return (
                      <div
                        key={
                          transaction.id
                        }
                        className="border-bottom py-3"
                      >

                        <div className="d-flex justify-content-between gap-3">

                          <div>

                            <div className="fw-semibold">

                              {isEarning
                                ? "Campaign Earning"
                                : "Payment Paid"}

                            </div>

                            {transaction
                              .campaign && (

                              <div className="small text-muted">

                                {
                                  transaction
                                    .campaign
                                    .productName
                                }

                                {transaction
                                  .campaign
                                  .brandName &&
                                  ` • ${transaction.campaign.brandName}`}

                              </div>

                            )}

                            {transaction.description && (

                              <div className="small text-muted mt-1">

                                {
                                  transaction.description
                                }

                              </div>

                            )}

                            <div className="small text-muted mt-1">

                              {formatDateTime(
                                transaction
                                  .createdAt
                              )}

                            </div>

                          </div>

                          <div className="text-end">

                            <strong
                              className={
                                isEarning
                                  ? "text-success"
                                  : "text-danger"
                              }
                            >

                              {isEarning
                                ? "+"
                                : "-"}

                              ₹
                              {Number(
                                transaction
                                  .amount
                              ).toLocaleString(
                                "en-IN"
                              )}

                            </strong>

                            <div className="small text-muted">

                              Balance ₹
                              {Number(
                                transaction
                                  .balanceAfter
                              ).toLocaleString(
                                "en-IN"
                              )}

                            </div>

                          </div>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            )}

          </div>

        </div>

      </div> */}

      {/* PAYMENT HISTORY */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body">

            <h5 className="fw-bold mb-3">
              Payment History
            </h5>

            {paidRequests.length ===
            0 ? (

              <p className="text-muted mb-0">
                No paid requests yet.
              </p>

            ) : (

              <div className="d-flex flex-column gap-3">

                {paidRequests.map(
                  (request) => (

                    <div
                      key={
                        request.id
                      }
                      className="border rounded-3 p-3"
                    >

                      <div className="d-flex flex-wrap justify-content-between gap-3">

                        <div>

                          <strong>
                            {
                              request
                                .campaign
                                .productName
                            }
                          </strong>

                          <div className="small text-muted">

                            {
                              request
                                .campaign
                                .brandName ??
                              "Brand"
                            }

                          </div>

                        </div>

                        <div className="text-end">

                          <strong className="text-success">

                            ₹
                            {Number(
                              request.paidAmount ??
                                request.amount
                            ).toLocaleString(
                              "en-IN"
                            )}

                          </strong>

                          <div>

                            <span className="badge bg-success">
                              PAID
                            </span>

                          </div>

                        </div>

                      </div>

                      <div className="row g-2 small mt-3">

                        <div className="col-md-4">

                          <span className="text-muted">
                            Method:
                          </span>{" "}

                          {
                            formatMethod(
                              request.paidMethod ??
                                request.preferredPaymentMethod
                            )
                          }

                        </div>

                        <div className="col-md-4">

                          <span className="text-muted">
                            Reference:
                          </span>{" "}

                          {
                            request
                              .transactionReference ??
                            "-"
                          }

                        </div>

                        <div className="col-md-4">

                          <span className="text-muted">
                            Paid:
                          </span>{" "}

                          {
                            formatDateTime(
                              request.paidAt
                            )
                          }

                        </div>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        </div>

      </div>
    </>
  );
}

// ============================================================
// WALLET CARD
// ============================================================

function WalletCard({
  title,
  amount,
  icon,
}: {
  title: string;

  amount: number;

  icon: string;
}) {
  return (
    <div className="card border-0 shadow-sm h-100">

      <div className="card-body">

        <div
          className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center mb-3"
          style={{
            width:
              "46px",

            height:
              "46px",
          }}
        >
          <i
            className={`bi ${icon} fs-5`}
          />
        </div>

        <small className="text-muted d-block">
          {title}
        </small>

        <strong className="fs-4">
          ₹
          {amount.toLocaleString(
            "en-IN"
          )}
        </strong>

      </div>

    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

function formatMethod(
  method:
    | string
    | null
) {
  if (!method) {
    return "-";
  }

  if (
    method ===
    "BANK_TRANSFER"
  ) {
    return "Bank Transfer";
  }

  return method;
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