import CreateCampaignPage from "@/app/components/CreateCampaignForm";

export default function BrandCreateCampaignPage() {
  return (
    <div>
      <h1>Create New Campaign</h1>
      <CreateCampaignPage  mode="CREATE" role="BRAND"/>
    </div>
  );
}