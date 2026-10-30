"use client";

import { useCallback, useEffect, useState } from "react";

type Inquiry = {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "NEW" | "IN_PROGRESS" | "RESOLVED";
  createdAt: string;
  updatedAt: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type Summary = {
  total: number;
  new: number;
  inProgress: number;
  resolved: number;
};

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [status, setStatus] = useState("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [summary, setSummary] = useState<Summary>({
    total: 0,
    new: 0,
    inProgress: 0,
    resolved: 0,
  });

  // Selected Inquiry for Modal View
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  const loadInquiries = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        status,
        q: search,
      });

      const response = await fetch(`/api/admin/inquiries?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load inquiries.");
      }

      setInquiries(data.inquiries ?? []);
      if (data.pagination) setPagination(data.pagination);
      if (data.summary) setSummary(data.summary);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to load inquiries.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, search]);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function updateStatus(id: number, newStatus: "NEW" | "IN_PROGRESS" | "RESOLVED") {
    try {
      setError("");
      setSuccess("");

      const response = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, status: newStatus }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update status.");
      }

      setSuccess(`Inquiry #${id} marked as ${newStatus}.`);

      // Update local state
      setInquiries((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );

      if (selectedInquiry && selectedInquiry.id === id) {
        setSelectedInquiry({ ...selectedInquiry, status: newStatus });
      }

      // Refresh counts
      loadInquiries();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    }
  }

  async function deleteInquiry(id: number) {
    if (!window.confirm(`Are you sure you want to delete inquiry #${id}?`)) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(`/api/admin/inquiries?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete inquiry.");
      }

      setSuccess(`Inquiry #${id} deleted successfully.`);
      if (selectedInquiry && selectedInquiry.id === id) {
        setSelectedInquiry(null);
      }
      loadInquiries();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete inquiry.");
    }
  }

  function getStatusBadge(statusVal: string) {
    switch (statusVal) {
      case "NEW":
        return <span className="badge bg-warning text-dark px-2 py-1 fs-12">New</span>;
      case "IN_PROGRESS":
        return <span className="badge bg-info text-dark px-2 py-1 fs-12">In Progress</span>;
      case "RESOLVED":
        return <span className="badge bg-success px-2 py-1 fs-12">Resolved</span>;
      default:
        return <span className="badge bg-secondary px-2 py-1 fs-12">{statusVal}</span>;
    }
  }

  function formatDate(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  return (
    <>
      {/* Page Header */}
      <div className="col-12">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-2">
          <div>
            <h1 className="h3 fw-bold mb-1" style={{ color: "#012977" }}>
              <i className="bi bi-envelope-paper me-2"></i> Contact Messages &amp; Inquiries
            </h1>
            <div className="text-muted fs-14">
              View and manage submissions sent from the public Contact page.
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => loadInquiries()}
            title="Refresh list"
          >
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="col-12">
        <div className="row g-3">
          <div className="col-6 col-lg-3">
            <div
              className="card border-0 shadow-sm p-3 h-100"
              style={{ borderRadius: "12px", borderLeft: "4px solid #012977" }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted fs-12 text-uppercase fw-semibold">Total Inquiries</div>
                  <div className="fs-3 fw-bold text-dark mt-1">{summary.total}</div>
                </div>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white"
                  style={{ width: "42px", height: "42px", backgroundColor: "#012977" }}
                >
                  <i className="bi bi-inbox fs-5"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-6 col-lg-3">
            <div
              className="card border-0 shadow-sm p-3 h-100"
              style={{ borderRadius: "12px", borderLeft: "4px solid #f59e0b" }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted fs-12 text-uppercase fw-semibold">New / Unread</div>
                  <div className="fs-3 fw-bold text-warning mt-1">{summary.new}</div>
                </div>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white"
                  style={{ width: "42px", height: "42px", backgroundColor: "#f59e0b" }}
                >
                  <i className="bi bi-bell fs-5"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-6 col-lg-3">
            <div
              className="card border-0 shadow-sm p-3 h-100"
              style={{ borderRadius: "12px", borderLeft: "4px solid #0ea5e9" }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted fs-12 text-uppercase fw-semibold">In Progress</div>
                  <div className="fs-3 fw-bold text-info mt-1">{summary.inProgress}</div>
                </div>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white"
                  style={{ width: "42px", height: "42px", backgroundColor: "#0ea5e9" }}
                >
                  <i className="bi bi-hourglass-split fs-5"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-6 col-lg-3">
            <div
              className="card border-0 shadow-sm p-3 h-100"
              style={{ borderRadius: "12px", borderLeft: "4px solid #10b981" }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted fs-12 text-uppercase fw-semibold">Resolved</div>
                  <div className="fs-3 fw-bold text-success mt-1">{summary.resolved}</div>
                </div>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white"
                  style={{ width: "42px", height: "42px", backgroundColor: "#10b981" }}
                >
                  <i className="bi bi-check2-circle fs-5"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="col-12">
          <div className="alert alert-danger d-flex align-items-center py-2 px-3 mb-0" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
            <div>{error}</div>
          </div>
        </div>
      )}

      {success && (
        <div className="col-12">
          <div className="alert alert-success d-flex align-items-center py-2 px-3 mb-0" role="alert">
            <i className="bi bi-check-circle-fill me-2 fs-5"></i>
            <div>{success}</div>
          </div>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="col-12">
        <div className="card border-0 shadow-sm" style={{ borderRadius: "14px" }}>
          <div className="card-body">
            <form onSubmit={handleSearch}>
              <div className="row g-3">
                <div className="col-12 col-md-6 col-lg-7">
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-search text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Search inquiries by name, email, or subject..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                    />
                  </div>
                </div>

                <div className="col-12 col-md-4 col-lg-3">
                  <select
                    className="form-select"
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="ALL">All Statuses ({summary.total})</option>
                    <option value="NEW">New ({summary.new})</option>
                    <option value="IN_PROGRESS">In Progress ({summary.inProgress})</option>
                    <option value="RESOLVED">Resolved ({summary.resolved})</option>
                  </select>
                </div>

                <div className="col-12 col-md-2 col-lg-2">
                  <button type="submit" className="btn btn-primary w-100" style={{ backgroundColor: "#012977" }}>
                    Filter
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="col-12">
        <div className="card border-0 shadow-sm" style={{ borderRadius: "14px" }}>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2 text-muted fs-14">Loading inquiries...</p>
              </div>
            ) : inquiries.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-chat-square-dots text-muted fs-1 d-block mb-2"></i>
                <h5 className="fw-bold text-dark">No inquiries found</h5>
                <p className="text-muted fs-14 mb-0">
                  {search || status !== "ALL"
                    ? "Try adjusting your search filters."
                    : "No contact submissions received yet."}
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: "60px" }} className="ps-4">ID</th>
                      <th>Sender</th>
                      <th>Subject</th>
                      <th style={{ minWidth: "220px" }}>Message</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th className="text-end pe-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inquiries.map((inq) => (
                      <tr key={inq.id}>
                        <td className="ps-4 fw-bold text-muted">#{inq.id}</td>

                        <td>
                          <div className="fw-bold text-dark">{inq.name}</div>
                          <a
                            href={`mailto:${inq.email}?subject=Re: ${encodeURIComponent(inq.subject)}`}
                            className="text-decoration-none text-muted fs-13 d-inline-flex align-items-center"
                          >
                            <i className="bi bi-envelope me-1 text-primary"></i>
                            {inq.email}
                          </a>
                        </td>

                        <td>
                          <span className="fw-semibold text-dark">{inq.subject}</span>
                        </td>

                        <td>
                          <div
                            className="text-muted fs-13 text-truncate"
                            style={{ maxWidth: "260px" }}
                            title={inq.message}
                          >
                            {inq.message}
                          </div>
                        </td>

                        <td>{getStatusBadge(inq.status)}</td>

                        <td className="text-muted fs-13">{formatDate(inq.createdAt)}</td>

                        <td className="text-end pe-4">
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-primary"
                              onClick={() => setSelectedInquiry(inq)}
                              title="View full details"
                            >
                              <i className="bi bi-eye"></i>
                            </button>

                            {inq.status !== "RESOLVED" ? (
                              <button
                                type="button"
                                className="btn btn-outline-success"
                                onClick={() => updateStatus(inq.id, "RESOLVED")}
                                title="Mark as Resolved"
                              >
                                <i className="bi bi-check-lg"></i>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-outline-warning"
                                onClick={() => updateStatus(inq.id, "NEW")}
                                title="Re-open as New"
                              >
                                <i className="bi bi-arrow-counterclockwise"></i>
                              </button>
                            )}

                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => deleteInquiry(inq.id)}
                              title="Delete inquiry"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Table Footer Pagination */}
          {!loading && inquiries.length > 0 && (
            <div className="card-footer bg-white border-0 py-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div className="text-muted fs-14">
                Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total)
              </div>

              <div className="btn-group btn-group-sm">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <i className="bi bi-chevron-left me-1"></i> Prev
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <i className="bi bi-chevron-right ms-1"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inquiry Detail View Modal */}
      {selectedInquiry && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", zIndex: 1055 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px" }}>
              <div className="modal-header border-bottom py-3 px-4">
                <div className="d-flex align-items-center gap-2">
                  <h5 className="modal-title fw-bold text-dark mb-0">
                    Inquiry #{selectedInquiry.id}
                  </h5>
                  {getStatusBadge(selectedInquiry.status)}
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setSelectedInquiry(null)}
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-light rounded-3">
                      <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Sender Name</div>
                      <div className="fw-bold fs-15 text-dark">{selectedInquiry.name}</div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-light rounded-3">
                      <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Email Address</div>
                      <div className="fw-bold fs-15 text-primary">
                        <a
                          href={`mailto:${selectedInquiry.email}?subject=Re: ${encodeURIComponent(selectedInquiry.subject)}`}
                          className="text-decoration-none"
                        >
                          {selectedInquiry.email} <i className="bi bi-box-arrow-up-right ms-1 fs-12"></i>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-light rounded-3">
                      <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Subject</div>
                      <div className="fw-bold text-dark">{selectedInquiry.subject}</div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-light rounded-3">
                      <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Submitted On</div>
                      <div className="text-dark">{formatDate(selectedInquiry.createdAt)}</div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-muted fs-12 text-uppercase fw-semibold mb-2">Message Content</label>
                  <div
                    className="p-3 rounded-3 border bg-white"
                    style={{ whiteSpace: "pre-wrap", lineHeight: "1.6", maxHeight: "250px", overflowY: "auto" }}
                  >
                    {selectedInquiry.message}
                  </div>
                </div>

                {/* Status Updater */}
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 pt-3 border-top">
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-muted fs-13">Change Status:</span>
                    <button
                      type="button"
                      className={`btn btn-sm ${selectedInquiry.status === "NEW" ? "btn-warning" : "btn-outline-warning"}`}
                      onClick={() => updateStatus(selectedInquiry.id, "NEW")}
                    >
                      New
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${selectedInquiry.status === "IN_PROGRESS" ? "btn-info" : "btn-outline-info"}`}
                      onClick={() => updateStatus(selectedInquiry.id, "IN_PROGRESS")}
                    >
                      In Progress
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${selectedInquiry.status === "RESOLVED" ? "btn-success" : "btn-outline-success"}`}
                      onClick={() => updateStatus(selectedInquiry.id, "RESOLVED")}
                    >
                      Resolved
                    </button>
                  </div>

                  <a
                    href={`mailto:${selectedInquiry.email}?subject=Re: ${encodeURIComponent(selectedInquiry.subject)}`}
                    className="btn btn-sm btn-primary"
                    style={{ backgroundColor: "#012977" }}
                  >
                    <i className="bi bi-reply-fill me-1"></i> Reply via Email
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
