"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Campaign = {
  id: number;
  campaignCode: string;
  productName: string;
  brandName: string;
  brandCategory: string | { id: number; name: string } | null;
  targetState: string | null;
  targetCity: string | null;
  targetGender: string;
  totalSlots: number;
  availableSlots: number | null;
  applicationCount: number;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export default function AdminInvitationsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const query = new URLSearchParams();
      query.set("status", "LIVE");
      query.set("page", String(page));
      query.set("limit", String(limit));
      if (search) query.set("search", search);

      const response = await fetch(`/api/campaigns/list?${query.toString()}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load LIVE campaigns.");
      }

      setCampaigns(result.data ?? []);
      setPagination(
        result.pagination ?? {
          page: 1,
          limit,
          total: result.total ?? result.data?.length ?? 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      );
    } catch (err) {
      setCampaigns([]);
      setError(err instanceof Error ? err.message : "Unable to load campaigns.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  return (
    <>
      <div className="col-12">
        <h3 className="fw-bold mb-1">Invitation</h3>
        <div className="text-muted">
          Select a LIVE campaign to find eligible testers and send invitations.
        </div>
      </div>

      <div className="col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <form onSubmit={handleSearch}>
              <div className="row g-3">
                <div className="col-lg-9">
                  <input
                    className="form-control"
                    value={searchInput}
                    placeholder="Search by campaign code, product, brand, state or city..."
                    onChange={(event) => setSearchInput(event.target.value)}
                  />
                </div>
                <div className="col-lg-3">
                  <button type="submit" className="btn btn-primary w-100">
                    <i className="bi bi-search me-2" />Search
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {error && <div className="col-12"><div className="alert alert-danger">{error}</div></div>}

      <div className="col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            {loading ? (
              <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
            ) : campaigns.length === 0 ? (
              <div className="text-center text-muted py-5">No LIVE campaigns found.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Campaign</th>
                      <th>Brand</th>
                      <th>Brand Category</th>
                      <th>Target</th>
                      <th>Slots</th>
                      <th>Applications</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign) => {
                      const category =
                        typeof campaign.brandCategory === "string"
                          ? campaign.brandCategory
                          : campaign.brandCategory?.name ?? "-";

                      return (
                        <tr key={campaign.id}>
                          <td>
                            <div className="fw-semibold">{campaign.productName}</div>
                            <small className="text-muted">{campaign.campaignCode}</small>
                          </td>
                          <td>{campaign.brandName}</td>
                          <td>{category}</td>
                          <td>
                            <div>{campaign.targetState || "Any"} / {campaign.targetCity || "Any"}</div>
                            <small className="text-muted">{campaign.targetGender}</small>
                          </td>
                          <td>{campaign.availableSlots ?? 0} / {campaign.totalSlots}</td>
                          <td>{campaign.applicationCount}</td>
                          <td className="text-end">
                            <Link href={`/admin/invitations/${campaign.id}`} className="btn btn-sm btn-primary">
                              <i className="bi bi-people me-1" />Select Testers
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && pagination.total > 0 && (
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 border-top pt-3">
                <small className="text-muted">
                  Page {pagination.page} of {pagination.totalPages} — {pagination.total} campaigns
                </small>
                <div className="d-flex gap-2">
                  <select
                    className="form-select form-select-sm"
                    value={limit}
                    onChange={(event) => {
                      setLimit(Number(event.target.value));
                      setPage(1);
                    }}
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    disabled={!pagination.hasPreviousPage}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >Previous</button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    disabled={!pagination.hasNextPage}
                    onClick={() => setPage((current) => current + 1)}
                  >Next</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
