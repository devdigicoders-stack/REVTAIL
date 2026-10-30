"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Invitation = {
  invitationId: number;
  campaign: {
    id: number;
    productName: string;
    earningAmount: number;
    brandName: string;
  };
  application: { id: number; status: string } | null;
};

export default function TesterInvitationWidget() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/tester/invitations?page=1&limit=5", {
          credentials: "include",
          cache: "no-store",
        });
        const result = await response.json();
        if (response.ok && result.success) setInvitations(result.data ?? []);
      } catch {
        // Do not break the dashboard if invitation widget fails.
      }
    };

    load();
  }, []);

  if (invitations.length === 0) return null;

  return (
    <div className="col-12">
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="fw-bold mb-1">Campaign Invitations</h5>
              <div className="small text-muted">Admin has invited you to these campaigns.</div>
            </div>
            <Link href="/tester/invitations" className="btn btn-sm btn-outline-primary">View All</Link>
          </div>

          <div className="row g-3">
            {invitations.map((invitation) => (
              <div className="col-md-6 col-xl-4" key={invitation.invitationId}>
                <div className="border rounded p-3 h-100">
                  <div className="fw-semibold">{invitation.campaign.productName}</div>
                  <div className="small text-muted mb-2">{invitation.campaign.brandName}</div>
                  <div className="mb-3">₹{Number(invitation.campaign.earningAmount).toLocaleString("en-IN")}</div>

                  {invitation.application ? (
                    <span className="badge bg-info text-dark">Request: {invitation.application.status}</span>
                  ) : (
                    <Link href={`/tester/campaigns/live/${invitation.campaign.id}`} className="btn btn-sm btn-primary">
                      View & Apply
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
