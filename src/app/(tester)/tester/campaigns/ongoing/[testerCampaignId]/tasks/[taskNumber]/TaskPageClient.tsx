"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import Task1Form from "./Task1Form";
import Task2Form from "./Task2Form";
import Task3Form from "./Task3Form";
import Task4Form from "./Task4Form";

type TaskStatus =
  | "LOCKED"
  | "AVAILABLE"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED";

type TaskData = {
  id: number;

  taskNumber: number;

  title: string;

  status: TaskStatus;

  canSubmit: boolean;

  rejectionReason:
    | string
    | null;

  waitingForApproval:
    boolean;
};

type CampaignData = {
  id: number;

  productName: string;

  productImage:
    | string
    | null;

  brandName:
    | string
    | null;
};

type ProgressResponse = {
  success: boolean;
  message: string;

  data?: {
    testerCampaignId: number;

    campaign:
      CampaignData;

    currentTaskNumber:
      number;

    tasks:
      TaskData[];
  };
};

type Props = {
  testerCampaignId:
    number;

  taskNumber:
    number;
};

export default function TaskPageClient({
  testerCampaignId,
  taskNumber,
}: Props) {
  const [
    task,
    setTask,
  ] =
    useState<TaskData | null>(
      null
    );

  const [
    campaign,
    setCampaign,
  ] =
    useState<CampaignData | null>(
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

  // ============================================================
  // LOAD TASK
  // ============================================================

  useEffect(() => {
    async function loadTask() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `/api/tester/campaigns/ongoing/${testerCampaignId}/progress`,
            {
              method:
                "GET",

              cache:
                "no-store",
            }
          );

        const result =
          (await response.json()) as
            ProgressResponse;

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Unable to load task."
          );
        }

        const selectedTask =
          result.data
            ?.tasks.find(
              (item) =>
                item.taskNumber ===
                taskNumber
            ) ??
          null;

        if (!selectedTask) {
          throw new Error(
            `Task ${taskNumber} not found.`
          );
        }

        setTask(
          selectedTask
        );

        setCampaign(
          result.data
            ?.campaign ??
            null
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load task."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTask();
  }, [
    testerCampaignId,
    taskNumber,
  ]);

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="col-12 text-center py-5">

        <div className="spinner-border text-primary" />

        <div className="text-muted mt-3">
          Loading Task{" "}
          {taskNumber}...
        </div>

      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (
    error ||
    !task
  ) {
    return (
      <div className="col-12">

        <div className="alert alert-danger">
          {error ||
            "Task not found."}
        </div>

        <Link
          href={`/tester/campaigns/ongoing/${testerCampaignId}`}
          className="btn btn-outline-primary"
        >
          Back to Campaign
        </Link>

      </div>
    );
  }

  return (
    <>
      {/* ======================================================
          BACK
      ====================================================== */}

      <div className="col-12">

        <Link
          href={`/tester/campaigns/ongoing/${testerCampaignId}`}
          className="text-decoration-none small"
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back to Campaign
        </Link>

      </div>

      {/* ======================================================
          CAMPAIGN
      ====================================================== */}

      {campaign && (

        <div className="col-12">

          <div className="card border-0 shadow-sm">

            <div className="card-body">

              <div className="text-primary small fw-bold text-uppercase">

                {
                  campaign.brandName ??
                  "Brand"
                }

              </div>

              <h4 className="fw-bold mb-0">

                {
                  campaign.productName
                }

              </h4>

            </div>

          </div>

        </div>

      )}

      {/* ======================================================
          LOCKED
      ====================================================== */}

      {task.status ===
        "LOCKED" && (

        <div className="col-12">

          <div className="alert alert-secondary mb-0">

            <i className="bi bi-lock me-2"></i>

            This task is locked.
            Complete the previous task first.

          </div>

        </div>

      )}

      {/* ======================================================
          SUBMITTED
      ====================================================== */}

      {task.status ===
        "SUBMITTED" && (

        <div className="col-12">

          <div className="alert alert-warning mb-0">

            <i className="bi bi-clock me-2"></i>

            Task{" "}
            {
              task.taskNumber
            }{" "}
            has already been submitted
            and is waiting for review.

          </div>

        </div>

      )}

      {/* ======================================================
          APPROVED
      ====================================================== */}

      {task.status ===
        "APPROVED" && (

        <div className="col-12">

          <div className="alert alert-success mb-0">

            <i className="bi bi-check-circle me-2"></i>

            Task{" "}
            {
              task.taskNumber
            }{" "}
            has already been approved.

          </div>

        </div>

      )}

      {/* ======================================================
          REJECTED
      ====================================================== */}

      {task.status ===
        "REJECTED" && (

        <div className="col-12">

          <div className="alert alert-danger mb-0">

            <strong>
              Submission rejected
            </strong>

            <div className="mt-1">

              {
                task.rejectionReason ||
                "Please correct your submission and submit it again."
              }

            </div>

          </div>

        </div>

      )}

      {/* ======================================================
          TASK 1
      ====================================================== */}

      {task.canSubmit &&
        task.taskNumber ===
          1 && (

        <div className="col-12">

          <Task1Form
            testerCampaignId={
              testerCampaignId
            }
          />

        </div>

      )}

      {/* ======================================================
          TASK 2
      ====================================================== */}

      {task.canSubmit &&
        task.taskNumber ===
          2 && (

        <div className="col-12">

          <Task2Form
            testerCampaignId={
              testerCampaignId
            }
          />

        </div>

      )}
      
    {/* ======================================================
          TASK 3    
      ====================================================== */}

    {task.canSubmit &&
    task.taskNumber === 3 && (

    <div className="col-12">

        <Task3Form
        testerCampaignId={
            testerCampaignId
        }
        />

    </div>

    )}

  {/* ======================================================
          TASK 4    
      ====================================================== */}

    {task.canSubmit &&
      task.taskNumber === 4 && (

      <div className="col-12">

        <Task4Form
          testerCampaignId={
            testerCampaignId
          }
        />

      </div>

    )}

    {/* ======================================================
          FUTURE TASKS
      ====================================================== */}

    {task.canSubmit &&
      ![1, 2, 3, 4].includes(
        task.taskNumber
      ) && (

      <div className="col-12">

        <div className="alert alert-info">
          Task {task.taskNumber} form has not been implemented yet.
        </div>

      </div>

    )}
    </>
  );
}