"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

// ============================================================
// TYPES
// ============================================================

type Campaign = {
  id: number;

  campaignCode: string;

  productName: string;

  productImage:
    | string
    | null;

  brandId: number;

  brandName: string;

  brandCompanyType: string;

  brandCategory:
    | string
    | {
        id: number;
        name: string;
      }
    | null;

  earning: number;

  earningAmount: number;

  currency: string;

  slots: number;

  totalSlots: number;

  filledSlots: number;

  availableSlots:
    | number
    | null;

  applicationCount: number;

  enrolledCount: number;

  targetState:
    | string
    | null;

  targetCity:
    | string
    | null;

  targetGender: string;

  task4Required: boolean;

  startDate:
    | string
    | null;

  endDate:
    | string
    | null;

  approvedAt:
    | string
    | null;

  createdAt: string;

  status: string;
};

type Pagination = {
  page: number;

  limit: number;

  total: number;

  totalPages: number;

  hasNextPage: boolean;

  hasPreviousPage: boolean;
};

type CampaignListApiResponse = {
  success: boolean;

  message?: string;

  role?: string;

  type?: string;

  status?: string | null;

  search?: string;

  count?: number;

  total?: number;

  data?: Campaign[];

  pagination?: Pagination | null;
};

// ============================================================
// PAGE
// ============================================================

export default function AdminCampaignHistoryPage() {
  const router =
    useRouter();

  const [
    campaigns,
    setCampaigns,
  ] =
    useState<Campaign[]>([]);

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
    pagination,
    setPagination,
  ] =
    useState<Pagination>({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });

  // ==========================================================
  // LOAD HISTORY CAMPAIGNS
  // ==========================================================

  const loadCampaigns =
    useCallback(
      async () => {
        try {
          setLoading(true);

          setError("");

          const query =
            new URLSearchParams();

          // ====================================================
          // HISTORY
          //
          // API currently treats history as:
          //
          // REJECTED
          // COMPLETED
          // CANCELLED
          // ====================================================

          query.set(
            "type",
            "history"
          );

          query.set(
            "page",
            String(page)
          );

          query.set(
            "limit",
            String(limit)
          );

          if (
            search.trim()
          ) {
            query.set(
              "search",
              search.trim()
            );
          }

          const response =
            await fetch(
              `/api/campaigns/list?${query.toString()}`,
              {
                method: "GET",

                credentials:
                  "include",

                cache:
                  "no-store",
              }
            );

          const result:
            CampaignListApiResponse =
            await response.json();

          if (
            !response.ok ||
            !result.success
          ) {
            throw new Error(
              result.message ||
                "Unable to load campaign history."
            );
          }

          setCampaigns(
            result.data ??
              []
          );

          if (
            result.pagination
          ) {
            setPagination(
              result.pagination
            );
          } else {
            setPagination({
              page: 1,

              limit,

              total:
                result.total ??
                result.data
                  ?.length ??
                0,

              totalPages: 1,

              hasNextPage:
                false,

              hasPreviousPage:
                false,
            });
          }
        } catch (err) {
          console.error(
            "ADMIN CAMPAIGN HISTORY ERROR:",
            err
          );

          setCampaigns([]);

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load campaign history."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        page,
        limit,
        search,
      ]
    );

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  // ==========================================================
  // SEARCH
  // ==========================================================

  const handleSearch = (
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

  const clearSearch =
    () => {
      setSearchInput("");

      setSearch("");

      setPage(1);
    };

  // ==========================================================
  // OPEN CAMPAIGN
  // ==========================================================

  const openCampaign = (
    campaignId: number
  ) => {
    router.push(
      `/admin/campaigns/${campaignId}`
    );
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <>
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="col-12">

        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">

          <div>

            <h3 className="fw-bold mb-1">
              Campaign History
            </h3>

            <p className="text-muted mb-0">
              View completed, rejected and cancelled campaigns.
            </p>

          </div>

          <div className="d-flex gap-2">

            <Link
              href="/admin/campaigns"
              className="btn btn-outline-primary"
            >

              <i className="bi bi-broadcast me-2" />

              Live Campaigns

            </Link>

            <Link
              href="/admin/campaigns/create"
              className="btn btn-primary"
            >

              <i className="bi bi-plus-circle me-2" />

              Create Campaign

            </Link>

          </div>

        </div>

      </div>

      {/* ======================================================
          SEARCH
      ====================================================== */}

      <div className="col-12">

        <div className="card border-0 shadow-sm mb-4">

          <div className="card-body">

            <div className="row g-3 align-items-center">

              <div className="col-lg-9">

                <form
                  onSubmit={
                    handleSearch
                  }
                >

                  <div className="input-group">

                    <span className="input-group-text bg-white">

                      <i className="bi bi-search" />

                    </span>

                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search by Campaign Code, Product, Brand, State or City..."
                      value={
                        searchInput
                      }
                      onChange={(
                        event
                      ) =>
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
                      Search
                    </button>

                  </div>

                </form>

              </div>

              {/* PAGE SIZE */}

              <div className="col-lg-3">

                <select
                  className="form-select"
                  value={
                    limit
                  }
                  onChange={(
                    event
                  ) => {
                    setLimit(
                      Number(
                        event.target
                          .value
                      )
                    );

                    setPage(1);
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

            {/* ACTIVE SEARCH */}

            {search && (

              <div className="mt-3">

                <span className="small text-muted me-2">
                  Search:
                </span>

                <span className="badge bg-light text-dark border">

                  {search}

                  <button
                    type="button"
                    className="btn btn-sm p-0 ms-2 border-0"
                    onClick={
                      clearSearch
                    }
                  >
                    ×
                  </button>

                </span>

              </div>

            )}

          </div>

        </div>

      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (

        <div className="col-12">

          <div className="alert alert-danger">

            <i className="bi bi-exclamation-triangle me-2" />

            {
              error
            }

          </div>

        </div>

      )}

      {/* ======================================================
          TABLE
      ====================================================== */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body">

            {loading ? (

              <div className="text-center py-5">

                <div
                  className="spinner-border text-primary"
                  role="status"
                />

                <div className="text-muted mt-3">
                  Loading campaign history...
                </div>

              </div>

            ) : campaigns.length ===
              0 ? (

              <div className="text-center py-5">

                <i className="bi bi-clock-history fs-1 text-muted" />

                <h6 className="mt-3 mb-1">
                  No campaign history found
                </h6>

                <p className="text-muted">

                  {search
                    ? "No historical campaign matches your search."
                    : "There are no completed, rejected or cancelled campaigns yet."}

                </p>

                {search && (

                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={
                      clearSearch
                    }
                  >
                    Clear Search
                  </button>

                )}

              </div>

            ) : (

              <>
                <div className="table-responsive">

                  <table className="table table-hover align-middle mb-0">

                    <thead className="table-light">

                      <tr>

                        <th>
                          Campaign
                        </th>

                        <th>
                          Brand
                        </th>

                        <th>
                          Earning
                        </th>

                        <th>
                          Slots
                        </th>

                        <th>
                          Applications
                        </th>

                        <th>
                          Target
                        </th>

                        <th>
                          Duration
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

                      {campaigns.map(
                        (
                          campaign
                        ) => (
                           
                          <tr
                            key={
                              campaign.id
                            }
                            style={{
                              cursor:
                                "pointer",
                            }}
                            onClick={() =>
                              openCampaign(
                                campaign.id
                              )
                            }
                          >

                            {/* CAMPAIGN */}

                            <td>
                              <Link href={`/admin/campaigns/${campaign.id}`}>
                              <div className="d-flex align-items-center gap-3">

                                <div
                                  className="bg-light border rounded overflow-hidden flex-shrink-0"
                                  style={{
                                    width:
                                      50,

                                    height:
                                      50,
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

                                    <div className="w-100 h-100 d-flex justify-content-center align-items-center">

                                      <i className="bi bi-image text-muted" />

                                    </div>

                                  )}

                                </div>

                                <div>

                                  <div className="fw-semibold">

                                    {
                                      campaign.productName
                                    }

                                  </div>

                                  <small className="text-muted">

                                    {
                                      campaign.campaignCode
                                    }

                                  </small>

                                </div>

                              </div>
                            </Link>
                            </td>

                            {/* BRAND */}

                            <td>

                              <div className="fw-semibold">

                                {
                                  campaign.brandName
                                }

                              </div>

                              <small className="text-muted">

                                {
                                  typeof campaign.brandCategory === "string"
                                    ? campaign.brandCategory || "-"
                                    : campaign.brandCategory?.name ?? "-"
                                }

                              </small>

                            </td>

                            {/* EARNING */}

                            <td>

                              <span className="fw-semibold">

                                ₹
                                {Number(
                                  campaign.earningAmount
                                ).toLocaleString(
                                  "en-IN"
                                )}

                              </span>

                            </td>

                            {/* SLOTS */}

                            <td>

                              <div>

                                <span className="fw-semibold">

                                  {
                                    campaign.filledSlots
                                  }

                                </span>

                                {" / "}

                                {
                                  campaign.totalSlots
                                }

                                {" filled"}

                              </div>

                              <small className="text-muted">

                                {
                                  campaign.availableSlots ??
                                  0
                                }

                                {" available"}

                              </small>

                            </td>

                            {/* APPLICATIONS */}

                            <td>

                              <div>

                                <strong>
                                  {
                                    campaign.applicationCount
                                  }
                                </strong>

                                {" applications"}

                              </div>

                              <small className="text-muted">

                                {
                                  campaign.enrolledCount
                                }

                                {" enrolled"}

                              </small>

                            </td>

                            {/* TARGET */}

                            <td>

                              <div>

                                {
                                  displayTarget(
                                    campaign.targetState
                                  )
                                }

                              </div>

                              <small className="text-muted">

                                {
                                  displayTarget(
                                    campaign.targetCity
                                  )
                                }

                              </small>

                            </td>

                            {/* DURATION */}

                            <td>

                              <div>

                                {
                                  formatDate(
                                    campaign.startDate
                                  )
                                }

                              </div>

                              <small className="text-muted">

                                to{" "}

                                {
                                  formatDate(
                                    campaign.endDate
                                  )
                                }

                              </small>

                            </td>

                            {/* STATUS */}

                            <td>

                              <CampaignStatusBadge
                                status={
                                  campaign.status
                                }
                              />

                            </td>

                            {/* ACTION */}

                            <td
                              className="text-end"
                              onClick={(
                                event
                              ) =>
                                event.stopPropagation()
                              }
                            >

                              {/* <Link
                                href={`/admin/campaigns/${campaign.id}`}
                                className="btn btn-sm btn-outline-primary"
                              >

                                <i className="bi bi-eye me-1" />

                                View

                              </Link> */}

                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>

                {/* ==============================================
                    PAGINATION
                ============================================== */}

                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mt-4 pt-3 border-top">

                  <div className="small text-muted">

                    Showing page{" "}

                    <strong>
                      {
                        pagination.page
                      }
                    </strong>

                    {" of "}

                    <strong>
                      {
                        pagination.totalPages
                      }
                    </strong>

                    {" — "}

                    <strong>
                      {
                        pagination.total
                      }
                    </strong>

                    {" campaign"}

                    {pagination.total !==
                    1
                      ? "s"
                      : ""}

                  </div>

                  <div className="d-flex gap-2">

                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      disabled={
                        !pagination.hasPreviousPage ||
                        loading
                      }
                      onClick={() =>
                        setPage(
                          (
                            previous
                          ) =>
                            Math.max(
                              1,
                              previous -
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
                      className="btn btn-outline-secondary btn-sm"
                      disabled={
                        !pagination.hasNextPage ||
                        loading
                      }
                      onClick={() =>
                        setPage(
                          (
                            previous
                          ) =>
                            previous +
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
// STATUS BADGE
// ============================================================

function CampaignStatusBadge({
  status,
}: {
  status: string;
}) {
  switch (
    status
  ) {
    case "COMPLETED":
      return (
        <span className="badge bg-success">
          COMPLETED
        </span>
      );

    case "REJECTED":
      return (
        <span className="badge bg-danger">
          REJECTED
        </span>
      );

    case "CANCELLED":
      return (
        <span className="badge bg-secondary">
          CANCELLED
        </span>
      );

    default:
      return (
        <span className="badge bg-secondary">
          {status}
        </span>
      );
  }
}

// ============================================================
// DATE
// ============================================================

function formatDate(
  value:
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
// TARGET
// ============================================================

function displayTarget(
  value:
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