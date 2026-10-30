import { notFound } from "next/navigation";

import TaskPageClient from "./TaskPageClient";

export default async function TesterTaskPage({
  params,
}: {
  params: Promise<{
    testerCampaignId: string;
    taskNumber: string;
  }>;
}) {
  const {
    testerCampaignId,
    taskNumber,
  } = await params;

  const parsedTesterCampaignId =
    Number(testerCampaignId);

  const parsedTaskNumber =
    Number(taskNumber);

  if (
    !Number.isInteger(
      parsedTesterCampaignId
    ) ||
    parsedTesterCampaignId <= 0
  ) {
    notFound();
  }

  if (
    !Number.isInteger(
      parsedTaskNumber
    ) ||
    ![1, 2, 3, 4].includes(
      parsedTaskNumber
    )
  ) {
    notFound();
  }

  return (
    <TaskPageClient
      testerCampaignId={
        parsedTesterCampaignId
      }
      taskNumber={
        parsedTaskNumber
      }
    />
  );
}