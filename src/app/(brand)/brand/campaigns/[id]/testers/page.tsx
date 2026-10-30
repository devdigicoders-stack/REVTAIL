"use client";

import Link from "next/link";
import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

type TesterRow = {
  testerCampaignId: number;
  status: string;
  currentTask: number;
  earningAmount: number;
  tester: {
    id: number;
    fullName: string;
    city?: string | null;
    state?: string | null;
    email?: string | null;
  };
  progress: {
    totalTasks: number;
    approvedTasks: number;
    submittedTasks: number;
  };
};

type ApiResponse = {
  success: boolean;
  message?: string;
  data?: {
    campaign: {
      id: number;
      campaignCode: string;
      productName: string;
      status: string;
      totalTesters: number;
    };
    testers: TesterRow[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
};

export default function BrandCampaignTestersPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const campaignId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const page = Math.max(
    1,
    Number(searchParams.get("page") ?? 1) || 1
  );
  const limit = Math.max(
    5,
    Number(searchParams.get("limit") ?? 10) || 10
  );

  const [data, setData] =
    useState<ApiResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTesters = useCallback(async () => {
    if (!campaignId) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/brand/campaigns/${campaignId}/testers?page=${page}&limit=${limit}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to load campaign testers."
        );
      }

      setData(result.data ?? null);
    } catch (err) {
      console.error("LOAD BRAND CAMPAIGN TESTERS ERROR:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load campaign testers."
      );
    } finally {
      setLoading(false);
    }
  }, [campaignId, page, limit]);

  useEffect(() => {
    loadTesters();
  }, [loadTesters]);

  const goToPage = (newPage: number) => {
    router.push(
      `/brand/campaigns/${campaignId}/testers?page=${newPage}&limit=${limit}`
    );
  };

  if (loading) {
    return (
      <div className="col-12 text-center py-5">
        <div className="spinner-border text-primary" />
        <div className="text-muted mt-3">Loading testers...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="col-12">
        <div className="alert alert-danger">
          {error || "Campaign testers not found."}
        </div>
        <Link
          href={`/brand/campaigns/${campaignId}`}
          className="btn btn-outline-secondary"
        >
          Back to Campaign
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="col-12">
        <Link
          href={`/brand/campaigns/${campaignId}`}
          className="text-decoration-none"
        >
          <i className="bi bi-arrow-left me-2" />
          Back to Campaign
        </Link>
      </div>

      <div className="col-12">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h3 className="fw-bold mb-1">Testers in Campaign</h3>
            <div className="text-muted">
              {data.campaign.productName} · {data.campaign.campaignCode}
            </div>
          </div>
          <span className="badge bg-primary fs-6">
            {data.pagination.total} Testers
          </span>
        </div>
      </div>

      <div className="col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            {data.testers.length === 0 ? (
              <div className="text-center py-5 text-muted">
                No testers are working in this campaign yet.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Tester</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Current Task</th>
                      <th>Progress</th>
                      <th>Pending Review</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.testers.map((row) => (
                      <tr key={row.testerCampaignId}>
                        <td>
                          <div className="fw-semibold">
                            {row.tester.fullName}
                          </div>
                          <small className="text-muted">
                            {row.tester.email ?? "-"}
                          </small>
                        </td>
                        <td>
                          {[row.tester.city, row.tester.state]
                            .filter(Boolean)
                            .join(", ") || "-"}
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {row.status}
                          </span>
                        </td>
                        <td>Task {row.currentTask}</td>
                        <td>
                          <div className="fw-semibold">
                            {row.progress.approvedTasks}/
                            {row.progress.totalTasks} approved
                          </div>
                          <small className="text-muted">
                            {row.progress.totalTasks
                              ? Math.round(
                                  (row.progress.approvedTasks /
                                    row.progress.totalTasks) *
                                    100
                                )
                              : 0}
                            %
                          </small>
                        </td>
                        <td>
                          {row.progress.submittedTasks > 0 ? (
                            <span className="badge bg-warning-subtle text-warning-emphasis">
                              {row.progress.submittedTasks} submitted
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="text-end">
                          <Link
                            href={`/brand/campaigns/${campaignId}/testers/${row.testerCampaignId}`}
                            className="btn btn-outline-primary btn-sm"
                          >
                            View Progress
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {data.pagination.totalPages > 1 && (
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <button
              type="button"
              className="btn btn-outline-secondary"
              disabled={!data.pagination.hasPreviousPage}
              onClick={() => goToPage(page - 1)}
            >
              Previous
            </button>

            <div className="text-muted">
              Page {data.pagination.page} of {data.pagination.totalPages}
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary"
              disabled={!data.pagination.hasNextPage}
              onClick={() => goToPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
}
