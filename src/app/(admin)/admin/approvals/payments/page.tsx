"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

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

type Filter =
  | "ALL"
  | PaymentStatus;

type PaymentRequestItem = {
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

        role: string;
      }
    | null;

  payer:
    | {
        id: number;

        name:
          | string
          | null;

        role: string;
      }
    | null;
};

type Pagination = {
  page: number;

  limit: number;

  total: number;

  totalPages: number;

  hasNextPage:
    boolean;

  hasPreviousPage:
    boolean;
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

    pagination:
      Pagination;
  };
};

// ============================================================
// PAGE
// ============================================================

export default function AdminPaymentsPage() {
  const router =
    useRouter();

  const [
    requests,
    setRequests,
  ] =
    useState<
      PaymentRequestItem[]
    >([]);

  // ==========================================================
  // SUMMARY
  // ==========================================================

  const [
    counts,
    setCounts,
  ] =
    useState({
      ALL: 0,

      PENDING: 0,

      APPROVED: 0,

      PAID: 0,

      REJECTED: 0,
    });

  // ==========================================================
  // FILTER
  //
  // IMPORTANT:
  // ALL is now the default.
  // ==========================================================

  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState<Filter>(
      "ALL"
    );

  // ==========================================================
  // SEARCH
  // ==========================================================

  const [
    searchInput,
    setSearchInput,
  ] =
    useState("");

  const [
    search,
    setSearch,
  ] =
    useState("");

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const [
    page,
    setPage,
  ] =
    useState(1);

  const [
    limit,
    setLimit,
  ] =
    useState(10);

  const [
    pagination,
    setPagination,
  ] =
    useState<Pagination>({
      page: 1,

      limit: 10,

      total: 0,

      totalPages: 1,

      hasNextPage:
        false,

      hasPreviousPage:
        false,
    });

  // ==========================================================
  // GENERAL
  // ==========================================================

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
    processingId,
    setProcessingId,
  ] =
    useState<
      number | null
    >(null);

  const [
    exporting,
    setExporting,
  ] =
    useState(false);

  // ==========================================================
  // REJECTION
  // ==========================================================

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

  // ==========================================================
  // MARK PAID
  // ==========================================================

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

  // ==========================================================
  // LOAD PAYMENTS
  // ==========================================================

  const loadPayments =
    useCallback(
      async () => {
        try {
          setLoading(true);

          setError("");

          const query =
            new URLSearchParams();

          query.set(
            "page",
            String(page)
          );

          query.set(
            "limit",
            String(limit)
          );

          if (
            activeFilter !==
            "ALL"
          ) {
            query.set(
              "status",
              activeFilter
            );
          }

          if (search) {
            query.set(
              "search",
              search
            );
          }

          const response =
            await fetch(
              `/api/admin/payments?${query.toString()}`,
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

          setCounts({
            ALL:
              result.data
                ?.total ??
              0,

            PENDING:
              result.data
                ?.pending ??
              0,

            APPROVED:
              result.data
                ?.approved ??
              0,

            PAID:
              result.data
                ?.paid ??
              0,

            REJECTED:
              result.data
                ?.rejected ??
              0,
          });

          if (
            result.data
              ?.pagination
          ) {
            setPagination(
              result.data
                .pagination
            );
          }
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load payment requests."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        activeFilter,
        page,
        limit,
        search,
      ]
    );

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // ==========================================================
  // FILTER
  // ==========================================================

  function changeFilter(
    filter:
      Filter
  ) {
    setActiveFilter(
      filter
    );

    setPage(
      1
    );
  }

  // ==========================================================
  // SEARCH
  // ==========================================================

  function handleSearch(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setPage(1);

    setSearch(
      searchInput.trim()
    );
  }

  function clearSearch() {
    setSearchInput("");

    setSearch("");

    setPage(1);
  }

  // ==========================================================
  // REVIEW
  // ==========================================================

  async function reviewRequest(
    requestId:
      number,

    action:
      | "APPROVE"
      | "REJECT",

    reason?:
      string
  ) {
    try {
      setProcessingId(
        requestId
      );

      setError("");

      setSuccessMessage(
        ""
      );

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

  // ==========================================================
  // APPROVE
  // ==========================================================

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

  // ==========================================================
  // REJECT
  // ==========================================================

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

  // ==========================================================
  // OPEN MARK PAID
  // ==========================================================

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

  // ==========================================================
  // MARK PAID
  // ==========================================================

  async function handleMarkPaid() {
    if (
      !markPaidRequest
    ) {
      return;
    }

    if (!paidMethod) {
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

      setSuccessMessage(
        ""
      );

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

  // ==========================================================
  // EXPORT EXCEL
  // ==========================================================

  async function exportToExcel() {
    try {
      setExporting(true);

      setError("");

      const query =
        new URLSearchParams();

      query.set(
        "export",
        "1"
      );

      if (
        activeFilter !==
        "ALL"
      ) {
        query.set(
          "status",
          activeFilter
        );
      }

      if (search) {
        query.set(
          "search",
          search
        );
      }

      const response =
        await fetch(
          `/api/admin/payments?${query.toString()}`,
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
            "Unable to export payment requests."
        );
      }

      const rows =
        result.data
          ?.requests ??
        [];

      if (
        rows.length === 0
      ) {
        setError(
          "There are no payment records to export."
        );

        return;
      }

      // Dynamic import keeps XLSX out of initial page load.
      const XLSX =
        await import(
          "xlsx"
        );

      const excelRows =
        rows.map(
          (
            item
          ) => ({
            "Payment ID":
              item.id,

            Tester:
              item.tester
                .fullName,

            Brand:
              item.campaign
                .brandName ??
              "",

            Campaign:
              item.campaign
                .productName,

            Amount:
              Number(
                item.amount
              ),

            "Preferred Method":
              formatMethod(
                item.preferredPaymentMethod
              ),

            Status:
              item.status,

            Requested:
              formatDateTime(
                item.requestedAt
              ),

            "Reviewed By":
              item.reviewer
                ?.name ??
              "",

            "Paid Amount":
              item.paidAmount
                ? Number(
                    item.paidAmount
                  )
                : "",

            "Paid Method":
              formatMethod(
                item.paidMethod
              ),

            "Transaction Reference":
              item.transactionReference ??
              "",

            "Paid By":
              item.payer
                ?.name ??
              "",

            "Paid Date":
              formatDateTime(
                item.paidAt
              ),

            "Rejection Reason":
              item.rejectionReason ??
              "",

            "Admin Note":
              item.adminNote ??
              "",
          })
        );

      const worksheet =
        XLSX.utils.json_to_sheet(
          excelRows
        );

      const workbook =
        XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Payments"
      );

      const today =
        new Date()
          .toISOString()
          .slice(
            0,
            10
          );

      XLSX.writeFile(
        workbook,
        `revtail-payments-${today}.xlsx`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to export Excel file."
      );
    } finally {
      setExporting(
        false
      );
    }
  }

  // ==========================================================
  // OPEN DETAILS
  // ==========================================================

  function openDetails(
    id:
      number
  ) {
    router.push(
      `/admin/approvals/payments/${id}`
    );
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <>
      {/* HEADER */}

      <div className="col-12">

        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">

          <div>

            <h3 className="fw-bold mb-1">
              Payment Requests
            </h3>

            <p className="text-muted mb-0">
              Review Tester payment requests,
              track payments and export reports.
            </p>

          </div>

          <button
            type="button"
            className="btn btn-success"
            disabled={
              exporting
            }
            onClick={
              exportToExcel
            }
          >

            {exporting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />

                Exporting...
              </>
            ) : (
              <>
                <i className="bi bi-file-earmark-excel me-2" />

                Export Excel
              </>
            )}

          </button>

        </div>

      </div>

      {/* ======================================================
          STATUS FILTERS
      ====================================================== */}

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
              (
                filter
              ) => (

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
                    changeFilter(
                      filter
                    )
                  }
                >

                  {filter ===
                  "ALL"
                    ? "All"
                    : formatStatus(
                        filter
                      )}

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

      {/* ======================================================
          SEARCH + PAGE SIZE
      ====================================================== */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body">

            <div className="row g-3">

              <div className="col-lg-8">

                <form
                  onSubmit={
                    handleSearch
                  }
                >

                  <div className="input-group">

                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search Tester, Brand, Campaign or Transaction ID..."
                      value={
                        searchInput
                      }
                      onChange={(event) =>
                        setSearchInput(
                          event.target
                            .value
                        )
                      }
                    />

                    {searchInput && (

                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={
                          clearSearch
                        }
                      >

                        <i className="bi bi-x-lg" />

                      </button>

                    )}

                    <button
                      type="submit"
                      className="btn btn-primary"
                    >

                      <i className="bi bi-search me-1" />

                      Search

                    </button>

                  </div>

                </form>

              </div>

              <div className="col-lg-4">

                <select
                  className="form-select"
                  value={
                    limit
                  }
                  onChange={(event) => {
                    setLimit(
                      Number(
                        event.target
                          .value
                      )
                    );

                    setPage(
                      1
                    );
                  }}
                >

                  <option value="10">
                    10 per page
                  </option>

                  <option value="20">
                    20 per page
                  </option>

                  <option value="50">
                    50 per page
                  </option>

                </select>

              </div>

            </div>

          </div>

        </div>

      </div>

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

            {
              error
            }

          </div>

        </div>

      )}

      {/* ======================================================
          PAYMENT TABLE
      ====================================================== */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body">

            {loading ? (

              <div className="text-center py-5">

                <div className="spinner-border text-primary" />

                <div className="text-muted mt-3">
                  Loading payments...
                </div>

              </div>

            ) : requests.length ===
              0 ? (

              <div className="text-center py-5">

                <i className="bi bi-wallet2 fs-1 text-muted" />

                <h6 className="mt-3">
                  No payment requests found
                </h6>

              </div>

            ) : (

              <>
                <div className="table-responsive">

                  <table className="table table-hover align-middle">

                    <thead>

                      <tr>

                        <th>
                          ID
                        </th>

                        <th>
                          Tester
                        </th>

                        <th>
                          Campaign
                        </th>

                        <th>
                          Brand
                        </th>

                        <th>
                          Amount
                        </th>

                        <th>
                          Method
                        </th>

                        <th>
                          Requested
                        </th>

                        <th>
                          Status
                        </th>

                        <th className="text-end">
                          Action
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {requests.map(
                        (
                          item
                        ) => (

                          <tr
                            key={
                              item.id
                            }
                            style={{
                              cursor:
                                "pointer",
                            }}
                            onClick={() =>
                              openDetails(
                                item.id
                              )
                            }
                          >

                            <td>

                              <span className="fw-semibold text-primary">

                                #
                                {
                                  item.id
                                }

                              </span>

                            </td>

                            <td>

                              <strong>

                                {
                                  item.tester
                                    .fullName
                                }

                              </strong>

                            </td>

                            <td>

                              {
                                item.campaign
                                  .productName
                              }

                            </td>

                            <td>

                              {item.campaign
                                .brandName ??
                                "-"}

                            </td>

                            <td>

                              <strong>

                                ₹
                                {Number(
                                  item.amount
                                ).toLocaleString(
                                  "en-IN"
                                )}

                              </strong>

                            </td>

                            <td>

                              {formatMethod(
                                item.preferredPaymentMethod
                              )}

                            </td>

                            <td>

                              {formatDateTime(
                                item.requestedAt
                              )}

                            </td>

                            <td>

                              <StatusBadge
                                status={
                                  item.status
                                }
                              />

                            </td>

                            <td
                              className="text-end"
                              onClick={(
                                event
                              ) =>
                                event.stopPropagation()
                              }
                            >

                              <div className="d-flex justify-content-end gap-1">

                                {/* VIEW */}

                                <button
                                  type="button"
                                  className="btn btn-outline-primary btn-sm"
                                  title="View Details"
                                  onClick={() =>
                                    openDetails(
                                      item.id
                                    )
                                  }
                                >

                                  <i className="bi bi-eye" />

                                </button>

                                {/* PENDING ACTIONS */}

                                {item.status ===
                                  "PENDING" && (
                                  <>
                                    <button
                                      type="button"
                                      className="btn btn-success btn-sm"
                                      disabled={
                                        processingId ===
                                        item.id
                                      }
                                      title="Approve"
                                      onClick={() =>
                                        handleApprove(
                                          item
                                        )
                                      }
                                    >

                                      <i className="bi bi-check-lg" />

                                    </button>

                                    <button
                                      type="button"
                                      className="btn btn-outline-danger btn-sm"
                                      disabled={
                                        processingId ===
                                        item.id
                                      }
                                      title="Reject"
                                      onClick={() => {
                                        setRejectionRequest(
                                          item
                                        );

                                        setRejectionReason(
                                          ""
                                        );
                                      }}
                                    >

                                      <i className="bi bi-x-lg" />

                                    </button>
                                  </>
                                )}

                                {/* APPROVED */}

                                {item.status ===
                                  "APPROVED" && (

                                  <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    title="Mark Paid"
                                    onClick={() =>
                                      openMarkPaid(
                                        item
                                      )
                                    }
                                  >

                                    <i className="bi bi-cash-coin me-1" />

                                    Mark Paid

                                  </button>

                                )}

                              </div>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

                {/* ============================================
                    PAGINATION
                ============================================ */}

                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mt-4">

                  <div className="small text-muted">

                    Page{" "}

                    <strong>
                      {
                        pagination.page
                      }
                    </strong>

                    {" "}of{" "}

                    <strong>
                      {
                        pagination.totalPages
                      }
                    </strong>

                    {" · "}

                    {
                      pagination.total
                    }{" "}
                    record
                    {pagination.total !==
                    1
                      ? "s"
                      : ""}

                  </div>

                  <div className="btn-group">

                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      disabled={
                        !pagination.hasPreviousPage ||
                        loading
                      }
                      onClick={() =>
                        setPage(
                          (
                            current
                          ) =>
                            Math.max(
                              1,
                              current -
                                1
                            )
                        )
                      }
                    >

                      <i className="bi bi-chevron-left me-1" />

                      Previous

                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      disabled={
                        !pagination.hasNextPage ||
                        loading
                      }
                      onClick={() =>
                        setPage(
                          (
                            current
                          ) =>
                            current +
                            1
                        )
                      }
                    >

                      Next

                      <i className="bi bi-chevron-right ms-1" />

                    </button>

                  </div>

                </div>

              </>

            )}

          </div>

        </div>

      </div>

      {/* ======================================================
          REJECT MODAL
      ====================================================== */}

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
              type="button"
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
              type="button"
              className="btn btn-danger"
              disabled={
                processingId ===
                rejectionRequest.id
              }
              onClick={
                handleReject
              }
            >
              Reject
            </button>

          </div>

        </ModalOverlay>

      )}

      {/* ======================================================
          MARK PAID MODAL
      ====================================================== */}

      {markPaidRequest && (

        <ModalOverlay>

          <h5 className="fw-bold">
            Record Manual Payment
          </h5>

          <p className="text-muted small">

            Confirm only after payment has actually been made outside Revtail.

          </p>

          <div className="mb-3">

            <label className="form-label">
              Tester
            </label>

            <input
              type="text"
              className="form-control"
              value={
                markPaidRequest
                  .tester
                  .fullName
              }
              readOnly
            />

          </div>

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
              type="button"
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
              type="button"
              className="btn btn-success"
              disabled={
                processingId ===
                markPaidRequest.id
              }
              onClick={
                handleMarkPaid
              }
            >

              {processingId ===
              markPaidRequest.id
                ? "Processing..."
                : "Mark Paid"}

            </button>

          </div>

        </ModalOverlay>

      )}
    </>
  );
}

// ============================================================
// STATUS BADGE
// ============================================================

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
      className={`badge ${className}`}
    >
      {formatStatus(
        status
      )}
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
        zIndex: 2000,

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

function formatStatus(
  value:
    string
) {
  switch (value) {
    case "PENDING":
      return "Pending";

    case "APPROVED":
      return "Approved";

    case "REJECTED":
      return "Rejected";

    case "PAID":
      return "Paid";

    default:
      return value;
  }
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