"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

type Props = {
  testerCampaignId:
    number;
};

export default function Task1Form({
  testerCampaignId,
}: Props) {
  const router =
    useRouter();

  const [
    orderId,
    setOrderId,
  ] =
    useState("");

  const [
    purchaseAmount,
    setPurchaseAmount,
  ] =
    useState("");

  const [
    proofImage,
    setProofImage,
  ] =
    useState<File | null>(
      null
    );

  const [
    preview,
    setPreview,
  ] =
    useState<string | null>(
      null
    );

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  // ============================================================
  // CLEAN PREVIEW URL
  // ============================================================

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(
          preview
        );
      }
    };
  }, [preview]);

  // ============================================================
  // IMAGE
  // ============================================================

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target
        .files?.[0];

    if (!file) {
      return;
    }

    if (preview) {
      URL.revokeObjectURL(
        preview
      );
    }

    setProofImage(
      file
    );

    setPreview(
      URL.createObjectURL(
        file
      )
    );
  }

  // ============================================================
  // SUBMIT
  // ============================================================

  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault();

    setError("");

    // Additional protection

    if (
      !Number.isInteger(
        testerCampaignId
      ) ||
      testerCampaignId <= 0
    ) {
      setError(
        "Invalid tester campaign."
      );

      return;
    }

    if (
      !orderId.trim()
    ) {
      setError(
        "Order ID is required."
      );

      return;
    }

    const amount =
      Number(
        purchaseAmount
      );

    if (
      !Number.isFinite(
        amount
      ) ||
      amount <= 0
    ) {
      setError(
        "Enter a valid purchase amount."
      );

      return;
    }

    if (!proofImage) {
      setError(
        "Purchase proof image is required."
      );

      return;
    }

    try {
      setSubmitting(
        true
      );

      const formData =
        new FormData();

      formData.append(
        "orderId",
        orderId.trim()
      );

      formData.append(
        "purchaseAmount",
        purchaseAmount
      );

      formData.append(
        "proofImage",
        proofImage
      );

      // IMPORTANT:
      // This is always Task 1.

      const endpoint =
        `/api/tester/campaigns/ongoing/${testerCampaignId}/tasks/1/submit`;

      console.log(
        "TASK 1 SUBMIT:",
        endpoint
      );

      const response =
        await fetch(
          endpoint,
          {
            method:
              "POST",

            body:
              formData,
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to submit Task 1."
        );
      }

      router.push(
        `/tester/campaigns/ongoing/${testerCampaignId}`
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit Task 1."
      );
    } finally {
      setSubmitting(
        false
      );
    }
  }

  return (
    <form
      onSubmit={
        handleSubmit
      }
    >

      <div className="card border-0 shadow-sm">

        <div className="card-header bg-white border-0 pt-4 px-4">

          <h5 className="fw-bold mb-1">
            Task 1 — Buy Product
          </h5>

          <p className="text-muted small mb-0">
            Purchase the product and submit
            your order details and proof.
          </p>

        </div>

        <div className="card-body px-4">

          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          <div className="row g-3">

            <div className="col-md-6">

              <label className="form-label fw-semibold">
                Order ID
              </label>

              <input
                type="text"
                className="form-control"
                value={
                  orderId
                }
                onChange={(e) =>
                  setOrderId(
                    e.target.value
                  )
                }
                required
              />

            </div>

            <div className="col-md-6">

              <label className="form-label fw-semibold">
                Purchase Amount
              </label>

              <div className="input-group">

                <span className="input-group-text">
                  ₹
                </span>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="form-control"
                  value={
                    purchaseAmount
                  }
                  onChange={(e) =>
                    setPurchaseAmount(
                      e.target.value
                    )
                  }
                  required
                />

              </div>

            </div>

            <div className="col-12">

              <label className="form-label fw-semibold">
                Purchase Proof
              </label>

              <input
                type="file"
                className="form-control"
                accept="image/jpeg,image/png,image/webp"
                onChange={
                  handleImageChange
                }
                required
              />

            </div>

            {preview && (

              <div className="col-12">

                <img
                  src={
                    preview
                  }
                  alt="Purchase proof"
                  className="img-fluid rounded border"
                  style={{
                    maxHeight:
                      "350px",
                  }}
                />

              </div>

            )}

          </div>

        </div>

        <div className="card-footer bg-white border-0 px-4 pb-4">

          <button
            type="submit"
            className="btn btn-primary"
            disabled={
              submitting
            }
          >
            {submitting
              ? "Submitting..."
              : "Submit Task 1"}
          </button>

        </div>

      </div>

    </form>
  );
}