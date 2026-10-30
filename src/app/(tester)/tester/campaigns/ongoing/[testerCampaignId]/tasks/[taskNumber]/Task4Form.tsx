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
  testerCampaignId: number;
};

export default function Task4Form({
  testerCampaignId,
}: Props) {
  const router =
    useRouter();

  const [
    publishedUrl,
    setPublishedUrl,
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

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(
          preview
        );
      }
    };
  }, [preview]);

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

  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault();

    setError("");

    if (
      !publishedUrl.trim()
    ) {
      setError(
        "Published review URL is required."
      );

      return;
    }

    if (!proofImage) {
      setError(
        "Review proof image is required."
      );

      return;
    }

    try {
      setSubmitting(true);

      const formData =
        new FormData();

      formData.append(
        "publishedUrl",
        publishedUrl.trim()
      );

      formData.append(
        "proofImage",
        proofImage
      );

      const response =
        await fetch(
          `/api/tester/campaigns/ongoing/${testerCampaignId}/tasks/4/submit`,
          {
            method: "POST",
            body: formData,
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to submit Task 4."
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
          : "Unable to submit Task 4."
      );
    } finally {
      setSubmitting(false);
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
            Task 4 — Publish Review
          </h5>

          <p className="text-muted small mb-0">
            Publish your review on the required
            platform and submit the URL and proof.
          </p>

        </div>

        <div className="card-body px-4">

          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          <div className="mb-4">

            <label className="form-label fw-semibold">
              Published Review URL
            </label>

            <input
              type="url"
              className="form-control"
              value={
                publishedUrl
              }
              onChange={(event) =>
                setPublishedUrl(
                  event.target.value
                )
              }
              placeholder="https://..."
              required
            />

          </div>

          <div>

            <label className="form-label fw-semibold">
              Review Proof
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

            <div className="form-text">
              Upload a screenshot showing
              the published review.
            </div>

          </div>

          {preview && (

            <div className="mt-3">

              <img
                src={preview}
                alt="Published review proof"
                className="img-fluid rounded border"
                style={{
                  maxHeight:
                    "350px",
                }}
              />

            </div>

          )}

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
              : "Submit Task 4"}

          </button>

        </div>

      </div>
    </form>
  );
}