'use client';

import CampaignList, { Campaign } from "@/components/campaigns/CampaignList";



export default function CampaignPage() {
  const handleEdit = (campaign: Campaign) => {
    console.log('Edit Campaign trigger:', campaign);
    // Open edit modal or redirect to /dashboard/campaigns/edit/[id]
  };

  const handleDeactivate = (campaignId: number) => {
    console.log('Deactivated Campaign ID:', campaignId);
    // Perform API call to deactivate: await fetch(`/api/campaigns/${campaignId}/deactivate`, ...)
  };

  return (
    <div className="container py-4">
      <CampaignList
        type="active"
        onEditCampaign={handleEdit}
        onDeactivateCampaign={handleDeactivate}
      />
    </div>
  );
}