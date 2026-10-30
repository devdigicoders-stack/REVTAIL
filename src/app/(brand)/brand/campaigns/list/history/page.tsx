'use client';

import CampaignList, { Campaign } from "@/components/campaigns/CampaignList";



export default function CampaignPage() {
  
  return (
    <div className="container py-4">
       <CampaignList
        type="history"
        />
    </div>
  );
}