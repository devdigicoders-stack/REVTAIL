"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

// ============================================================
// TYPES
// ============================================================

type QuestionType =
  | "TEXT"
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "RATING";

type CampaignQuestion = {
  id: number;

  questionText: string;

  questionType:
    QuestionType;

  options:
    | string[]
    | null;

  isRequired:
    boolean;

  sortOrder:
    number;
};

type QuestionnaireResponse = {
  success: boolean;

  message: string;

  data?: {
    testerCampaignId:
      number;

    campaign: {
      id: number;

      productName:
        string;
    };

    task: {
      id: number;

      taskNumber:
        number;

      status:
        string;
    };

    questions:
      CampaignQuestion[];
  };
};

type Props = {
  testerCampaignId:
    number;
};

type AnswerValue =
  | string
  | string[];

export default function Task3Form({
  testerCampaignId,
}: Props) {
  const router =
    useRouter();

  // ============================================================
  // STATE
  // ============================================================

  const [
    questions,
    setQuestions,
  ] =
    useState<
      CampaignQuestion[]
    >([]);

  const [
    reviewText,
    setReviewText,
  ] =
    useState("");

  const [
    rating,
    setRating,
  ] =
    useState<
      number | null
    >(null);

  const [
    answers,
    setAnswers,
  ] =
    useState<
      Record<
        number,
        AnswerValue
      >
    >({});

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

  // ============================================================
  // LOAD QUESTIONNAIRE
  // ============================================================

  const loadQuestionnaire =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setError("");

          const response =
            await fetch(
              `/api/tester/campaigns/ongoing/${testerCampaignId}/tasks/3/questionnaire`,
              {
                method:
                  "GET",

                cache:
                  "no-store",
              }
            );

          const result =
            (await response.json()) as
              QuestionnaireResponse;

          if (!response.ok) {
            throw new Error(
              result.message ||
                "Unable to load questionnaire."
            );
          }

          setQuestions(
            result.data
              ?.questions ??
              []
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load questionnaire."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        testerCampaignId,
      ]
    );

  useEffect(() => {
    loadQuestionnaire();
  }, [
    loadQuestionnaire,
  ]);

  // ============================================================
  // SET NORMAL ANSWER
  // ============================================================

  function setAnswer(
    questionId: number,
    value: string
  ) {
    setAnswers(
      (previous) => ({
        ...previous,

        [questionId]:
          value,
      })
    );
  }

  // ============================================================
  // MULTIPLE CHOICE
  // ============================================================

  function toggleMultipleChoice(
    questionId: number,
    option: string
  ) {
    setAnswers(
      (previous) => {
        const existing =
          Array.isArray(
            previous[
              questionId
            ]
          )
            ? (
                previous[
                  questionId
                ] as string[]
              )
            : [];

        const selected =
          existing.includes(
            option
          );

        return {
          ...previous,

          [questionId]:
            selected
              ? existing.filter(
                  (item) =>
                    item !==
                    option
                )
              : [
                  ...existing,
                  option,
                ],
        };
      }
    );
  }

  // ============================================================
  // VALIDATE
  // ============================================================

  function validateForm() {
    if (
      !reviewText.trim()
    ) {
      return "Please write your product review.";
    }

    if (
      reviewText.trim()
        .length < 10
    ) {
      return "Please write a more detailed product review.";
    }

    if (
      !rating ||
      rating < 1 ||
      rating > 5
    ) {
      return "Please select a rating from 1 to 5.";
    }

    for (
      const question
      of questions
    ) {
      if (
        !question.isRequired
      ) {
        continue;
      }

      const value =
        answers[
          question.id
        ];

      if (
        Array.isArray(
          value
        )
      ) {
        if (
          value.length ===
          0
        ) {
          return `Please answer: ${question.questionText}`;
        }

        continue;
      }

      if (
        !value ||
        !value.trim()
      ) {
        return `Please answer: ${question.questionText}`;
      }
    }

    return null;
  }

  // ============================================================
  // SUBMIT
  // ============================================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

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

    const validationError =
      validateForm();

    if (
      validationError
    ) {
      setError(
        validationError
      );

      return;
    }

    try {
      setSubmitting(
        true
      );

      const submissionAnswers =
        questions
          .map(
            (
              question
            ) => ({
              questionId:
                question.id,

              answer:
                answers[
                  question.id
                ] ??
                "",
            })
          )
          .filter(
            (item) => {
              if (
                Array.isArray(
                  item.answer
                )
              ) {
                return (
                  item.answer
                    .length >
                  0
                );
              }

              return Boolean(
                item.answer
                  .trim()
              );
            }
          );

      const response =
        await fetch(
          `/api/tester/campaigns/ongoing/${testerCampaignId}/tasks/3/submit`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                reviewText:
                  reviewText.trim(),

                rating,

                answers:
                  submissionAnswers,
              }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to submit Task 3."
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
          : "Unable to submit Task 3."
      );
    } finally {
      setSubmitting(
        false
      );
    }
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="card border-0 shadow-sm">

        <div className="card-body py-5 text-center">

          <div
            className="spinner-border text-primary"
            role="status"
          />

          <div className="text-muted mt-3">
            Loading Task 3...
          </div>

        </div>

      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <form
      onSubmit={
        handleSubmit
      }
    >

      <div className="card border-0 shadow-sm">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="card-header bg-white border-0 pt-4 px-4">

          <div className="d-flex align-items-center gap-3">

            <div
              className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width:
                  "48px",

                height:
                  "48px",
              }}
            >
              <i className="bi bi-star fs-5"></i>
            </div>

            <div>

              <h5 className="fw-bold mb-1">
                Task 3 — Write Review & Rating
              </h5>

              <p className="text-muted small mb-0">
                Share your genuine experience
                with the product and complete
                the questionnaire.
              </p>

            </div>

          </div>

        </div>

        {/* ======================================================
            BODY
        ====================================================== */}

        <div className="card-body px-4">

          {error && (

            <div className="alert alert-danger">

              <i className="bi bi-exclamation-circle me-2"></i>

              {error}

            </div>

          )}

          {/* ====================================================
              RATING
          ==================================================== */}

          <div className="mb-4">

            <label className="form-label fw-semibold">
              Product Rating
              <span className="text-danger ms-1">
                *
              </span>
            </label>

            <div className="d-flex flex-wrap gap-2">

              {[
                1,
                2,
                3,
                4,
                5,
              ].map(
                (
                  value
                ) => (

                  <button
                    key={
                      value
                    }
                    type="button"
                    className={`btn ${
                      rating ===
                      value
                        ? "btn-warning"
                        : "btn-outline-secondary"
                    }`}
                    style={{
                      minWidth:
                        "52px",
                    }}
                    onClick={() =>
                      setRating(
                        value
                      )
                    }
                  >

                    <i className="bi bi-star-fill me-1"></i>

                    {
                      value
                    }

                  </button>

                )
              )}

            </div>

            {rating && (

              <div className="small text-muted mt-2">

                Your rating:{" "}

                <strong>
                  {rating}/5
                </strong>

              </div>

            )}

          </div>

          {/* ====================================================
              REVIEW
          ==================================================== */}

          <div className="mb-4">

            <label className="form-label fw-semibold">

              Product Review

              <span className="text-danger ms-1">
                *
              </span>

            </label>

            <textarea
              className="form-control"
              rows={6}
              value={
                reviewText
              }
              onChange={(
                event
              ) =>
                setReviewText(
                  event.target
                    .value
                )
              }
              placeholder="Describe your genuine experience with the product..."
              maxLength={
                5000
              }
            />

            <div className="d-flex justify-content-between mt-1">

              <small className="text-muted">
                Write about your experience,
                quality, usability and overall
                opinion.
              </small>

              <small className="text-muted">
                {
                  reviewText.length
                }
                /5000
              </small>

            </div>

          </div>

          {/* ====================================================
              QUESTIONNAIRE
          ==================================================== */}

          {questions.length >
            0 && (

            <div>

              <hr />

              <h6 className="fw-bold mb-1">
                Product Questionnaire
              </h6>

              <p className="text-muted small mb-4">
                Please answer the following
                questions about your experience.
              </p>

              <div className="d-flex flex-column gap-4">

                {questions.map(
                  (
                    question,
                    index
                  ) => (

                    <QuestionField
                      key={
                        question.id
                      }
                      index={
                        index
                      }
                      question={
                        question
                      }
                      value={
                        answers[
                          question.id
                        ]
                      }
                      onChange={(
                        value
                      ) =>
                        setAnswer(
                          question.id,
                          value
                        )
                      }
                      onToggleMultiple={(
                        option
                      ) =>
                        toggleMultipleChoice(
                          question.id,
                          option
                        )
                      }
                    />

                  )
                )}

              </div>

            </div>

          )}

        </div>

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <div className="card-footer bg-white border-0 px-4 pb-4">

          <div className="d-flex flex-column flex-sm-row justify-content-between gap-3 align-items-sm-center">

            <small className="text-muted">

              <i className="bi bi-info-circle me-1"></i>

              Your submission will be sent
              for approval.

            </small>

            <button
              type="submit"
              className="btn btn-primary px-4"
              disabled={
                submitting
              }
            >

              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />

                  Submitting...
                </>
              ) : (
                <>
                  Submit Task 3

                  <i className="bi bi-arrow-right ms-2"></i>
                </>
              )}

            </button>

          </div>

        </div>

      </div>

    </form>
  );
}


// ============================================================
// QUESTION FIELD
// ============================================================

function QuestionField({
  index,
  question,
  value,
  onChange,
  onToggleMultiple,
}: {
  index: number;

  question:
    CampaignQuestion;

  value:
    | AnswerValue
    | undefined;

  onChange: (
    value: string
  ) => void;

  onToggleMultiple: (
    option: string
  ) => void;
}) {
  const options =
    Array.isArray(
      question.options
    )
      ? question.options
      : [];

  return (
    <div>

      <label className="form-label fw-semibold">

        {index + 1}.{" "}

        {
          question.questionText
        }

        {question.isRequired && (
          <span className="text-danger ms-1">
            *
          </span>
        )}

      </label>

      {/* ========================================================
          TEXT
      ======================================================== */}

      {question.questionType ===
        "TEXT" && (

        <textarea
          className="form-control"
          rows={3}
          value={
            typeof value ===
            "string"
              ? value
              : ""
          }
          onChange={(
            event
          ) =>
            onChange(
              event.target
                .value
            )
          }
        />

      )}

      {/* ========================================================
          SINGLE CHOICE
      ======================================================== */}

      {question.questionType ===
        "SINGLE_CHOICE" && (

        <div className="d-flex flex-column gap-2">

          {options.map(
            (
              option
            ) => {

              const id =
                `question-${question.id}-${option}`;

              return (
                <label
                  key={
                    option
                  }
                  htmlFor={
                    id
                  }
                  className="border rounded p-3 d-flex align-items-center gap-2"
                  style={{
                    cursor:
                      "pointer",
                  }}
                >

                  <input
                    id={
                      id
                    }
                    type="radio"
                    name={
                      `question-${question.id}`
                    }
                    className="form-check-input mt-0"
                    checked={
                      value ===
                      option
                    }
                    onChange={() =>
                      onChange(
                        option
                      )
                    }
                  />

                  <span>
                    {
                      option
                    }
                  </span>

                </label>
              );
            }
          )}

        </div>

      )}

      {/* ========================================================
          MULTIPLE CHOICE
      ======================================================== */}

      {question.questionType ===
        "MULTIPLE_CHOICE" && (

        <div className="d-flex flex-column gap-2">

          {options.map(
            (
              option
            ) => {

              const selectedValues =
                Array.isArray(
                  value
                )
                  ? value
                  : [];

              return (
                <label
                  key={
                    option
                  }
                  className="border rounded p-3 d-flex align-items-center gap-2"
                  style={{
                    cursor:
                      "pointer",
                  }}
                >

                  <input
                    type="checkbox"
                    className="form-check-input mt-0"
                    checked={
                      selectedValues.includes(
                        option
                      )
                    }
                    onChange={() =>
                      onToggleMultiple(
                        option
                      )
                    }
                  />

                  <span>
                    {
                      option
                    }
                  </span>

                </label>
              );
            }
          )}

        </div>

      )}

      {/* ========================================================
          RATING QUESTION
      ======================================================== */}

      {question.questionType ===
        "RATING" && (

        <div className="d-flex flex-wrap gap-2">

          {[
            1,
            2,
            3,
            4,
            5,
          ].map(
            (
              ratingValue
            ) => (

              <button
                key={
                  ratingValue
                }
                type="button"
                className={`btn btn-sm ${
                  value ===
                  String(
                    ratingValue
                  )
                    ? "btn-warning"
                    : "btn-outline-secondary"
                }`}
                onClick={() =>
                  onChange(
                    String(
                      ratingValue
                    )
                  )
                }
              >

                <i className="bi bi-star-fill me-1"></i>

                {
                  ratingValue
                }

              </button>

            )
          )}

        </div>

      )}

    </div>
  );
}