"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  useParams,
  useRouter,
} from "next/navigation";

import QuestionForm from "@/app/components/admin/questions/QuestionForm";

type Question = {
  id: number;

  questionText:
    string;

  questionType:
    | "TEXT"
    | "SINGLE_CHOICE"
    | "MULTIPLE_CHOICE";

  isActive:
    boolean;

  options: {
    id: number;

    optionText:
      string;

    optionOrder:
      number;
  }[];

  usageCount:
    number;
};

export default function EditQuestionPage() {
  const params =
    useParams();

  const router =
    useRouter();

  const id =
    Array.isArray(
      params.id
    )
      ? params.id[0]
      : params.id;

  const [
    question,
    setQuestion,
  ] =
    useState<Question | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

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

  const loadQuestion =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          const response =
            await fetch(
              `/api/questions/${id}`,
              {
                credentials:
                  "include",

                cache:
                  "no-store",
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
                "Question not found."
            );
          }

          setQuestion(
            result.data
          );
        } catch (err) {
          setError(
            err instanceof
              Error
              ? err.message
              : "Unable to load question."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [id]
    );

  useEffect(() => {
    if (id) {
      loadQuestion();
    }
  }, [
    id,
    loadQuestion,
  ]);

  async function updateQuestion(
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
          `/api/questions/${id}`,
          {
            method:
              "PUT",

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
            "Unable to update question."
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
          : "Unable to update question."
      );
    } finally {
      setSubmitting(
        false
      );
    }
  }

  if (loading) {
    return (
      <div className="col-12 text-center py-5">

        <div className="spinner-border text-primary" />

      </div>
    );
  }

  if (
    error &&
    !question
  ) {
    return (
      <div className="col-12">

        <div className="alert alert-danger">

          {
            error
          }

        </div>

      </div>
    );
  }

  if (!question) {
    return null;
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

              Edit Fixed Question

            </h3>

            <div className="text-muted mb-4">

              Used in{" "}

              <strong>

                {
                  question.usageCount
                }

              </strong>

              {" campaign(s)"}

            </div>

            {error && (

              <div className="alert alert-danger">

                {
                  error
                }

              </div>

            )}

            <QuestionForm
              initialData={{
                questionText:
                  question.questionText,

                questionType:
                  question.questionType,

                options:
                  question.options.map(
                    (
                      option
                    ) =>
                      option.optionText
                  ),

                isActive:
                  question.isActive,
              }}
              submitting={
                submitting
              }
              submitLabel="Save Changes"
              onSubmit={
                updateQuestion
              }
            />

          </div>

        </div>

      </div>
    </>
  );
}