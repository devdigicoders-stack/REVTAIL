"use client";

import Image from "next/image";
import Link from "next/link";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

// ============================================================
// TYPES
// ============================================================

type TesterStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "BLOCKED";


type AgeCategoryFilter =
  | "ALL"
  | "AGE_18_24"
  | "AGE_25_34"
  | "AGE_35_44"
  | "AGE_45_PLUS";

type GenderFilter =
  | "ALL"
  | "MALE"
  | "FEMALE";

type Tester = {
  id: number;

  userId: number;

  fullName: string;

  gender: string;

  ageCategory:
    | string
    | null;

  pinCode: string;

  city:
    | string
    | null;

  state:
    | string
    | null;

  profileImage:
    | string
    | null;

  instagramId:
    | string
    | null;

  approvalStatus:
    TesterStatus;

  rejectionReason:
    | string
    | null;

  user: {
    email:
      | string
      | null;

    mobile:
      | string
      | null;

    status: string;
  };

  interests: {
    interest: {
      id: number;

      name: string;
    };
  }[];
};

type Summary = {
  total: number;

  pending: number;

  approved: number;

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

export default function AdminTestersPage() {
  // ==========================================================
  // DATA
  // ==========================================================

  const [
    testers,
    setTesters,
  ] =
    useState<Tester[]>(
      []
    );

  const [
    summary,
    setSummary,
  ] =
    useState<Summary>({
      total: 0,

      pending: 0,

      approved: 0,

      rejected: 0,
    });

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
  // LOADING / ERROR
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
  // STATUS
  //
  // IMPORTANT:
  // Default = ALL
  //
  // Therefore the first page load shows ALL Testers.
  // ==========================================================

  const [
    status,
    setStatus,
  ] =
    useState<
      "ALL" | TesterStatus
    >("ALL");

  // ==========================================================
  // AGE GROUP FILTER
  // ==========================================================

  const [
    ageCategory,
    setAgeCategory,
  ] =
    useState<AgeCategoryFilter>(
      "ALL"
    );

  // ==========================================================
  // GENDER FILTER
  // ==========================================================

  const [
    gender,
    setGender,
  ] =
    useState<GenderFilter>(
      "ALL"
    );

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

  // ==========================================================
  // APPROVE / REJECT
  // ==========================================================

  const [
    processingId,
    setProcessingId,
  ] =
    useState<number | null>(
      null
    );

  const [
    selectedTester,
    setSelectedTester,
  ] =
    useState<Tester | null>(
      null
    );

  const [
    showRejectModal,
    setShowRejectModal,
  ] =
    useState(false);

  const [
    rejectionReason,
    setRejectionReason,
  ] =
    useState("");

  // ==========================================================
  // LOAD TESTERS
  // ==========================================================

  const loadTesters =
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

          // --------------------------------------------------
          // Search
          // --------------------------------------------------

          if (search) {
            query.set(
              "search",
              search
            );
          }

          // --------------------------------------------------
          // Status
          //
          // ALL means do not send status.
          // --------------------------------------------------

          if (
            status !==
            "ALL"
          ) {
            query.set(
              "status",
              status
            );
          }

          // --------------------------------------------------
          // Age Group
          // --------------------------------------------------

          if (
            ageCategory !==
            "ALL"
          ) {
            query.set(
              "ageCategory",
              ageCategory
            );
          }

          // --------------------------------------------------
          // Gender
          // --------------------------------------------------

          if (
            gender !==
            "ALL"
          ) {
            query.set(
              "gender",
              gender
            );
          }

          const response =
            await fetch(
              `/api/admin/testers?${query.toString()}`,
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
                "Unable to load Testers."
            );
          }

          setTesters(
            result.data ??
              []
          );

          setSummary(
            result.summary ?? {
              total: 0,

              pending: 0,

              approved: 0,

              rejected: 0,
            }
          );

          setPagination(
            result.pagination ?? {
              page: 1,

              limit,

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
            "LOAD TESTERS ERROR:",
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load Testers."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        page,
        limit,
        search,
        status,
        ageCategory,
        gender,
      ]
    );

  // ==========================================================
  // LOAD ON FILTER/PAGE CHANGE
  // ==========================================================

  useEffect(() => {
    loadTesters();
  }, [loadTesters]);

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
  // STATUS FILTER
  // ==========================================================

  const applyStatusFilter =
    (
      newStatus:
        | "ALL"
        | TesterStatus
    ) => {
      setStatus(
        newStatus
      );

      setPage(1);
    };

  const applyAgeFilter =
    (
      newAgeCategory:
        AgeCategoryFilter
    ) => {
      setAgeCategory(
        newAgeCategory
      );

      setPage(1);
    };

  const applyGenderFilter =
    (
      newGender:
        GenderFilter
    ) => {
      setGender(
        newGender
      );

      setPage(1);
    };

  const clearAllFilters =
    () => {
      setStatus("ALL");
      setAgeCategory("ALL");
      setGender("ALL");
      setSearchInput("");
      setSearch("");
      setPage(1);
    };

  // ==========================================================
  // UPDATE TESTER STATUS
  // ==========================================================

  const updateTesterStatus =
    async (
      tester:
        Tester,

      action:
        | "APPROVE"
        | "REJECT",

      reason?: string
    ) => {
      try {
        setProcessingId(
          tester.id
        );

        setError("");
        setSuccessMessage("");

        const response =
          await fetch(
            `/api/admin/testers/${tester.id}/status`,
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
                JSON.stringify({
                  action,

                  reason:
                    action ===
                    "REJECT"
                      ? reason
                      : undefined,
                }),
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Unable to update Tester."
          );
        }

        if (result.whatsappSent) {
          setSuccessMessage(
            `${result.message} WhatsApp notification sent successfully.`
          );
        } else if (result.whatsappError) {
          setSuccessMessage(
            `${result.message} WhatsApp notification could not be sent: ${result.whatsappError}`
          );
        } else {
          setSuccessMessage(
            result.message ||
              "Tester status updated successfully."
          );
        }

        // Reload current page and summary counts.
        await loadTesters();

        setShowRejectModal(
          false
        );

        setSelectedTester(
          null
        );

        setRejectionReason(
          ""
        );
      } catch (err) {
        console.error(
          "UPDATE TESTER STATUS ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to update Tester."
        );
      } finally {
        setProcessingId(
          null
        );
      }
    };

  // ==========================================================
  // STATUS BADGE CLASS
  // ==========================================================

  const statusClass =
    (
      value:
        TesterStatus
    ) => {
      switch (value) {
        case "APPROVED":
          return "bg-success-subtle text-success";

        case "REJECTED":
          return "bg-danger-subtle text-danger";

        case "BLOCKED":
          return "bg-dark-subtle text-dark";

        default:
          return "bg-warning-subtle text-warning-emphasis";
      }
    };

  // ==========================================================
  // STATUS LABEL
  // ==========================================================

  const statusLabel =
    (
      value:
        TesterStatus
    ) => {
      switch (value) {
        case "PENDING":
          return "New Request";

        case "APPROVED":
          return "Approved";

        case "REJECTED":
          return "Rejected";

        case "BLOCKED":
          return "Blocked";

        default:
          return value;
      }
    };

  // ==========================================================
  // AGE LABEL
  // ==========================================================

  const ageCategoryLabel =
    (
      value:
        string | null
    ) => {
      switch (value) {
        case "AGE_18_24":
          return "18 - 24";

        case "AGE_25_34":
          return "25 - 34";

        case "AGE_35_44":
          return "35 - 44";

        case "AGE_45_PLUS":
          return "45+";

        default:
          return value ?? "-";
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
              Tester Management
            </h4>

            <p className="text-muted mb-0">
              View all Testers, review new registrations and manage Tester accounts.
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

              <i className="bi bi-person-plus me-2" />

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
          title="Total Testers"
          value={
            summary.total
          }
          icon="bi-people"
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
          icon="bi-person-plus"
          valueClass="text-warning"
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
            summary.approved
          }
          icon="bi-check-circle"
          valueClass="text-success"
          active={
            status ===
            "APPROVED"
          }
          onClick={() =>
            applyStatusFilter(
              "APPROVED"
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
          icon="bi-x-circle"
          valueClass="text-danger"
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
          SUCCESS
      ====================================================== */}

      {successMessage && (

        <div className="col-12">

          <div className="alert alert-success">

            <i className="bi bi-check-circle me-2" />

            {successMessage}

          </div>

        </div>

      )}

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
          TESTER LIST
      ====================================================== */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          {/* ==================================================
              SEARCH / FILTER
          ================================================== */}

          <div className="card-header bg-white border-0 pt-4 px-4">

            <div className="row g-3">

              {/* Search */}

              <div className="col-xl-4 col-lg-12">

                <form
                  onSubmit={
                    handleSearch
                  }
                >

                  <div className="input-group">

                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search name, mobile, email, city, state or PIN..."
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

              {/* Status */}

              <div className="col-xl-2 col-md-6">

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
                        | TesterStatus
                    )
                  }
                >

                  <option value="ALL">
                    All Testers
                  </option>

                  <option value="PENDING">
                    New Requests
                  </option>

                  <option value="APPROVED">
                    Approved
                  </option>

                  <option value="REJECTED">
                    Rejected
                  </option>

                  <option value="BLOCKED">
                    Blocked
                  </option>

                </select>

              </div>

              {/* Age Group */}

              <div className="col-xl-2 col-md-6">

                <select
                  className="form-select"
                  value={
                    ageCategory
                  }
                  onChange={(e) =>
                    applyAgeFilter(
                      e.target
                        .value as
                        AgeCategoryFilter
                    )
                  }
                >

                  <option value="ALL">
                    All Age Groups
                  </option>

                  <option value="AGE_18_24">
                    Age 18 - 24
                  </option>

                  <option value="AGE_25_34">
                    Age 25 - 34
                  </option>

                  <option value="AGE_35_44">
                    Age 35 - 44
                  </option>

                  <option value="AGE_45_PLUS">
                    Age 45+
                  </option>

                </select>

              </div>

              {/* Gender */}

              <div className="col-xl-2 col-md-6">

                <select
                  className="form-select"
                  value={
                    gender
                  }
                  onChange={(e) =>
                    applyGenderFilter(
                      e.target
                        .value as
                        GenderFilter
                    )
                  }
                >

                  <option value="ALL">
                    All Gender
                  </option>

                  <option value="MALE">
                    Male
                  </option>

                  <option value="FEMALE">
                    Female
                  </option>

                </select>

              </div>

              {/* Rows per page */}

              <div className="col-xl-2 col-md-6">

                <select
                  className="form-select"
                  value={
                    limit
                  }
                  onChange={(e) => {
                    setLimit(
                      Number(
                        e.target.value
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

            {/* Current filter */}

            {/* <div className="row mt-3">

              <div className="col-12">

                <div className="small text-muted d-flex flex-wrap align-items-center gap-2">

                <span>
                  {status ===
                  "ALL"
                    ? "Showing all Testers"
                    : status ===
                      "PENDING"
                    ? "Showing new Tester requests"
                    : status ===
                      "APPROVED"
                    ? "Showing approved Testers"
                    : status ===
                      "REJECTED"
                    ? "Showing rejected Testers"
                    : "Showing blocked Testers"}
                </span>
  
                {ageCategory !==
                  "ALL" && (
                  <span>
                    · Age:{" "}
                    <strong>
                      {ageCategory ===
                      "AGE_18_24"
                        ? "18 - 24"
                        : ageCategory ===
                          "AGE_25_34"
                        ? "25 - 34"
                        : ageCategory ===
                          "AGE_35_44"
                        ? "35 - 44"
                        : "45+"}
                    </strong>
                  </span>
                )}
  
                {gender !==
                  "ALL" && (
                  <span>
                    · Gender:{" "}
                    <strong>
                      {gender ===
                      "MALE"
                        ? "Male"
                        : "Female"}
                    </strong>
                  </span>
                )}
  
                {search && (
                  <span>
                    · Search:{" "}
                    <strong>
                      {search}
                    </strong>
                  </span>
                )}
  
                {(status !==
                  "ALL" ||
                  ageCategory !==
                    "ALL" ||
                  gender !==
                    "ALL" ||
                  search) && (
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 ms-1"
                    onClick={
                      clearAllFilters
                    }
                  >
                    Clear filters
                  </button>
                )}
  
                  </div>

              </div>

            </div> */}
            <div> <button
                    type="button"
                    className="btn btn-link btn-sm p-0 ms-1"
                    onClick={
                      clearAllFilters
                    }
                  >
                   <i className="bi bi-x-lg me-1" /> 
                  </button>
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

                  Loading Testers...

                </p>

              </div>

            ) : testers.length ===
              0 ? (

              <div className="text-center py-5">

                <i className="bi bi-people fs-1 text-muted" />

                <h6 className="mt-3">
                  No Testers found
                </h6>

                <p className="text-muted">

                  {status ===
                  "ALL"
                    ? "No Tester accounts are available."
                    : "No Testers match the selected filter."}

                </p>

                {(status !==
                  "ALL" ||
                  ageCategory !==
                    "ALL" ||
                  gender !==
                    "ALL" ||
                  search) && (

                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={
                      clearAllFilters
                    }
                  >

                    Clear Filters

                  </button>

                )}

              </div>

            ) : (

              <>
                {/* ==============================================
                    TABLE
                ============================================== */}

                <div className="w-100">

                  <table
                    className="table table-hover align-middle mb-0"
                    style={{
                      width: "100%",
                      tableLayout: "fixed",
                    }}
                  >

                    <colgroup>
                      <col style={{ width: "18%" }} />
                      <col style={{ width: "14%" }} />
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "12%" }} />
                      <col style={{ width: "16%" }} />
                    </colgroup>

                    <thead className="small">

                      <tr>

                        <th>
                          Tester
                        </th>

                        <th>
                          Contact
                        </th>

                        <th>
                          Location
                        </th>

                        <th>
                          Age Group
                        </th>

                        <th>
                          Interests
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

                      {testers.map(
                        (
                          tester
                        ) => (

                          <tr
                            key={
                              tester.id
                            }
                          >

                            {/* TESTER */}

                            <td
                              style={{
                                minWidth: 0,
                                overflowWrap: "anywhere",
                              }}
                            >

                              <div className="d-flex align-items-center gap-2">

                                {tester.profileImage ? (

                                  <Image
                                    src={
                                      tester.profileImage
                                    }
                                    alt={
                                      tester.fullName
                                    }
                                    width={40}
                                    height={40}
                                    className="rounded-circle"
                                    style={{
                                      objectFit:
                                        "cover",
                                    }}
                                  />

                                ) : (

                                  <div
                                    className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                                    style={{
                                      width:
                                        "40px",

                                      height:
                                        "40px",
                                    }}
                                  >

                                    <i className="bi bi-person" />

                                  </div>

                                )}
                                <Link href={`/admin/testers/${tester.id}`}>

                                  <div>

                                    <div className="fw-semibold small">

                                      {
                                        tester.fullName
                                      }

                                    </div>
                                
                                    <small className="text-muted">

                                      {
                                        tester.gender
                                      }

                                    </small>

                                  </div>
                                </Link>

                              </div>

                            </td>

                            {/* CONTACT */}

                            <td
                              style={{
                                minWidth: 0,
                                overflowWrap: "anywhere",
                                wordBreak: "break-word",
                              }}
                            >

                              <div className="small">

                                {tester.user.mobile ??
                                  "-"}

                              </div>

                              <small className="text-muted">

                                {tester.user.email ??
                                  "-"}

                              </small>

                            </td>

                            {/* LOCATION */}

                            <td
                              style={{
                                minWidth: 0,
                                overflowWrap: "anywhere",
                                wordBreak: "break-word",
                              }}
                            >

                              <div className="small">

                                {tester.city ??
                                  "-"}

                              </div>

                              <small className="text-muted">

                                {tester.state ??
                                  tester.pinCode}

                              </small>

                            </td>

                            {/* AGE */}

                            <td
                              className="small"
                              style={{
                                whiteSpace: "nowrap",
                              }}
                            >

                              {ageCategoryLabel(
                                tester.ageCategory
                              )}

                            </td>

                            {/* INTERESTS */}

                            <td
                              className="small"
                              style={{
                                minWidth: 0,
                                overflowWrap: "anywhere",
                              }}
                            >

                              {tester.interests.length >
                              0 ? (

                                <div className="d-flex flex-wrap gap-1">

                                  {tester.interests
                                    .slice(
                                      0,
                                      3
                                    )
                                    .map(
                                      (
                                        item
                                      ) => (

                                        <span
                                          key={
                                            item.interest.id
                                          }
                                          className="badge bg-light text-dark border"
                                        >

                                          {
                                            item.interest.name
                                          }

                                        </span>

                                      )
                                    )}

                                  {tester.interests.length >
                                    3 && (

                                    <span className="badge bg-secondary-subtle text-secondary">

                                      +
                                      {tester.interests.length -
                                        3}

                                    </span>

                                  )}

                                </div>

                              ) : (

                                <span className="text-muted">
                                  -
                                </span>

                              )}

                            </td>

                            {/* STATUS */}

                            <td
                              className="small"
                              style={{
                                minWidth: 0,
                              }}
                            >

                              <span
                                className={`badge ${statusClass(
                                  tester.approvalStatus
                                )}`}
                              >

                                {statusLabel(
                                  tester.approvalStatus
                                )}

                              </span>

                            </td>

                            {/* ACTION */}

                            <td
                              className="text-end"
                              style={{
                                minWidth: 0,
                              }}
                            >

                              {tester.approvalStatus ===
                              "PENDING" ? (

                                <div className="d-flex flex-column align-items-stretch gap-1 ms-auto"
                                  style={{
                                    maxWidth: "92px",
                                  }}
                                >

                                  {/* APPROVE */}
<div
  className="d-flex justify-content-end align-items-center gap-1 flex-nowrap"
  style={{
    whiteSpace: "nowrap",
  }}
>

  {/* APPROVE */}
  <button
    type="button"
    className="btn btn-success btn-sm d-inline-flex align-items-center justify-content-center"
    style={{
      width: "32px",
      height: "32px",
      padding: 0,
      flexShrink: 0,
    }}
    title={`Approve ${tester.fullName}`}
    aria-label={`Approve ${tester.fullName}`}
    disabled={
      processingId ===
      tester.id
    }
    onClick={() => {
      const confirmed =
        window.confirm(
          `Approve ${tester.fullName} as a Tester?`
        );

      if (confirmed) {
        updateTesterStatus(
          tester,
          "APPROVE"
        );
      }
    }}
  >
    {processingId ===
    tester.id ? (
      <span className="spinner-border spinner-border-sm" />
    ) : (
      <i className="bi bi-check-circle" />
    )}
  </button>


  {/* REJECT */}
  <button
    type="button"
    className="btn btn-outline-danger btn-sm d-inline-flex align-items-center justify-content-center"
    style={{
      width: "32px",
      height: "32px",
      padding: 0,
      flexShrink: 0,
    }}
    title={`Reject ${tester.fullName}`}
    aria-label={`Reject ${tester.fullName}`}
    disabled={
      processingId ===
      tester.id
    }
    onClick={() => {
      setSelectedTester(
        tester
      );

      setRejectionReason(
        ""
      );

      setShowRejectModal(
        true
      );
    }}
  >
    <i className="bi bi-x-circle" />
  </button>

</div>

                                </div>

                              ) : (

                                <span className="text-muted small">

                                  {/* {statusLabel(
                                    tester.approvalStatus
                                  )} */}

                                </span>

                              )}

                               {/* <Link
                                href={`/admin/testers/${tester.id}`}
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

                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mt-4">

                  <div className="text-muted small">

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
                    Tester
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

      {showRejectModal &&
        selectedTester && (

        <div
          className="modal fade show"
          style={{
            display:
              "block",

            backgroundColor:
              "rgba(0,0,0,.5)",
          }}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >

          <div className="modal-dialog modal-dialog-centered">

            <div className="modal-content">

              <div className="modal-header">

                <h5 className="modal-title">
                  Reject Tester
                </h5>

                <button
                  type="button"
                  className="btn-close"
                  disabled={
                    processingId ===
                    selectedTester.id
                  }
                  onClick={() =>
                    setShowRejectModal(
                      false
                    )
                  }
                />

              </div>

              <div className="modal-body">

                <p>

                  Reject registration for{" "}

                  <strong>
                    {
                      selectedTester.fullName
                    }
                  </strong>
                  ?

                </p>

                <label className="form-label fw-semibold">

                  Rejection Reason{" "}

                  <span className="text-danger">
                    *
                  </span>

                </label>

                <textarea
                  className="form-control"
                  rows={4}
                  value={
                    rejectionReason
                  }
                  disabled={
                    processingId ===
                    selectedTester.id
                  }
                  onChange={(e) =>
                    setRejectionReason(
                      e.target.value
                    )
                  }
                  placeholder="Enter reason for rejection..."
                />

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="btn btn-light"
                  disabled={
                    processingId ===
                    selectedTester.id
                  }
                  onClick={() =>
                    setShowRejectModal(
                      false
                    )
                  }
                >

                  Cancel

                </button>

                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={
                    !rejectionReason.trim() ||
                    processingId ===
                      selectedTester.id
                  }
                  onClick={() =>
                    updateTesterStatus(
                      selectedTester,
                      "REJECT",
                      rejectionReason
                    )
                  }
                >

                  {processingId ===
                  selectedTester.id
                    ? "Processing..."
                    : "Confirm Reject"}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}
    </>
  );
}

// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  title,
  value,
  icon,
  valueClass = "",
  active,
  onClick,
}: {
  title: string;

  value: number;

  icon: string;

  valueClass?: string;

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