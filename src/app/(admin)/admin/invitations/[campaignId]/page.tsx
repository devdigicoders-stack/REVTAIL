"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Interest = { id: number; name: string };
type Tester = {
  id: number;
  fullName: string;
  gender: string;
  ageCategory: string;
  pinCode: string;
  city: string | null;
  state: string | null;
  email: string | null;
  mobile: string | null;
  interests: Interest[];
  application: { id: number; status: string } | null;
  invitation: { id: number; invitedAt: string } | null;
  canInvite: boolean;
};
type Campaign = {
  id: number;
  campaignCode: string;
  productName: string;
  targetState: string | null;
  targetCity: string | null;
  targetGender: string;
  availableSlots: number | null;
  brand: {
    id: number;
    companyName: string;
    categoryId: number | null;
    categoryName: string | null;
  };
};
type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export default function AdminInvitationTestersPage() {
  const params = useParams();
  const campaignId = Array.isArray(params.campaignId) ? params.campaignId[0] : params.campaignId;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [testers, setTesters] = useState<Tester[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 20, total: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false,
  });

  const loadTesters = useCallback(async () => {
    if (!campaignId) return;

    try {
      setLoading(true);
      setError("");

      const query = new URLSearchParams();
      query.set("page", String(page));
      query.set("limit", String(limit));
      if (search) query.set("search", search);

      const response = await fetch(
        `/api/admin/invitations/campaigns/${campaignId}/testers?${query.toString()}`,
        { credentials: "include", cache: "no-store" }
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load testers.");
      }

      setCampaign(result.data?.campaign ?? null);
      setTesters(result.data?.testers ?? []);
      setPagination(result.pagination);

      setSelectedIds((previous) =>
        previous.filter((id) =>
          (result.data?.testers ?? []).some((tester: Tester) => tester.id === id && tester.canInvite)
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load testers.");
    } finally {
      setLoading(false);
    }
  }, [campaignId, page, limit, search]);

  useEffect(() => { loadTesters(); }, [loadTesters]);

  const inviteableOnPage = useMemo(() => testers.filter((t) => t.canInvite), [testers]);
  const allChecked = inviteableOnPage.length > 0 && inviteableOnPage.every((t) => selectedIds.includes(t.id));

  function toggleAll() {
    if (allChecked) {
      const pageIds = new Set(inviteableOnPage.map((t) => t.id));
      setSelectedIds((previous) => previous.filter((id) => !pageIds.has(id)));
    } else {
      setSelectedIds((previous) => [...new Set([...previous, ...inviteableOnPage.map((t) => t.id)])]);
    }
  }

  function toggleTester(tester: Tester) {
    if (!tester.canInvite) return;
    setSelectedIds((previous) =>
      previous.includes(tester.id)
        ? previous.filter((id) => id !== tester.id)
        : [...previous, tester.id]
    );
  }

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function sendInvitations() {
    if (!campaignId || selectedIds.length === 0) {
      setError("Select at least one tester.");
      return;
    }

    try {
      setSending(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/admin/invitations/send", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: Number(campaignId),
          testerProfileIds: selectedIds,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to send invitations.");
      }

      const whatsappSent =
        Number(
          result.data?.whatsappSent ??
            0
        );

      const whatsappFailed =
        Number(
          result.data?.whatsappFailed ??
            0
        );

      if (
        whatsappFailed > 0
      ) {
        const whatsappErrors:
          string[] =
          Array.isArray(
            result.data?.whatsappErrors
          )
            ? result.data.whatsappErrors
            : [];

        const errorDetails =
          whatsappErrors.length > 0
            ? ` ${whatsappErrors.join(" | ")}`
            : "";

        setSuccess(
          `${result.message} WhatsApp sent to ${whatsappSent} tester(s); ${whatsappFailed} WhatsApp notification(s) could not be sent.${errorDetails}`
        );
      } else if (
        whatsappSent > 0
      ) {
        setSuccess(
          `${result.message} WhatsApp notification sent successfully to ${whatsappSent} tester(s).`
        );
      } else {
        setSuccess(
          result.message
        );
      }

      setSelectedIds([]);
      await loadTesters();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send invitations.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="col-12">
        <Link href="/admin/invitations" className="text-decoration-none">
          <i className="bi bi-arrow-left me-1" />Back to LIVE Campaigns
        </Link>
      </div>

      <div className="col-12">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h3 className="fw-bold mb-1">Select Testers</h3>
            {campaign && (
              <div className="text-muted">
                {campaign.campaignCode} • {campaign.productName} • {campaign.brand.companyName}
              </div>
            )}
          </div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={sending || selectedIds.length === 0}
            onClick={sendInvitations}
          >
            <i className="bi bi-send me-2" />
            {sending ? "Sending..." : `Send Invitation (${selectedIds.length})`}
          </button>
        </div>
      </div>

      {campaign && (
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3"><small className="text-muted">Brand Category</small><div className="fw-semibold">{campaign.brand.categoryName || "-"}</div></div>
                <div className="col-md-3"><small className="text-muted">State</small><div className="fw-semibold">{campaign.targetState || "Any"}</div></div>
                <div className="col-md-3"><small className="text-muted">City</small><div className="fw-semibold">{campaign.targetCity || "Any"}</div></div>
                <div className="col-md-3"><small className="text-muted">Gender</small><div className="fw-semibold">{campaign.targetGender}</div></div>
              </div>
              <div className="small text-muted mt-3">
                Testers are automatically filtered by campaign location, gender, and Brand category matching a tester interest.
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <div className="col-12"><div className="alert alert-danger">{error}</div></div>}
      {success && <div className="col-12"><div className="alert alert-success">{success}</div></div>}

      <div className="col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <form onSubmit={handleSearch} className="mb-3">
              <div className="row g-2">
                <div className="col-lg-9">
                  <input
                    className="form-control"
                    value={searchInput}
                    placeholder="Search tester by name, email, mobile, PIN, city or state..."
                    onChange={(event) => setSearchInput(event.target.value)}
                  />
                </div>
                <div className="col-lg-3"><button className="btn btn-outline-primary w-100" type="submit">Search</button></div>
              </div>
            </form>

            {loading ? (
              <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
            ) : testers.length === 0 ? (
              <div className="text-center text-muted py-5">No eligible testers found for this campaign.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 40 }}>
                        <input type="checkbox" className="form-check-input" checked={allChecked} disabled={inviteableOnPage.length === 0} onChange={toggleAll} />
                      </th>
                      <th>Tester</th><th>Gender</th><th>Age</th><th>Location</th><th>Interests</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testers.map((tester) => (
                      <tr key={tester.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            disabled={!tester.canInvite}
                            checked={selectedIds.includes(tester.id)}
                            onChange={() => toggleTester(tester)}
                          />
                        </td>
                        <td>
                          <div className="fw-semibold">{tester.fullName}</div>
                          <small className="text-muted d-block">{tester.mobile || tester.email || "-"}</small>
                        </td>
                        <td>{tester.gender}</td>
                        <td>{formatAge(tester.ageCategory)}</td>
                        <td><div>{tester.city || "-"}</div><small className="text-muted">{tester.state || "-"}</small></td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {tester.interests.map((interest) => (
                              <span key={interest.id} className="badge bg-light text-dark border">{interest.name}</span>
                            ))}
                          </div>
                        </td>
                        <td>
                          {tester.application ? (
                            <span className="badge bg-info text-dark">Application: {tester.application.status}</span>
                          ) : tester.invitation ? (
                            <span className="badge bg-success">Invited</span>
                          ) : (
                            <span className="badge bg-secondary">Ready</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && pagination.total > 0 && (
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 border-top pt-3">
                <small className="text-muted">Page {pagination.page} of {pagination.totalPages} — {pagination.total} matching testers</small>
                <div className="d-flex gap-2">
                  <select className="form-select form-select-sm" value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }}>
                    <option value="10">10</option><option value="20">20</option><option value="50">50</option><option value="100">100</option>
                  </select>
                  <button type="button" className="btn btn-sm btn-outline-secondary" disabled={!pagination.hasPreviousPage} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
                  <button type="button" className="btn btn-sm btn-outline-secondary" disabled={!pagination.hasNextPage} onClick={() => setPage((p) => p + 1)}>Next</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function formatAge(value: string) {
  switch (value) {
    case "AGE_18_24": return "18-24";
    case "AGE_25_34": return "25-34";
    case "AGE_35_44": return "35-44";
    case "AGE_45_PLUS": return "45+";
    default: return value;
  }
}
