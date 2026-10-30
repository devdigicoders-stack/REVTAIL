"use client";

import { useCallback, useEffect, useState } from "react";

type StoppedCampaign = {
  testerCampaignId: number;
  currentTask: number;
  earningAmount: number;
  joinedAt: string;
  stoppedAt: string | null;
  stoppedReason: string | null;
  campaign: {
    id: number;
    campaignCode: string;
    productName: string;
    productImage: string | null;
    brandName: string;
  };
};

type Pagination = {
  page: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export default function TesterStoppedCampaignsPage() {
  const [campaigns, setCampaigns] = useState<StoppedCampaign[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/tester/campaigns/stopped?page=${page}`,
        { method: "GET", cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load stopped campaigns.");
      }

      setCampaigns(result.data ?? []);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load stopped campaigns.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  return (
    <>
      <div className="col-12">
        <h3 className="fw-bold mb-1">Stopped Campaigns</h3>
        <p className="text-muted mb-0">Campaign participation stopped by Admin.</p>
      </div>

      {error && (
        <div className="col-12">
          <div className="alert alert-danger">{error}</div>
        </div>
      )}

      <div className="col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center text-muted py-5">No stopped campaigns.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Campaign</th>
                      <th>Brand</th>
                      <th>Stopped At</th>
                      <th>Stopped During</th>
                      <th>Reason</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((item) => (
                      <tr key={item.testerCampaignId}>
                        <td>
                          <div className="fw-semibold">{item.campaign.productName}</div>
                          <small className="text-muted">{item.campaign.campaignCode}</small>
                        </td>
                        <td>{item.campaign.brandName}</td>
                        <td>{formatDate(item.stoppedAt)}</td>
                        <td>Task {item.currentTask}</td>
                        <td style={{ minWidth: 240 }}>{item.stoppedReason || "-"}</td>
                        <td><span className="badge bg-danger">Stopped by Admin</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && pagination.total > 0 && (
              <div className="d-flex justify-content-between border-top pt-3">
                <small className="text-muted">
                  Page {pagination.page} of {pagination.totalPages}
                </small>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    disabled={!pagination.hasPreviousPage}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    disabled={!pagination.hasNextPage}
                    onClick={() => setPage((value) => value + 1)}
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

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
