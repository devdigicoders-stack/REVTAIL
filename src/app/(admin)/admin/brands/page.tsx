"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

// ============================================================
// TYPES
// ============================================================

type BrandStatus =
  | "PENDING"
  | "ACTIVE"
  | "REJECTED"
  | "SUSPENDED"
  | "INACTIVE";

type Brand = {
  id: number;

  userId: number;

  companyName: string;

  companyType: string;

  category: string;

  website: string | null;

  pocFullName: string | null;

  pocMobile: string | null;

  designation: string | null;

  approvalStatus: BrandStatus;

  rejectionReason: string | null;

  user: {
    email: string | null;

    mobile: string | null;

    status: string;
  };

  _count: {
    campaigns: number;
  };
};

type Summary = {
  total: number;

  pending: number;

  active: number;

  rejected: number;
};

type Pagination = {
  page: number;

  limit: number;

  total: number;

  totalPages: number;

  hasNextPage: boolean;

  hasPreviousPage: boolean;
};

// ============================================================
// PAGE
// ============================================================

export default function AdminBrandsPage() {
  const [
    brands,
    setBrands,
  ] = useState<Brand[]>([]);

  const [
    summary,
    setSummary,
  ] = useState<Summary>({
    total: 0,

    pending: 0,

    active: 0,

    rejected: 0,
  });

  const [
    pagination,
    setPagination,
  ] = useState<Pagination>({
    page: 1,

    limit: 10,

    total: 0,

    totalPages: 1,

    hasNextPage: false,

    hasPreviousPage: false,
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  // ==========================================================
  // IMPORTANT CHANGE
  //
  // Default = ALL
  //
  // Therefore first page load shows every Brand.
  // ==========================================================

  const [
    status,
    setStatus,
  ] =
    useState<
      "ALL" | BrandStatus
    >("ALL");

  const [
    page,
    setPage,
  ] = useState(1);

  // ==========================================================
  // LOAD BRANDS
  // ==========================================================

  const loadBrands =
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
            "10"
          );

          // ==================================================
          // SEARCH
          // ==================================================

          if (search) {
            query.set(
              "search",
              search
            );
          }

          // ==================================================
          // STATUS
          //
          // IMPORTANT:
          // When ALL is selected, status is NOT sent.
          //
          // API therefore returns all Brands.
          // ==================================================

          if (
            status !== "ALL"
          ) {
            query.set(
              "status",
              status
            );
          }

          const response =
            await fetch(
              `/api/admin/brands?${query.toString()}`,
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

          if (!response.ok) {
            throw new Error(
              result.message ||
                "Unable to load Brands."
            );
          }

          setBrands(
            result.data ?? []
          );

          setSummary(
            result.summary ?? {
              total: 0,

              pending: 0,

              active: 0,

              rejected: 0,
            }
          );

          setPagination(
            result.pagination ?? {
              page: 1,

              limit: 10,

              total: 0,

              totalPages: 1,

              hasNextPage:
                false,

              hasPreviousPage:
                false,
            }
          );
        } catch (err) {
          console.error(
            "LOAD BRANDS ERROR:",
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load Brands."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        page,
        search,
        status,
      ]
    );

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  // ==========================================================
  // SEARCH
  // ==========================================================

  const handleSearch =
    (
      event:
        React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      setPage(1);

      setSearch(
        searchInput.trim()
      );
    };

  // ==========================================================
  // CLEAR SEARCH
  // ==========================================================

  const handleClearSearch =
    () => {
      setSearchInput("");

      setSearch("");

      setPage(1);
    };

  // ==========================================================
  // SUMMARY CARD FILTER
  // ==========================================================

  const applyStatusFilter =
    (
      newStatus:
        | "ALL"
        | BrandStatus
    ) => {
      setStatus(
        newStatus
      );

      setPage(1);
    };

  // ==========================================================
  // STATUS BADGE
  // ==========================================================

  const statusClass =
    (
      value:
        BrandStatus
    ) => {
      switch (value) {
        case "ACTIVE":
          return "bg-success-subtle text-success";

        case "REJECTED":
          return "bg-danger-subtle text-danger";

        case "SUSPENDED":
          return "bg-dark-subtle text-dark";

        case "INACTIVE":
          return "bg-secondary-subtle text-secondary";

        default:
          return "bg-warning-subtle text-warning-emphasis";
      }
    };

  // ==========================================================
  // STATUS DISPLAY TEXT
  // ==========================================================

  const statusLabel =
    (
      value:
        BrandStatus
    ) => {
      switch (value) {
        case "PENDING":
          return "New Request";

        case "ACTIVE":
          return "Approved";

        case "REJECTED":
          return "Rejected";

        case "SUSPENDED":
          return "Suspended";

        case "INACTIVE":
          return "Inactive";

        default:
          return value;
      }
    };

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <>
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="col-12">

        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">

          <div>

            <h4 className="fw-bold mb-1">
              Brand Management
            </h4>

            <p className="text-muted mb-0">
              View all Brands and review new Brand registrations.
            </p>

          </div>

          {summary.pending >
            0 && (

            <button
              type="button"
              className="btn btn-warning fw-semibold"
              onClick={() =>
                applyStatusFilter(
                  "PENDING"
                )
              }
            >

              <i className="bi bi-building-add me-2" />

              {summary.pending} New Request
              {summary.pending !==
              1
                ? "s"
                : ""}

            </button>

          )}

        </div>

      </div>

      {/* ======================================================
          SUMMARY CARDS
      ====================================================== */}

      <div className="col-md-6 col-xl-3">

        <SummaryCard
          title="Total Brands"
          value={
            summary.total
          }
          icon="bi-buildings"
          active={
            status === "ALL"
          }
          onClick={() =>
            applyStatusFilter(
              "ALL"
            )
          }
        />

      </div>

      <div className="col-md-6 col-xl-3">

        <SummaryCard
          title="New Requests"
          value={
            summary.pending
          }
          valueClass="text-warning"
          icon="bi-building-add"
          active={
            status ===
            "PENDING"
          }
          onClick={() =>
            applyStatusFilter(
              "PENDING"
            )
          }
        />

      </div>

      <div className="col-md-6 col-xl-3">

        <SummaryCard
          title="Approved"
          value={
            summary.active
          }
          valueClass="text-success"
          icon="bi-check-circle"
          active={
            status ===
            "ACTIVE"
          }
          onClick={() =>
            applyStatusFilter(
              "ACTIVE"
            )
          }
        />

      </div>

      <div className="col-md-6 col-xl-3">

        <SummaryCard
          title="Rejected"
          value={
            summary.rejected
          }
          valueClass="text-danger"
          icon="bi-x-circle"
          active={
            status ===
            "REJECTED"
          }
          onClick={() =>
            applyStatusFilter(
              "REJECTED"
            )
          }
        />

      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (

        <div className="col-12">

          <div className="alert alert-danger">

            <i className="bi bi-exclamation-triangle me-2" />

            {error}

          </div>

        </div>

      )}

      {/* ======================================================
          LIST
      ====================================================== */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          {/* ==================================================
              SEARCH + FILTER
          ================================================== */}

          <div className="card-header bg-white border-0 pt-4 px-4">

            <div className="d-flex flex-column flex-xl-row justify-content-between gap-3">

              <form
                onSubmit={
                  handleSearch
                }
                className="flex-grow-1"
              >

                <div className="input-group">

                  <input
                    type="search"
                    className="form-control"
                    placeholder="Search company, category, contact person or email..."
                    value={
                      searchInput
                    }
                    onChange={(e) =>
                      setSearchInput(
                        e.target.value
                      )
                    }
                  />

                  {searchInput && (

                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={
                        handleClearSearch
                      }
                      title="Clear search"
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

              <div
                style={{
                  minWidth:
                    "220px",
                }}
              >

                <select
                  className="form-select"
                  value={
                    status
                  }
                  onChange={(e) =>
                    applyStatusFilter(
                      e.target
                        .value as
                        | "ALL"
                        | BrandStatus
                    )
                  }
                >

                  <option value="ALL">
                    All Brands
                  </option>

                  <option value="PENDING">
                    New Requests
                  </option>

                  <option value="ACTIVE">
                    Approved
                  </option>

                  <option value="REJECTED">
                    Rejected
                  </option>

                  <option value="SUSPENDED">
                    Suspended
                  </option>

                  <option value="INACTIVE">
                    Inactive
                  </option>

                </select>

              </div>

            </div>

            {/* ================================================
                ACTIVE FILTER DESCRIPTION
            ================================================ */}

            <div className="mt-3">

              {status ===
              "ALL" ? (

                <span className="text-muted small">

                  Showing all Brands

                </span>

              ) : (

                <span className="text-muted small">

                  Showing:{" "}

                  <strong>

                    {status ===
                    "PENDING"
                      ? "New Requests"
                      : status ===
                        "ACTIVE"
                      ? "Approved Brands"
                      : status ===
                        "REJECTED"
                      ? "Rejected Brands"
                      : status}

                  </strong>

                </span>

              )}

              {search && (

                <span className="text-muted small ms-3">

                  Search:{" "}

                  <strong>
                    {search}
                  </strong>

                </span>

              )}

            </div>

          </div>

          {/* ==================================================
              BODY
          ================================================== */}

          <div className="card-body px-4">

            {loading ? (

              <div className="text-center py-5">

                <div
                  className="spinner-border text-primary"
                  role="status"
                />

                <p className="text-muted mt-3 mb-0">

                  Loading Brands...

                </p>

              </div>

            ) : brands.length ===
              0 ? (

              <div className="text-center py-5">

                <i className="bi bi-building fs-1 text-muted" />

                <h6 className="mt-3">

                  No Brands found

                </h6>

                <p className="text-muted">

                  {status ===
                  "ALL"
                    ? "No Brand accounts are available."
                    : "No Brands match the selected status."}

                </p>

                {status !==
                  "ALL" && (

                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() =>
                      applyStatusFilter(
                        "ALL"
                      )
                    }
                  >

                    Show All Brands

                  </button>

                )}

              </div>

            ) : (

              <>
                {/* ==============================================
                    TABLE
                ============================================== */}

                <div className="table-responsive">

                  <table className="table table-hover align-middle">

                    <thead>

                      <tr>

                        <th>
                          Company
                        </th>

                        <th>
                          Contact Person
                        </th>

                        <th>
                          Contact
                        </th>

                        <th>
                          Category
                        </th>

                        {/* <th className="text-center">
                          Campaigns
                        </th> */}

                        <th>
                          Status
                        </th>

                        {/* <th className="text-end">
                          Action
                        </th> */}

                      </tr>

                    </thead>

                    <tbody>

                      {brands.map(
                        (
                          brand
                        ) => (

                          <tr
                            key={
                              brand.id
                            }
                          >

                            {/* COMPANY */}

                            <td>
                              <Link href={`/admin/brands/${brand.id}`}>
                              <div className="fw-semibold">

                                {
                                  brand.companyName
                                }

                              </div>

                              <small className="text-muted">

                                {
                                  brand.companyType
                                }

                              </small>
                              </Link>
                            </td>

                            {/* CONTACT PERSON */}

                            <td>

                              <div>

                                {brand.pocFullName ??
                                  "-"}

                              </div>

                              <small className="text-muted">

                                {brand.designation ??
                                  "-"}

                              </small>

                            </td>

                            {/* CONTACT */}

                            <td>

                              <div>

                                {brand.user.email ??
                                  "-"}

                              </div>

                              <small className="text-muted">

                                {brand.pocMobile ??
                                  brand.user.mobile ??
                                  "-"}

                              </small>

                            </td>

                            {/* CATEGORY */}

                            <td>

                              {
                                brand.category
                              }

                            </td>

                            {/* CAMPAIGN COUNT */}
{/* 
                            <td className="text-center">

                              <span className="badge bg-light text-dark border">

                                {
                                  brand._count.campaigns
                                }

                              </span>

                            </td> */}

                            {/* STATUS */}

                            <td>

                              <span
                                className={`badge ${statusClass(
                                  brand.approvalStatus
                                )}`}
                              >

                                {statusLabel(
                                  brand.approvalStatus
                                )}

                              </span>

                            </td>

                            {/* ACTION */}

                            {/* <td className="text-end">

                              <Link
                                href={`/admin/brands/${brand.id}`}
                                className="btn btn-primary btn-sm"
                              >

                                <i className="bi bi-eye me-1" />

                                View

                              </Link>

                            </td> */}

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

                {/* ==============================================
                    PAGINATION
                ============================================== */}

                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mt-4">

                  <div className="text-muted small">

                    Showing page{" "}

                    <strong>
                      {pagination.page}
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
                    Brand
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
                        !pagination.hasPreviousPage
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
                        !pagination.hasNextPage
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
    </>
  );
}

// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  title,
  value,
  valueClass = "",
  icon,
  active,
  onClick,
}: {
  title: string;

  value: number;

  valueClass?: string;

  icon: string;

  active: boolean;

  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`card shadow-sm h-100 w-100 text-start ${
        active
          ? "border-primary"
          : "border-0"
      }`}
      onClick={
        onClick
      }
    >

      <div className="card-body">

        <div className="d-flex justify-content-between align-items-center">

          <div>

            <div className="text-muted small mb-1">

              {title}

            </div>

            <div
              className={`fs-3 fw-bold ${valueClass}`}
            >

              {value}

            </div>

          </div>

          <div className="fs-3 text-muted">

            <i
              className={`bi ${icon}`}
            />

          </div>

        </div>

      </div>

    </button>
  );
}