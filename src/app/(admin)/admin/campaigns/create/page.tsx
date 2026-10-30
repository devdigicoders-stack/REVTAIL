import CreateCampaignPage from "@/app/components/CreateCampaignForm";

export default function AdminCreateCampaignPage() {
  return (
    <>
      <div className="col-12">

        <div className="mb-3">

          <h3 className="fw-bold mb-1">
            Create Campaign
          </h3>

          <p className="text-muted mb-0">
            Create a new campaign from the Admin dashboard.
          </p>

        </div>

      </div>

      <div className="col-12">

        <CreateCampaignPage
          mode="CREATE"
          role="ADMIN"
        />

      </div>
    </>
  );
}