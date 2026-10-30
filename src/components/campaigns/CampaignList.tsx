'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import Link from 'next/link';

import * as XLSX from 'xlsx';

// ============================================================
// TYPES
// ============================================================

export type CampaignListType =
  | 'active'
  | 'history';

export type UserRole =
  | 'ADMIN'
  | 'BRAND';

export type Campaign = {
  id: number;

  campaignCode: string;

  productName: string;

  brandName: string;
  brandId: number;

  earning: number;
  currency: string;

  slots: number;
  filledSlots: number;
  availableSlots: number;

  startDate: string | null;
  endDate: string | null;

  status: string;
};

type CampaignListApiResponse = {
  success: boolean;

  role?: UserRole;

  type?: CampaignListType;

  count?: number;

  data?: Campaign[];

  message?: string;
};

// ============================================================
// PROPS
// ============================================================

interface CampaignListProps {
  type: CampaignListType;

  onEditCampaign?: (
    campaign: Campaign
  ) => void;

  onDeactivateCampaign?: (
    campaignId: number
  ) => void;
}

// ============================================================
// COMPONENT
// ============================================================

export default function CampaignList({
  type,
  onEditCampaign,
  onDeactivateCampaign,
}: CampaignListProps) {
  // ==========================================================
  // STATE
  // ==========================================================

  const [
    campaigns,
    setCampaigns,
  ] = useState<Campaign[]>([]);

  const [
    role,
    setRole,
  ] = useState<UserRole | null>(
    null
  );

  const [
    searchTerm,
    setSearchTerm,
  ] = useState('');

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const itemsPerPage = 5;

  // ==========================================================
  // LOAD CAMPAIGNS
  // ==========================================================

  useEffect(() => {
    const fetchCampaigns =
      async () => {
        try {
          setLoading(true);

          setError('');

          const response =
            await fetch(
              `/api/campaigns/list?type=${type}`,
              {
                method: 'GET',
                cache: 'no-store',
              }
            );

          const result: CampaignListApiResponse =
            await response.json();

          if (
            !response.ok ||
            !result.success
          ) {
            throw new Error(
              result.message ||
                'Failed to fetch campaigns.'
            );
          }

          setCampaigns(
            result.data ?? []
          );

          setRole(
            result.role ?? null
          );

          setCurrentPage(1);
        } catch (err) {
          console.error(
            'Campaign list error:',
            err
          );

          setCampaigns([]);

          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load campaigns.'
          );
        } finally {
          setLoading(false);
        }
      };

    fetchCampaigns();
  }, [type]);

  // ==========================================================
  // SEARCH FILTER
  // ==========================================================

  const filteredCampaigns =
    useMemo(() => {
      const search =
        searchTerm
          .trim()
          .toLowerCase();

      if (!search) {
        return campaigns;
      }

      return campaigns.filter(
        (campaign) => {
          return (
            campaign.campaignCode
              .toLowerCase()
              .includes(search) ||
            campaign.productName
              .toLowerCase()
              .includes(search) ||
            campaign.brandName
              .toLowerCase()
              .includes(search) ||
            campaign.status
              .toLowerCase()
              .includes(search)
          );
        }
      );
    }, [
      campaigns,
      searchTerm,
    ]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalPages =
    Math.ceil(
      filteredCampaigns.length /
        itemsPerPage
    ) || 1;

  const paginatedCampaigns =
    useMemo(() => {
      const start =
        (currentPage - 1) *
        itemsPerPage;

      return filteredCampaigns.slice(
        start,
        start + itemsPerPage
      );
    }, [
      filteredCampaigns,
      currentPage,
    ]);

  // ==========================================================
  // SEARCH
  // ==========================================================

  const handleSearch = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSearchTerm(
      e.target.value
    );

    setCurrentPage(1);
  };

  // ==========================================================
  // DEACTIVATE
  // ==========================================================

  const handleDeactivate = (
    campaignId: number
  ) => {
    if (
      !onDeactivateCampaign
    ) {
      return;
    }

    onDeactivateCampaign(
      campaignId
    );
  };

  // ==========================================================
  // EXPORT
  // ==========================================================

  const handleExportToExcel =
    () => {
      if (
        filteredCampaigns.length ===
        0
      ) {
        return;
      }

      const exportData =
        filteredCampaigns.map(
          (campaign) => ({
            'Campaign ID':
              campaign.campaignCode,

            'Product Name':
              campaign.productName,

            'Brand Name':
              campaign.brandName,

            'Earning (₹)':
              campaign.earning,

            'Total Slots':
              campaign.slots,

            'Filled Slots':
              campaign.filledSlots,

            'Available Slots':
              campaign.availableSlots,

            'Start Date':
              campaign.startDate ??
              '',

            'End Date':
              campaign.endDate ??
              '',

            Status:
              campaign.status,
          })
        );

      const worksheet =
        XLSX.utils.json_to_sheet(
          exportData
        );

      const workbook =
        XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        'Campaigns'
      );

      XLSX.writeFile(
        workbook,
        `${
          role ?? 'campaign'
        }_${type}_Campaigns_${
          new Date()
            .toISOString()
            .slice(0, 10)
        }.xlsx`
      );
    };

  // ==========================================================
  // STATUS BADGE
  // ==========================================================

  const getStatusBadgeClass = (
    status: string
  ) => {
    switch (
      status.toUpperCase()
    ) {
      case 'LIVE':
        return 'bg-success';

      case 'APPROVED':
        return 'bg-primary';

      case 'SUBMITTED':
        return 'bg-warning text-dark';

      case 'COMPLETED':
        return 'bg-info text-dark';

      case 'REJECTED':
        return 'bg-danger';

      case 'CANCELLED':
        return 'bg-dark';

      case 'DEACTIVATED':
        return 'bg-secondary';

      default:
        return 'bg-secondary';
    }
  };

  // ==========================================================
  // PAGE TITLE
  // ==========================================================

  const pageTitle =
    type === 'active'
      ? 'Active Campaigns'
      : 'Campaign History';

  const pageDescription =
    type === 'active'
      ? role === 'ADMIN'
        ? 'View and manage active campaigns across all brands.'
        : 'View your submitted, approved and live campaigns.'
      : role === 'ADMIN'
      ? 'View completed, rejected, cancelled and deactivated campaigns.'
      : 'View your completed, rejected, cancelled and previous campaigns.';

  // ==========================================================
  // RETURN
  // ==========================================================

  return (
    <div className="w-100">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">

        <div>

          <h4 className="fw-bold mb-1">
            {pageTitle}
          </h4>

          <p className="text-muted small mb-0">
            {pageDescription}
          </p>

        </div>

        {/* <button
          type="button"
          className="btn btn-outline-success btn-sm"
          onClick={
            handleExportToExcel
          }
          disabled={
            loading ||
            filteredCampaigns.length ===
              0
          }
        >
          <i className="bi bi-file-earmark-excel me-1"></i>

          Export to Excel
        </button> */}

      </div>

      {/* ====================================================
          SEARCH
      ==================================================== */}

      <div className="card border-0 shadow-sm p-3 mb-4">

        <div className="row">

          <div className="col-md-6">

            <div className="input-group">

              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search"></i>
              </span>

              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by Campaign ID, Product, Brand or Status..."
                value={
                  searchTerm
                }
                onChange={
                  handleSearch
                }
                disabled={
                  loading
                }
              />

            </div>

          </div>

        </div>

      </div>

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* ====================================================
          TABLE
      ==================================================== */}

      <div className="card border-0 shadow-sm">

        <div className="table-responsive">

          <table className="table table-hover align-middle mb-0">

            <thead className="table-light">

              <tr>

                <th>
                  Campaign ID
                </th>

                <th>
                  Product Name
                </th>

                {role ===
                  'ADMIN' && (
                  <th>
                    Brand Name
                  </th>
                )}

                <th>
                  Earning
                </th>

                <th>
                  Slots
                </th>

                <th>
                  Duration
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

              {/* ==============================================
                  LOADING
              ============================================== */}

              {loading ? (

                <tr>

                  <td
                    colSpan={
                      role ===
                      'ADMIN'
                        ? 8
                        : 7
                    }
                    className="text-center py-5"
                  >

                    <div
                      className="spinner-border spinner-border-sm text-primary me-2"
                      role="status"
                    />

                    Loading campaigns...

                  </td>

                </tr>

              ) : paginatedCampaigns.length >
                0 ? (

                paginatedCampaigns.map(
                  (campaign) => (

                    <tr
                      key={
                        campaign.id
                      }
                    >

                      <td className="fw-bold text-secondary">
                        {
                          campaign.campaignCode
                        }
                      </td>

                      <td className="fw-semibold">
                        {
                          campaign.productName
                        }
                      </td>

                      {role ===
                        'ADMIN' && (
                        <td>
                          {
                            campaign.brandName
                          }
                        </td>
                      )}

                      <td>
                        ₹
                        {campaign.earning.toLocaleString(
                          'en-IN'
                        )}
                      </td>

                      <td>
                        {
                          campaign.slots
                        }
                      </td>

                      <td className="small text-muted">

                        {campaign.startDate ??
                          '-'}

                        {' to '}

                        {campaign.endDate ??
                          '-'}

                      </td>

                      <td>

                        <span
                          className={`badge ${getStatusBadgeClass(
                            campaign.status
                          )}`}
                        >
                          {
                            campaign.status
                          }
                        </span>

                      </td>

                      <td className="text-end">

                        <div
                          className="btn-group btn-group-sm"
                          role="group"
                        >

                          {/* ==================================
                              VIEW
                          ================================== */}

                          <Link
                            href={
                              role ===
                              'ADMIN'
                                ? `/admin/campaigns/${campaign.id}`
                                : `/brand/campaigns/${campaign.id}`
                            }
                            className="btn btn-outline-primary"
                          >
                            <i className="bi bi-eye me-1"></i>
                            View
                          </Link>

                          {/* ==================================
                              ADMIN ACTIVE CAMPAIGN CONTROLS
                          ================================== */}

                          {role ===
                            'ADMIN' &&
                            type ===
                              'active' && (
                              <>

                                {onEditCampaign && (
                                  <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() =>
                                      onEditCampaign(
                                        campaign
                                      )
                                    }
                                  >
                                    Edit
                                  </button>
                                )}

                                {onDeactivateCampaign &&
                                  campaign.status !==
                                    'DEACTIVATED' && (
                                    <button
                                      type="button"
                                      className="btn btn-outline-danger"
                                      onClick={() =>
                                        handleDeactivate(
                                          campaign.id
                                        )
                                      }
                                    >
                                      Deactivate
                                    </button>
                                  )}

                              </>
                            )}

                        </div>

                      </td>

                    </tr>

                  )
                )

              ) : (

                <tr>

                  <td
                    colSpan={
                      role ===
                      'ADMIN'
                        ? 8
                        : 7
                    }
                    className="text-center py-5 text-muted"
                  >

                    {type ===
                    'active'
                      ? 'No active campaigns found.'
                      : 'No campaign history found.'}

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

        {/* ==================================================
            PAGINATION
        ================================================== */}

        {!loading &&
          !error && (
            <div className="card-footer bg-white border-top d-flex justify-content-between align-items-center py-3">

              <span className="small text-muted">

                Showing Page{' '}
                {currentPage} of{' '}
                {totalPages}

              </span>

              <nav>

                <ul className="pagination pagination-sm mb-0">

                  <li
                    className={`page-item ${
                      currentPage ===
                      1
                        ? 'disabled'
                        : ''
                    }`}
                  >

                    <button
                      type="button"
                      className="page-link"
                      onClick={() =>
                        setCurrentPage(
                          (
                            prev
                          ) =>
                            Math.max(
                              prev -
                                1,
                              1
                            )
                        )
                      }
                    >
                      Previous
                    </button>

                  </li>

                  {Array.from(
                    {
                      length:
                        totalPages,
                    },
                    (
                      _,
                      index
                    ) =>
                      index +
                      1
                  ).map(
                    (page) => (

                      <li
                        key={
                          page
                        }
                        className={`page-item ${
                          currentPage ===
                          page
                            ? 'active'
                            : ''
                        }`}
                      >

                        <button
                          type="button"
                          className="page-link"
                          onClick={() =>
                            setCurrentPage(
                              page
                            )
                          }
                        >
                          {
                            page
                          }
                        </button>

                      </li>

                    )
                  )}

                  <li
                    className={`page-item ${
                      currentPage ===
                      totalPages
                        ? 'disabled'
                        : ''
                    }`}
                  >

                    <button
                      type="button"
                      className="page-link"
                      onClick={() =>
                        setCurrentPage(
                          (
                            prev
                          ) =>
                            Math.min(
                              prev +
                                1,
                              totalPages
                            )
                        )
                      }
                    >
                      Next
                    </button>

                  </li>

                </ul>

              </nav>

            </div>
          )}

      </div>

    </div>
  );
}