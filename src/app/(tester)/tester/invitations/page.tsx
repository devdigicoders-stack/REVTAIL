"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Invitation = {
  invitationId: number;
  invitedAt: string;
  campaign: {
    id: number;
    campaignCode: string;
    productName: string;
    productImage: string | null;
    earningAmount: number;
    currency: string;
    availableSlots: number | null;
    status: string;
    brandName: string;
    category: string | null;
  };
  application: {
    id: number;
    status: string;
    appliedAt: string;
  } | null;
};

type Pagination = {
  page: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export default function TesterInvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
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

  const loadInvitations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/tester/invitations?page=${page}&limit=10`, {
        credentials: "include",
        cache: "no-store",
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load invitations.");
      }

      setInvitations(result.data ?? []);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load invitations.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  return (
    <>
      <div className="col-12">
        <h3 className="fw-bold mb-1">Campaign Invitations</h3>
        <div className="text-muted">
          Campaigns that Admin has invited you to review and apply for.
        </div>
      </div>

      {error && <div className="col-12"><div className="alert alert-danger">{error}</div></div>}

      {loading ? (
        <div className="col-12 text-center py-5"><div className="spinner-border text-primary" /></div>
      ) : invitations.length === 0 ? (
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center text-muted py-5">No campaign invitations are available.</div>
          </div>
        </div>
      ) : (
        invitations.map((invitation) => (
          <div className="col-lg-6" key={invitation.invitationId}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex gap-3">
                  {invitation.campaign.productImage && (
                    <img
                      src={invitation.campaign.productImage}
                      alt={invitation.campaign.productName}
                      className="rounded border"
                      style={{ width: 85, height: 85, objectFit: "cover" }}
                    />
                  )}

                  <div className="flex-grow-1">
                    <h5 className="fw-bold mb-1">{invitation.campaign.productName}</h5>
                    <div className="text-muted">{invitation.campaign.brandName}</div>
                    <small className="text-muted">{invitation.campaign.campaignCode}</small>
                  </div>
                </div>

                <hr />

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <small className="text-muted">Category</small>
                    <div className="fw-semibold">{invitation.campaign.category || "-"}</div>
                  </div>
                  <div className="col-6">
                    <small className="text-muted">Earning</small>
                    <div className="fw-semibold">₹{Number(invitation.campaign.earningAmount).toLocaleString("en-IN")}</div>
                  </div>
                  <div className="col-6">
                    <small className="text-muted">Available Slots</small>
                    <div className="fw-semibold">{invitation.campaign.availableSlots ?? 0}</div>
                  </div>
                  <div className="col-6">
                    <small className="text-muted">Invited</small>
                    <div className="fw-semibold">{new Date(invitation.invitedAt).toLocaleDateString("en-IN")}</div>
                  </div>
                </div>

                {invitation.application ? (
                  <div className="alert alert-info mb-0">
                    Your normal campaign request has already been submitted.
                    <strong className="ms-1">{invitation.application.status}</strong>
                  </div>
                ) : invitation.campaign.status !== "LIVE" ? (
                  <div className="alert alert-secondary mb-0">This campaign is no longer LIVE.</div>
                ) : (
                  <Link
                    href={`/tester/campaigns/live/${invitation.campaign.id}`}
                    className="btn btn-primary"
                  >
                    <i className="bi bi-eye me-2" />View & Apply
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      {!loading && pagination.total > 0 && (
        <div className="col-12">
          <div className="d-flex justify-content-between border-top pt-3">
            <small className="text-muted">{pagination.total} invitation(s)</small>
            <div className="d-flex gap-2">
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
        </div>
      )}
    </>
  );
}
