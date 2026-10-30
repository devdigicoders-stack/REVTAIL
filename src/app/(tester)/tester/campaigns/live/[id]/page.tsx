import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/current-user";
import LiveCampaignDetails from "./LiveCampaignDetails";

// ============================================================
// PAGE
// ============================================================

export default async function TesterLiveCampaignDetailsPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  // ==========================================================
  // 1. GET CURRENT USER
  // ==========================================================

  const currentUser =
    await getCurrentUser();

  // ==========================================================
  // 2. AUTHENTICATION
  // ==========================================================

  if (!currentUser) {
    redirect("/login");
  }

  // ==========================================================
  // 3. TESTER ONLY
  // ==========================================================

  if (
    currentUser.role !== "TESTER"
  ) {
    if (
      currentUser.role === "ADMIN"
    ) {
      redirect("/admin");
    }

    if (
      currentUser.role === "BRAND"
    ) {
      redirect("/brand");
    }

    redirect("/login");
  }

  // ==========================================================
  // 4. CAMPAIGN ID
  // ==========================================================

  const { id } =
    await params;

  const campaignId =
    Number(id);

  if (
    !Number.isInteger(
      campaignId
    ) ||
    campaignId <= 0
  ) {
    redirect(
      "/tester/campaigns/live"
    );
  }

  // ==========================================================
  // 5. CLIENT COMPONENT
  // ==========================================================

  return (
    <LiveCampaignDetails
      campaignId={
        campaignId
      }
      userId={
        currentUser.userId
      }
    />
  );
}