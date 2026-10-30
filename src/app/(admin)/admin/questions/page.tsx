"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

type Question = {
  id: number;

  questionText:
    string;

  questionType:
    string;

  source:
    string;

  isActive:
    boolean;

  createdAt:
    string;

  usageCount:
    number;

  options: {
    id: number;

    optionText:
      string;

    optionOrder:
      number;
  }[];
};

type Pagination = {
  page: number;

  limit: number;

  total: number;

  totalPages:
    number;

  hasNextPage:
    boolean;

  hasPreviousPage:
    boolean;
};

export default function AdminQuestionsPage() {
  const [
    questions,
    setQuestions,
  ] =
    useState<Question[]>([]);

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
    type,
    setType,
  ] =
    useState("ALL");

  const [
    status,
    setStatus,
  ] =
    useState("ALL");

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
    success,
    setSuccess,
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

      hasNextPage:
        false,

      hasPreviousPage:
        false,
    });

  const loadQuestions =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setError("");

          const query =
            new URLSearchParams();

          query.set(
            "source",
            "FIXED"
          );

          query.set(
            "page",
            String(page)
          );

          query.set(
            "limit",
            String(limit)
          );

          if (search) {
            query.set(
              "search",
              search
            );
          }

          if (
            type !==
            "ALL"
          ) {
            query.set(
              "type",
              type
            );
          }

          if (
            status !==
            "ALL"
          ) {
            query.set(
              "isActive",
              status ===
                "ACTIVE"
                ? "true"
                : "false"
            );
          }

          const response =
            await fetch(
              `/api/questions?${query.toString()}`,
              {
                credentials:
                  "include",

                cache:
                  "no-store",
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
                "Unable to load questions."
            );
          }

          setQuestions(
            result.data ??
              []
          );

          if (
            result.pagination
          ) {
            setPagination(
              result.pagination
            );
          }
        } catch (err) {
          setError(
            err instanceof
              Error
              ? err.message
              : "Unable to load questions."
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
        type,
        status,
      ]
    );

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  function handleSearch(
    event:
      React.FormEvent
  ) {
    event.preventDefault();

    setPage(1);

    setSearch(
      searchInput.trim()
    );
  }

  async function deleteQuestion(
    question:
      Question
  ) {
    const confirmed =
      window.confirm(
        `Delete "${question.questionText}"?`
      );

    if (
      !confirmed
    ) {
      return;
    }

    try {
      setError("");

      setSuccess("");

      const response =
        await fetch(
          `/api/questions/${question.id}`,
          {
            method:
              "DELETE",

            credentials:
              "include",
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
            "Unable to delete question."
        );
      }

      setSuccess(
        result.message
      );

      await loadQuestions();
    } catch (err) {
      setError(
        err instanceof
          Error
          ? err.message
          : "Unable to delete question."
      );
    }
  }

  return (
    <>
      <div className="col-12">

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">

          <div>

            <h3 className="fw-bold mb-1">

              Fixed Questions

            </h3>

            <div className="text-muted">

              Manage reusable questionnaire questions available to campaign creators.

            </div>

          </div>

          <Link
            href="/admin/questions/create"
            className="btn btn-primary"
          >

            <i className="bi bi-plus-circle me-2" />

            Create Question

          </Link>

        </div>

      </div>

      {error && (

        <div className="col-12">

          <div className="alert alert-danger">

            {
              error
            }

          </div>

        </div>

      )}

      {success && (

        <div className="col-12">

          <div className="alert alert-success">

            {
              success
            }

          </div>

        </div>

      )}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body">

            <form
              onSubmit={
                handleSearch
              }
            >

              <div className="row g-3">

                <div className="col-lg-5">

                  <input
                    className="form-control"
                    placeholder="Search question..."
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

                </div>

                <div className="col-lg-3">

                  <select
                    className="form-select"
                    value={
                      type
                    }
                    onChange={(
                      event
                    ) => {
                      setType(
                        event.target
                          .value
                      );

                      setPage(
                        1
                      );
                    }}
                  >

                    <option value="ALL">
                      All Types
                    </option>

                    <option value="TEXT">
                      Text
                    </option>

                    <option value="SINGLE_CHOICE">
                      Single Choice
                    </option>

                    <option value="MULTIPLE_CHOICE">
                      Multiple Choice
                    </option>

                  </select>

                </div>

                <div className="col-lg-2">

                  <select
                    className="form-select"
                    value={
                      status
                    }
                    onChange={(
                      event
                    ) => {
                      setStatus(
                        event.target
                          .value
                      );

                      setPage(
                        1
                      );
                    }}
                  >

                    <option value="ALL">
                      All Status
                    </option>

                    <option value="ACTIVE">
                      Active
                    </option>

                    <option value="INACTIVE">
                      Inactive
                    </option>

                  </select>

                </div>

                <div className="col-lg-2">

                  <button
                    className="btn btn-primary w-100"
                    type="submit"
                  >

                    Search

                  </button>

                </div>

              </div>

            </form>

          </div>

        </div>

      </div>

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body">

            {loading ? (

              <div className="text-center py-5">

                <div className="spinner-border text-primary" />

              </div>

            ) : questions.length ===
              0 ? (

              <div className="text-center py-5 text-muted">

                No fixed questions found.

              </div>

            ) : (

              <div className="table-responsive">

                <table className="table table-hover align-middle">

                  <thead className="table-light">

                    <tr>

                      <th>
                        Question
                      </th>

                      <th>
                        Type
                      </th>

                      <th>
                        Options
                      </th>

                      <th>
                        Used
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

                    {questions.map(
                      (
                        question
                      ) => (

                        <tr
                          key={
                            question.id
                          }
                        >

                          <td>

                            <div className="fw-semibold">

                              {
                                question.questionText
                              }

                            </div>

                            <small className="text-muted">

                              ID #
                              {
                                question.id
                              }

                            </small>

                          </td>

                          <td>

                            {
                              formatType(
                                question.questionType
                              )
                            }

                          </td>

                          <td>

                            {question.options.length >
                            0
                              ? question.options
                                  .map(
                                    (
                                      option
                                    ) =>
                                      option.optionText
                                  )
                                  .join(
                                    ", "
                                  )
                              : "-"}

                          </td>

                          <td>

                            {
                              question.usageCount
                            }

                            {" campaigns"}

                          </td>

                          <td>

                            <span
                              className={`badge ${
                                question.isActive
                                  ? "bg-success"
                                  : "bg-secondary"
                              }`}
                            >

                              {question.isActive
                                ? "ACTIVE"
                                : "INACTIVE"}

                            </span>

                          </td>

                          <td className="text-end">

                            <Link
                              href={`/admin/questions/${question.id}/edit`}
                              className="btn btn-sm btn-outline-primary me-1"
                            >

                              <i className="bi bi-pencil me-1" />

                              Edit

                            </Link>
                        {/* 
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() =>
                                deleteQuestion(
                                  question
                                )
                              }
                            >

                              <i className="bi bi-trash me-1" />

                              Delete

                            </button> */}

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

            {!loading &&
              questions.length >
                0 && (

                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 border-top pt-3">

                  <div className="small text-muted">

                    Page{" "}

                    {
                      pagination.page
                    }

                    {" of "}

                    {
                      pagination.totalPages
                    }

                    {" — "}

                    {
                      pagination.total
                    }

                    {" fixed questions"}

                  </div>

                  <div className="d-flex gap-2">

                    <select
                      className="form-select form-select-sm"
                      value={
                        limit
                      }
                      onChange={(
                        event
                      ) => {
                        setLimit(
                          Number(
                            event
                              .target
                              .value
                          )
                        );

                        setPage(
                          1
                        );
                      }}
                    >

                      <option value="10">
                        10
                      </option>

                      <option value="20">
                        20
                      </option>

                      <option value="50">
                        50
                      </option>

                    </select>

                    <button
                      className="btn btn-sm btn-outline-secondary"
                      disabled={
                        !pagination.hasPreviousPage
                      }
                      onClick={() =>
                        setPage(
                          (
                            previous
                          ) =>
                            previous -
                            1
                        )
                      }
                    >

                      Previous

                    </button>

                    <button
                      className="btn btn-sm btn-outline-secondary"
                      disabled={
                        !pagination.hasNextPage
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

                    </button>

                  </div>

                </div>

              )}

          </div>

        </div>

      </div>
    </>
  );
}

function formatType(
  type: string
) {
  switch (
    type
  ) {
    case "TEXT":
      return "Text";

    case "SINGLE_CHOICE":
      return "Single Choice";

    case "MULTIPLE_CHOICE":
      return "Multiple Choice";

    default:
      return type;
  }
}