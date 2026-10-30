//  Admin Payments Page 
//what is this file for?
// This file is for the admin to view and manage payment requests from testers.
// The admin can filter payment requests by status (ALL, PENDING, APPROVED, PAID, REJECTED).
// The admin can approve or reject payment requests, and record manual payments made outside the system.
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

type PaymentStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "PAID";

type PaymentMethod =
  | "UPI"
  | "BANK_TRANSFER";

type PaymentRequestItem = {
  id: number;

  amount:
    string | number;

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

  tester: {
    id: number;

    fullName:
      string;

    bankDetails:
      | {
          accountHolderName:
            string;

          bankName:
            string;

          accountNumberLast4:
            string | null;

          ifscCode:
            string;

          upiId:
            string | null;

          isActive:
            boolean;

          isVerified:
            boolean;
        }
      | null;
  };

  campaign: {
    testerCampaignId:
      number;

    productName:
      string;

    productImage:
      | string
      | null;

    brandName:
      | string
      | null;

    completedAt:
      string | null;
  };

  reviewer:
    | {
        id: number;

        name:
          | string
          | null;
      }
    | null;

  payer:
    | {
        id: number;

        name:
          | string
          | null;
      }
    | null;
};

type AdminPaymentsResponse = {
  success:
    boolean;

  message?:
    string;

  data?: {
    total:
      number;

    pending:
      number;

    approved:
      number;

    paid:
      number;

    rejected:
      number;

    requests:
      PaymentRequestItem[];
  };
};

type Filter =
  | "ALL"
  | PaymentStatus;

// ============================================================
// PAGE
// ============================================================

export default function AdminPaymentsPage() {
  const [
    requests,
    setRequests,
  ] =
    useState<
      PaymentRequestItem[]
    >([]);

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
    activeFilter,
    setActiveFilter,
  ] =
    useState<Filter>(
      "PENDING"
    );

  const [
    processingId,
    setProcessingId,
  ] =
    useState<
      number | null
    >(null);

  const [
    rejectionRequest,
    setRejectionRequest,
  ] =
    useState<
      PaymentRequestItem | null
    >(null);

  const [
    rejectionReason,
    setRejectionReason,
  ] =
    useState("");

  const [
    markPaidRequest,
    setMarkPaidRequest,
  ] =
    useState<
      PaymentRequestItem | null
    >(null);

  const [
    paidMethod,
    setPaidMethod,
  ] =
    useState<
      PaymentMethod | ""
    >("");

  const [
    paidAmount,
    setPaidAmount,
  ] =
    useState("");

  const [
    transactionReference,
    setTransactionReference,
  ] =
    useState("");

  const [
    adminNote,
    setAdminNote,
  ] =
    useState("");

  // ============================================================
  // LOAD
  // ============================================================

  const loadPayments =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await fetch(
              "/api/admin/payments",
              {
                cache:
                  "no-store",
              }
            );

          const result =
            (await response.json()) as
              AdminPaymentsResponse;

          if (!response.ok) {
            throw new Error(
              result.message ||
                "Unable to load payment requests."
            );
          }

          setRequests(
            result.data
              ?.requests ??
              []
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load payment requests."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    loadPayments();
  }, [
    loadPayments,
  ]);

  // ============================================================
  // FILTER
  // ============================================================

  const counts =
    useMemo(() => {
      return {
        ALL:
          requests.length,

        PENDING:
          requests.filter(
            (item) =>
              item.status ===
              "PENDING"
          ).length,

        APPROVED:
          requests.filter(
            (item) =>
              item.status ===
              "APPROVED"
          ).length,

        REJECTED:
          requests.filter(
            (item) =>
              item.status ===
              "REJECTED"
          ).length,

        PAID:
          requests.filter(
            (item) =>
              item.status ===
              "PAID"
          ).length,
      };
    }, [
      requests,
    ]);

  const filtered =
    useMemo(() => {
      if (
        activeFilter ===
        "ALL"
      ) {
        return requests;
      }

      return requests.filter(
        (item) =>
          item.status ===
          activeFilter
      );
    }, [
      requests,
      activeFilter,
    ]);

  // ============================================================
  // REVIEW
  // ============================================================

  async function reviewRequest(
    requestId: number,
    action:
      | "APPROVE"
      | "REJECT",
    reason?: string
  ) {
    try {
      setProcessingId(
        requestId
      );

      setError("");
      setSuccessMessage("");

      const response =
        await fetch(
          `/api/admin/payments/${requestId}/review`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                action,

                rejectionReason:
                  reason ??
                  null,
              }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to review payment request."
        );
      }

      setSuccessMessage(
        result.message
      );

      setRejectionRequest(
        null
      );

      setRejectionReason(
        ""
      );

      await loadPayments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to review payment request."
      );
    } finally {
      setProcessingId(
        null
      );
    }
  }

  // ============================================================
  // APPROVE
  // ============================================================

  async function handleApprove(
    item:
      PaymentRequestItem
  ) {
    const confirmed =
      window.confirm(
        `Approve ₹${Number(
          item.amount
        ).toLocaleString(
          "en-IN"
        )} payment request for ${item.tester.fullName}?`
      );

    if (!confirmed) {
      return;
    }

    await reviewRequest(
      item.id,
      "APPROVE"
    );
  }

  // ============================================================
  // REJECT
  // ============================================================

  async function handleReject() {
    if (
      !rejectionRequest
    ) {
      return;
    }

    const reason =
      rejectionReason.trim();

    if (!reason) {
      setError(
        "Rejection reason is required."
      );

      return;
    }

    await reviewRequest(
      rejectionRequest.id,
      "REJECT",
      reason
    );
  }

  // ============================================================
  // OPEN MARK PAID
  // ============================================================

  function openMarkPaid(
    item:
      PaymentRequestItem
  ) {
    setMarkPaidRequest(
      item
    );

    setPaidMethod(
      item.preferredPaymentMethod
    );

    setPaidAmount(
      String(
        Number(
          item.amount
        )
      )
    );

    setTransactionReference(
      ""
    );

    setAdminNote(
      ""
    );

    setError("");
  }

  // ============================================================
  // MARK PAID
  // ============================================================

  async function handleMarkPaid() {
    if (
      !markPaidRequest
    ) {
      return;
    }

    if (
      !paidMethod
    ) {
      setError(
        "Select payment method."
      );

      return;
    }

    if (
      !transactionReference.trim()
    ) {
      setError(
        "Transaction/reference ID is required."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Confirm that ₹${Number(
          paidAmount
        ).toLocaleString(
          "en-IN"
        )} has already been manually paid to ${markPaidRequest.tester.fullName}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(
        markPaidRequest.id
      );

      setError("");
      setSuccessMessage("");

      const response =
        await fetch(
          `/api/admin/payments/${markPaidRequest.id}/mark-paid`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                paidMethod,

                paidAmount:
                  Number(
                    paidAmount
                  ),

                transactionReference:
                  transactionReference.trim(),

                adminNote:
                  adminNote.trim(),
              }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to mark payment as paid."
        );
      }

      setSuccessMessage(
        result.message
      );

      setMarkPaidRequest(
        null
      );

      await loadPayments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to mark payment as paid."
      );
    } finally {
      setProcessingId(
        null
      );
    }
  }

  if (loading) {
    return (
      <div className="col-12 text-center py-5">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <>
      {/* HEADER */}

      <div className="col-12">

        <h3 className="fw-bold mb-1">
          Payment Requests
        </h3>

        <p className="text-muted mb-0">
          Review Tester payment requests and
          record payments made manually via UPI
          or bank transfer.
        </p>

      </div>

      {/* FILTERS */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body d-flex flex-wrap gap-2">

            {(
              [
                "ALL",
                "PENDING",
                "APPROVED",
                "PAID",
                "REJECTED",
              ] as Filter[]
            ).map(
              (filter) => (

                <button
                  key={
                    filter
                  }
                  type="button"
                  className={`btn btn-sm ${
                    activeFilter ===
                    filter
                      ? "btn-primary"
                      : "btn-outline-secondary"
                  }`}
                  onClick={() =>
                    setActiveFilter(
                      filter
                    )
                  }
                >
                  {filter}

                  <span className="badge bg-light text-dark ms-2">
                    {
                      counts[
                        filter
                      ]
                    }
                  </span>

                </button>

              )
            )}

          </div>

        </div>

      </div>

      {successMessage && (
        <div className="col-12">
          <div className="alert alert-success">
            {successMessage}
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

      {filtered.length ===
        0 && (
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body py-5 text-center">
              No payment requests found.
            </div>
          </div>
        </div>
      )}

      {filtered.map(
        (item) => (

          <div
            key={
              item.id
            }
            className="col-xl-6"
          >

            <div className="card border-0 shadow-sm h-100">

              <div className="card-body p-4">

                <div className="d-flex justify-content-between gap-3">

                  <div>

                    <div className="text-primary small fw-bold">
                      {
                        item.campaign
                          .brandName ??
                        "Brand"
                      }
                    </div>

                    <h5 className="fw-bold mb-1">
                      {
                        item.campaign
                          .productName
                      }
                    </h5>

                    <div className="text-muted small">
                      Tester:{" "}
                      <strong>
                        {
                          item.tester
                            .fullName
                        }
                      </strong>
                    </div>

                  </div>

                  <StatusBadge
                    status={
                      item.status
                    }
                  />

                </div>

                <hr />

                <div className="d-flex justify-content-between mb-3">

                  <span className="text-muted">
                    Amount
                  </span>

                  <strong className="fs-5">
                    ₹
                    {Number(
                      item.amount
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </strong>

                </div>

                <PaymentDestination
                  item={
                    item
                  }
                />

                <div className="small text-muted mt-3">
                  Requested:{" "}
                  {formatDateTime(
                    item.requestedAt
                  )}
                </div>

                {item.status ===
                  "PENDING" && (

                  <div className="d-flex gap-2 mt-4">

                    <button
                      type="button"
                      className="btn btn-success flex-grow-1"
                      disabled={
                        processingId ===
                        item.id
                      }
                      onClick={() =>
                        handleApprove(
                          item
                        )
                      }
                    >
                      Approve
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-danger flex-grow-1"
                      disabled={
                        processingId ===
                        item.id
                      }
                      onClick={() => {
                        setRejectionRequest(
                          item
                        );

                        setRejectionReason(
                          ""
                        );
                      }}
                    >
                      Reject
                    </button>

                  </div>

                )}

                {item.status ===
                  "APPROVED" && (

                  <div className="mt-4">

                    <div className="alert alert-info small">
                      Pay the Tester manually outside
                      Revtail, then record the reference
                      below.
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary w-100"
                      onClick={() =>
                        openMarkPaid(
                          item
                        )
                      }
                    >
                      Mark Paid
                    </button>
                    <Link
                      href={`/admin/approvals/payments/${item.id}`}
                      className="btn btn-outline-secondary w-100 mt-2">
                      <i className="bi bi-clock-history me-2"></i>
                      View Details & History
                    </Link>

                  </div>

                )}

                {item.status ===
                  "REJECTED" &&
                  item.rejectionReason && (

                  <div className="alert alert-danger mt-3 mb-0">

                    <strong>
                      Rejection:
                    </strong>{" "}

                    {
                      item.rejectionReason
                    }

                  </div>

                )}

                {item.status ===
                  "PAID" && (

                  <div className="border rounded p-3 bg-light mt-3">

                    <strong className="text-success">
                      Payment recorded
                    </strong>

                    <div className="small mt-2">

                      Method:{" "}
                      {formatMethod(
                        item.paidMethod
                      )}

                    </div>

                    <div className="small">

                      Reference:{" "}

                      {
                        item.transactionReference ??
                        "-"
                      }

                    </div>

                    <div className="small">

                      Paid:{" "}

                      {formatDateTime(
                        item.paidAt
                      )}

                    </div>

                  </div>

                )}

              </div>

            </div>

          </div>

        )
      )}

      {/* REJECT MODAL */}

      {rejectionRequest && (

        <ModalOverlay>

          <h5 className="fw-bold">
            Reject Payment Request
          </h5>

          <p className="text-muted small">
            {
              rejectionRequest
                .tester
                .fullName
            }{" "}
            — ₹
            {Number(
              rejectionRequest.amount
            ).toLocaleString(
              "en-IN"
            )}
          </p>

          <textarea
            className="form-control"
            rows={4}
            value={
              rejectionReason
            }
            onChange={(event) =>
              setRejectionReason(
                event.target.value
              )
            }
            placeholder="Enter rejection reason..."
          />

          <div className="d-flex justify-content-end gap-2 mt-4">

            <button
              className="btn btn-light"
              onClick={() =>
                setRejectionRequest(
                  null
                )
              }
            >
              Cancel
            </button>

            <button
              className="btn btn-danger"
              onClick={
                handleReject
              }
            >
              Reject
            </button>

          </div>

        </ModalOverlay>

      )}

      {/* MARK PAID MODAL */}

      {markPaidRequest && (

        <ModalOverlay>

          <h5 className="fw-bold">
            Record Manual Payment
          </h5>

          <p className="text-muted small">
            Confirm only after payment has
            actually been made outside Revtail.
          </p>

          <div className="mb-3">

            <label className="form-label">
              Paid Method
            </label>

            <select
              className="form-select"
              value={
                paidMethod
              }
              onChange={(event) =>
                setPaidMethod(
                  event.target
                    .value as PaymentMethod
                )
              }
            >
              <option value="UPI">
                UPI
              </option>

              <option value="BANK_TRANSFER">
                Bank Transfer
              </option>
            </select>

          </div>

          <div className="mb-3">

            <label className="form-label">
              Paid Amount
            </label>

            <input
              type="number"
              className="form-control"
              step="0.01"
              value={
                paidAmount
              }
              readOnly
            />

          </div>

          <div className="mb-3">

            <label className="form-label">
              Transaction / Reference ID
            </label>

            <input
              type="text"
              className="form-control"
              value={
                transactionReference
              }
              onChange={(event) =>
                setTransactionReference(
                  event.target.value
                )
              }
            />

          </div>

          <div>

            <label className="form-label">
              Admin Note
            </label>

            <textarea
              className="form-control"
              rows={3}
              value={
                adminNote
              }
              onChange={(event) =>
                setAdminNote(
                  event.target.value
                )
              }
            />

          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">

            <button
              className="btn btn-light"
              onClick={() =>
                setMarkPaidRequest(
                  null
                )
              }
            >
              Cancel
            </button>

            <button
              className="btn btn-success"
              onClick={
                handleMarkPaid
              }
            >
              Mark Paid
            </button>

          </div>

        </ModalOverlay>

      )}
    </>
  );
}

// ============================================================
// DESTINATION
// ============================================================

function PaymentDestination({
  item,
}: {
  item:
    PaymentRequestItem;
}) {
  const bank =
    item.tester
      .bankDetails;

  if (!bank) {
    return (
      <div className="alert alert-warning">
        Tester payment details are missing.
      </div>
    );
  }

  if (
    item.preferredPaymentMethod ===
    "UPI"
  ) {
    return (
      <div className="border rounded p-3">

        <small className="text-muted d-block">
          Preferred Method
        </small>

        <strong>
          UPI
        </strong>

        <div className="mt-2">
          UPI ID:{" "}
          <strong>
            {
              bank.upiId ??
              "-"
            }
          </strong>
        </div>

      </div>
    );
  }

  return (
    <div className="border rounded p-3">

      <small className="text-muted d-block mb-2">
        Bank Transfer
      </small>

      <div>
        Holder:{" "}
        <strong>
          {
            bank.accountHolderName
          }
        </strong>
      </div>

      <div>
        Bank:{" "}
        <strong>
          {
            bank.bankName
          }
        </strong>
      </div>

      <div>
        Account:{" "}
        <strong>
          ****
          {
            bank.accountNumberLast4 ??
            "----"
          }
        </strong>
      </div>

      <div>
        IFSC:{" "}
        <strong>
          {
            bank.ifscCode
          }
        </strong>
      </div>

    </div>
  );
}

// ============================================================
// STATUS
// ============================================================

function StatusBadge({
  status,
}: {
  status: PaymentStatus;
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
      className={`badge ${className}`}
    >
      {status}
    </span>
  );
}

// ============================================================
// MODAL
// ============================================================

function ModalOverlay({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{
        zIndex:
          2000,

        background:
          "rgba(0,0,0,.55)",

        padding:
          "20px",
      }}
    >
      <div
        className="card border-0 shadow-lg w-100"
        style={{
          maxWidth:
            "520px",
        }}
      >
        <div className="card-body p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

function formatMethod(
  value:
    | string
    | null
) {
  if (!value) {
    return "-";
  }

  return value ===
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