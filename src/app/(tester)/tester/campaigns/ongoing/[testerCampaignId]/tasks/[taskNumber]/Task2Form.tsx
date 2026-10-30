"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type Props = {
  testerCampaignId: number;
};

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function Task2Form({
  testerCampaignId,
}: Props) {
  const router = useRouter();

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [proofImage, setProofImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Both inputs use the same selected file and preview.
  useEffect(() => {
    if (!proofImage) {
      setPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(proofImage);
    setPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [proofImage]);

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    // Allow the same file to be selected again.
    input.value = "";

    if (!file) return;

    setError("");

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Please choose a JPG, PNG, or WEBP image.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError("The image must be 5 MB or smaller.");
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;

    setPreview(objectUrl);
    setProofImage(file);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    if (
      !Number.isInteger(testerCampaignId) ||
      testerCampaignId <= 0
    ) {
      setError("Invalid tester campaign.");
      return;
    }

    if (!proofImage) {
      setError(
        "Product received proof is required. Take a photo or choose an image from your files."
      );
      return;
    }

    // Recheck the image before sending it.
    if (!ALLOWED_IMAGE_TYPES.includes(proofImage.type)) {
      setError("Please choose a JPG, PNG, or WEBP image.");
      return;
    }

    if (proofImage.size > MAX_IMAGE_SIZE_BYTES) {
      setError("The image must be 5 MB or smaller.");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("proofImage", proofImage);

      const endpoint =
        `/api/tester/campaigns/ongoing/${testerCampaignId}/tasks/2/submit`;

      console.log("TASK 2 SUBMIT:", endpoint);

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to submit Task 2."
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
          : "Unable to submit Task 2."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 pt-4 px-3 px-sm-4">
          <h5 className="fw-bold mb-1">
            Task 2 — Product Received
          </h5>
          <p className="text-muted small mb-0">
            Take a photo of the received product or choose an existing image.
          </p>
        </div>

        <div className="card-body px-3 px-sm-4">
          {error && (
            <div className="alert alert-danger py-2" role="alert">
              {error}
            </div>
          )}

          <label className="form-label fw-semibold">
            Product Received Photo
          </label>

          {/* Camera input: hints mobile browsers to use the rear camera. */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={handleImageChange}
            disabled={submitting}
            className="d-none"
            aria-label="Take a product photo"
          />

          {/* File input: allows gallery, Photos, or file selection. */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            disabled={submitting}
            className="d-none"
            aria-label="Choose a product photo from files"
          />

          <div className="d-flex flex-column flex-sm-row gap-2">
            <button
              type="button"
              className="btn btn-outline-primary flex-fill"
              onClick={() => cameraInputRef.current?.click()}
              disabled={submitting}
            >
              <i className="bi bi-camera me-2" aria-hidden="true" />
              Take Photo
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary flex-fill"
              onClick={() => fileInputRef.current?.click()}
              disabled={submitting}
            >
              <i className="bi bi-folder2-open me-2" aria-hidden="true" />
              Choose from Gallery / Files
            </button>
          </div>

          <div className="form-text mt-2">
            Accepted formats: JPG, PNG, WEBP. Maximum size: 5 MB.
          </div>

          {preview && (
            <div className="mt-3">
              <div className="small fw-semibold mb-2">
                Selected image preview
              </div>
              <img
                src={preview}
                alt="Product received proof preview"
                className="img-fluid rounded border"
                style={{
                  maxHeight: "350px",
                  objectFit: "contain",
                }}
              />
              <div className="small text-muted mt-2 text-break">
                {proofImage?.name}
              </div>
            </div>
          )}
        </div>

        <div className="card-footer bg-white border-0 px-3 px-sm-4 pb-4">
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Task 2"}
          </button>
        </div>
      </div>
    </form>
  );
}
