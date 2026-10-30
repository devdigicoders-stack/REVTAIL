"use client";

import {
  useState,
} from "react";

import Link from "next/link";
import {
  useRouter,
} from "next/navigation";

import QuestionForm from "@/app/components/admin/questions/QuestionForm";

export default function CreateQuestionPage() {
  const router =
    useRouter();

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

  async function createQuestion(
    data: {
      questionText:
        string;

      questionType:
        "TEXT" |
        "SINGLE_CHOICE" |
        "MULTIPLE_CHOICE";

      options:
        string[];

      isActive:
        boolean;
    }
  ) {
    try {
      setSubmitting(
        true
      );

      setError("");

      const response =
        await fetch(
          "/api/questions",
          {
            method:
              "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                data
              ),
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Unable to create question."
        );
      }

      router.push(
        "/admin/questions"
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof
          Error
          ? err.message
          : "Unable to create question."
      );
    } finally {
      setSubmitting(
        false
      );
    }
  }

  return (
    <>
      <div className="col-12">

        <Link
          href="/admin/questions"
          className="text-decoration-none"
        >

          <i className="bi bi-arrow-left me-1" />

          Back to Questions

        </Link>

      </div>

      <div className="col-lg-8">

        <div className="card border-0 shadow-sm">

          <div className="card-body p-4">

            <h3 className="fw-bold mb-1">

              Create Fixed Question

            </h3>

            <p className="text-muted mb-4">

              Create a reusable questionnaire item that Brands can select while creating campaigns.

            </p>

            {error && (

              <div className="alert alert-danger">

                {
                  error
                }

              </div>

            )}

            <QuestionForm
              submitting={
                submitting
              }
              submitLabel="Create Question"
              onSubmit={
                createQuestion
              }
            />

          </div>

        </div>

      </div>
    </>
  );
}