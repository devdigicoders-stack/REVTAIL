"use client";

import Link from "next/link";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  useEffect,
  useState,
} from "react";

type Brand = {
  id: number;

  userId: number;

  companyName: string;

  companyType: string;

  category:
    | string
    | null;

  categoryId:
    | number
    | null;

  categoryDetails:
    | {
        id: number;
        name: string;
      }
    | null;

  website:
    | string
    | null;

  pocFullName:
    | string
    | null;

  pocMobile:
    | string
    | null;

  designation:
    | string
    | null;

  approvalStatus: string;

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

  campaignCount: number;

  campaigns: {
    id: number;

    campaignCode: string;

    productName: string;

    status: string;

    totalSlots: number;

    filledSlots: number;

    availableSlots:
      | number
      | null;

    earningAmount:
      | string
      | number;
  }[];
};

export default function AdminBrandDetailsPage() {
  const params =
    useParams();

  const router =
    useRouter();

  const id =
    Array.isArray(
      params.id
    )
      ? params.id[0]
      : params.id;

  const [
    brand,
    setBrand,
  ] =
    useState<Brand | null>(
      null
    );

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
    processing,
    setProcessing,
  ] =
    useState(false);

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
  // LOAD
  // ==========================================================

  useEffect(() => {
    if (!id) {
      return;
    }

    const loadBrand =
      async () => {
        try {
          setLoading(true);

          setError("");

          const response =
            await fetch(
              `/api/admin/brands/${id}`,
              {
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
                "Unable to load Brand."
            );
          }

          setBrand(
            result.data
          );
        } catch (err) {
          setError(
            err instanceof
              Error
              ? err.message
              : "Unable to load Brand."
          );
        } finally {
          setLoading(
            false
          );
        }
      };

    loadBrand();
  }, [id]);

  // ==========================================================
  // STATUS
  // ==========================================================

  const changeStatus =
    async (
      action:
        | "APPROVE"
        | "REJECT"
    ) => {
      try {
        setProcessing(
          true
        );

        setError("");

        const response =
          await fetch(
            `/api/admin/brands/${id}/status`,
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
                      ? rejectionReason
                      : undefined,
                }),
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Unable to update Brand."
          );
        }

        window.alert(
          result.message
        );

        router.push(
          "/admin/brands"
        );

        router.refresh();
      } catch (err) {
        setError(
          err instanceof
            Error
            ? err.message
            : "Unable to update Brand."
        );
      } finally {
        setProcessing(
          false
        );
      }
    };

  if (loading) {
    return (
      <div className="col-12 text-center py-5">

        <div className="spinner-border text-primary" />

        <p className="mt-3 text-muted">
          Loading Brand details...
        </p>

      </div>
    );
  }

  if (!brand) {
    return (
      <div className="col-12">

        <div className="alert alert-danger">

          {error ||
            "Brand not found."}

        </div>

      </div>
    );
  }

  return (
    <>
      {/* HEADER */}

      <div className="col-12">

        <Link
          href="/admin/brands"
          className="text-muted text-decoration-none"
        >

          <i className="bi bi-arrow-left me-2" />

          Brands

        </Link>

        <div className="d-flex justify-content-between align-items-start mt-3">

          <div>

            <h4 className="fw-bold mb-1">

              {
                brand.companyName
              }

            </h4>

            <p className="text-muted mb-0">

              Brand registration details

            </p>

          </div>

          <span className="badge bg-warning-subtle text-warning-emphasis fs-6">

            {
              brand.approvalStatus
            }

          </span>

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

      {/* COMPANY */}

      <div className="col-lg-6">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-body p-4">

            <h5 className="fw-bold mb-4">
              Company Details
            </h5>

            <Detail
              label="Company Name"
              value={
                brand.companyName
              }
            />

            <Detail
              label="Company Type"
              value={
                brand.companyType
              }
            />

            <Detail
              label="Category"
              value={
                brand.category ??
                "-"
              }
            />

            <Detail
              label="Website"
              value={
                brand.website ??
                "-"
              }
            />

            <Detail
              label="Total Campaigns"
              value={String(
                brand.campaignCount
              )}
            />

          </div>

        </div>

      </div>

      {/* CONTACT */}

      <div className="col-lg-6">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-body p-4">

            <h5 className="fw-bold mb-4">
              Contact Details
            </h5>

            <Detail
              label="Contact Person"
              value={
                brand.pocFullName ??
                "-"
              }
            />

            <Detail
              label="Designation"
              value={
                brand.designation ??
                "-"
              }
            />

            <Detail
              label="POC Mobile"
              value={
                brand.pocMobile ??
                "-"
              }
            />

            <Detail
              label="Login Email"
              value={
                brand.user.email ??
                "-"
              }
            />

            <Detail
              label="User Status"
              value={
                brand.user.status
              }
            />

          </div>

        </div>

      </div>

      {/* RECENT CAMPAIGNS */}

      {brand.campaigns.length >
        0 && (

        <div className="col-12">

          <div className="card border-0 shadow-sm">

            <div className="card-header bg-white border-0 pt-4 px-4">

              <h5 className="fw-bold">
                Recent Campaigns
              </h5>

            </div>

            <div className="card-body">

              <div className="table-responsive">

                <table className="table align-middle">

                  <thead>

                    <tr>

                      <th>
                        Code
                      </th>

                      <th>
                        Product
                      </th>

                      <th>
                        Earning
                      </th>

                      <th>
                        Slots
                      </th>

                      <th>
                        Status
                      </th>
                      <th className="text-end">
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {brand.campaigns.map(
                      (
                        campaign
                      ) => (

                        <tr
                          key={
                            campaign.id
                          }
                        >

                          <td>

                            {
                              campaign.campaignCode
                            }

                          </td>

                          <td>

                            {
                              campaign.productName
                            }

                          </td>

                          <td>

                            ₹
                            {Number(
                              campaign.earningAmount
                            ).toLocaleString(
                              "en-IN"
                            )}

                          </td>

                          <td>

                            {
                              campaign.availableSlots ??
                              campaign.totalSlots -
                                campaign.filledSlots
                            }

                          </td>

                          <td>

                            <span className="badge bg-light text-dark border">

                              {
                                campaign.status
                              }

                            </span>

                          </td>
                          <td className="text-end">

                            <Link
                              href={`/admin/campaigns/${campaign.id}`}
                              className="btn btn-sm btn-outline-primary"
                            >
                               <i className="bi bi-eye me-1" />
                              View
                            </Link>
                            </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* REJECTION INFO */}

      {brand.approvalStatus ===
        "REJECTED" &&
        brand.rejectionReason && (

        <div className="col-12">

          <div className="alert alert-danger">

            <strong>
              Rejection Reason:
            </strong>{" "}

            {
              brand.rejectionReason
            }

          </div>

        </div>

      )}

      {/* ACTION */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body d-flex justify-content-between">

            <Link
              href="/admin/brands"
              className="btn btn-outline-secondary"
            >

              Back

            </Link>

            {brand.approvalStatus ===
              "PENDING" && (

              <div className="d-flex gap-2">

                <button
                  type="button"
                  className="btn btn-outline-danger"
                  disabled={
                    processing
                  }
                  onClick={() =>
                    setShowRejectModal(
                      true
                    )
                  }
                >

                  Reject

                </button>

                <button
                  type="button"
                  className="btn btn-success"
                  disabled={
                    processing
                  }
                  onClick={() => {

                    if (
                      window.confirm(
                        `Approve ${brand.companyName}? An approval email will be sent to ${brand.user.email ?? "the Brand"}.`
                      )
                    ) {
                      changeStatus(
                        "APPROVE"
                      );
                    }
                  }}
                >

                  <i className="bi bi-check-circle me-2" />

                  Approve Brand

                </button>

              </div>

            )}

          </div>

        </div>

      </div>

      {/* REJECT MODAL */}

      {showRejectModal && (

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
        >

          <div className="modal-dialog modal-dialog-centered">

            <div className="modal-content">

              <div className="modal-header">

                <h5 className="modal-title">
                  Reject Brand
                </h5>

                <button
                  type="button"
                  className="btn-close"
                  disabled={
                    processing
                  }
                  onClick={() =>
                    setShowRejectModal(
                      false
                    )
                  }
                />

              </div>

              <div className="modal-body">

                <label className="form-label fw-semibold">

                  Rejection Reason

                </label>

                <textarea
                  rows={4}
                  className="form-control"
                  value={
                    rejectionReason
                  }
                  onChange={(e) =>
                    setRejectionReason(
                      e.target.value
                    )
                  }
                />

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="btn btn-light"
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
                    processing ||
                    !rejectionReason.trim()
                  }
                  onClick={() =>
                    changeStatus(
                      "REJECT"
                    )
                  }
                >

                  {processing
                    ? "Processing..."
                    : "Reject Brand"}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}
    </>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div className="mb-3">

      <div className="text-muted small">
        {label}
      </div>

      <div className="fw-semibold text-break">
        {value}
      </div>

    </div>
  );
}