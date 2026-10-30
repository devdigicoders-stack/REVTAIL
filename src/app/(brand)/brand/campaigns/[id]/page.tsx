import CampaignDetails from '@/components/campaigns/CampaignDetails';
import Link from 'next/link';

type CampaignDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BrandCampaignDetailsPage({
  params,
}: CampaignDetailsPageProps) {
  // ============================================================
  // GET CAMPAIGN ID FROM DYNAMIC ROUTE
  // ============================================================

  const { id } = await params;

  const campaignId = Number(id);

  // ============================================================
  // INVALID CAMPAIGN ID
  // ============================================================

  if (
    !Number.isInteger(campaignId) ||
    campaignId <= 0
  ) {
    return (
      <div className="container-fluid py-4">
        <div
          className="alert alert-danger shadow-sm"
          role="alert"
        >
          <h5 className="alert-heading fw-bold">
            Invalid Campaign
          </h5>

          <p className="mb-0">
            The campaign ID provided in the URL is invalid.
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="container-fluid py-4">

      {/* ========================================================
          PAGE HEADER
      ======================================================== */}

      <div className="mb-4">

        <div className="d-flex align-items-center gap-2 mb-1">

          <i className="bi bi-megaphone text-primary fs-4"></i>

          <h3 className="fw-bold mb-0">
            Campaign Information
          </h3>

        </div>

        <p className="text-muted mb-0">
          View complete campaign details, product information,
          targeting, questions and approval status.
        </p>   

      </div>

      {/* ========================================================
          CAMPAIGN DETAILS COMPONENT
      ======================================================== */}

      <CampaignDetails
        campaignId={campaignId}
        backUrl="/brand/campaigns/list"
      />

    </div>
  );
}