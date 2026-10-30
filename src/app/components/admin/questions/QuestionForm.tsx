"use client";

import {
  useEffect,
  useState,
} from "react";

export type QuestionType =
  | "TEXT"
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE";

type InitialData = {
  questionText:
    string;

  questionType:
    QuestionType;

  options:
    string[];

  isActive:
    boolean;
};

type Props = {
  initialData?:
    InitialData;

  submitting:
    boolean;

  submitLabel:
    string;

  onSubmit: (
    data: InitialData
  ) => Promise<void>;
};

export default function QuestionForm({
  initialData,
  submitting,
  submitLabel,
  onSubmit,
}: Props) {
  const [
    questionText,
    setQuestionText,
  ] =
    useState(
      initialData?.questionText ??
        ""
    );

  const [
    questionType,
    setQuestionType,
  ] =
    useState<QuestionType>(
      initialData?.questionType ??
        "SINGLE_CHOICE"
    );

  const [
    options,
    setOptions,
  ] =
    useState<string[]>(
      initialData?.options ??
        ["", ""]
    );

  const [
    isActive,
    setIsActive,
  ] =
    useState(
      initialData?.isActive ??
        true
    );

  const [
    error,
    setError,
  ] =
    useState("");

  useEffect(() => {
    if (!initialData) {
      return;
    }

    setQuestionText(
      initialData.questionText
    );

    setQuestionType(
      initialData.questionType
    );

    setOptions(
      initialData.questionType ===
        "TEXT"
        ? []
        : initialData.options.length >=
            2
          ? initialData.options
          : ["", ""]
    );

    setIsActive(
      initialData.isActive
    );
  }, [initialData]);

  function changeType(
    value:
      QuestionType
  ) {
    setQuestionType(
      value
    );

    if (
      value ===
      "TEXT"
    ) {
      setOptions([]);
    } else if (
      options.length <
      2
    ) {
      setOptions([
        "",
        "",
      ]);
    }
  }

  function updateOption(
    index: number,
    value: string
  ) {
    setOptions(
      (
        previous
      ) =>
        previous.map(
          (
            item,
            itemIndex
          ) =>
            itemIndex ===
            index
              ? value
              : item
        )
    );
  }

  function addOption() {
    if (
      options.length >=
      6
    ) {
      return;
    }

    setOptions(
      (
        previous
      ) => [
        ...previous,
        "",
      ]
    );
  }

  function removeOption(
    index: number
  ) {
    if (
      options.length <=
      2
    ) {
      return;
    }

    setOptions(
      (
        previous
      ) =>
        previous.filter(
          (
            _,
            itemIndex
          ) =>
            itemIndex !==
            index
        )
    );
  }

  async function handleSubmit(
    event:
      React.FormEvent
  ) {
    event.preventDefault();

    setError("");

    if (
      !questionText.trim()
    ) {
      setError(
        "Question text is required."
      );

      return;
    }

    const cleanOptions =
      options
        .map(
          (
            item
          ) =>
            item.trim()
        )
        .filter(Boolean);

    if (
      questionType !==
        "TEXT" &&
      cleanOptions.length <
        2
    ) {
      setError(
        "At least 2 options are required."
      );

      return;
    }

    await onSubmit({
      questionText:
        questionText.trim(),

      questionType,

      options:
        questionType ===
        "TEXT"
          ? []
          : cleanOptions,

      isActive,
    });
  }

  return (
    <form
      onSubmit={
        handleSubmit
      }
    >

      {error && (

        <div className="alert alert-danger">

          {
            error
          }

        </div>

      )}

      <div className="mb-4">

        <label className="form-label fw-semibold">

          Question *

        </label>

        <textarea
          className="form-control"
          rows={3}
          value={
            questionText
          }
          onChange={(
            event
          ) =>
            setQuestionText(
              event.target
                .value
            )
          }
          placeholder="Enter the question"
        />

      </div>

      <div className="mb-4">

        <label className="form-label fw-semibold">

          Question Type *

        </label>

        <select
          className="form-select"
          value={
            questionType
          }
          onChange={(
            event
          ) =>
            changeType(
              event.target
                .value as QuestionType
            )
          }
        >

          <option value="TEXT">
            Text Answer
          </option>

          <option value="SINGLE_CHOICE">
            Single Choice
          </option>

          <option value="MULTIPLE_CHOICE">
            Multiple Choice
          </option>

        </select>

      </div>

      {questionType !==
        "TEXT" && (

        <div className="mb-4">

          <div className="d-flex justify-content-between align-items-center mb-2">

            <label className="form-label fw-semibold mb-0">

              Answer Options

            </label>

            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={
                addOption
              }
              disabled={
                options.length >=
                6
              }
            >

              <i className="bi bi-plus-lg me-1" />

              Add Option

            </button>

          </div>

          {options.map(
            (
              option,
              index
            ) => (

              <div
                className="input-group mb-2"
                key={
                  index
                }
              >

                <span className="input-group-text">

                  {index +
                    1}

                </span>

                <input
                  type="text"
                  className="form-control"
                  value={
                    option
                  }
                  placeholder={`Option ${index + 1}`}
                  onChange={(
                    event
                  ) =>
                    updateOption(
                      index,
                      event
                        .target
                        .value
                    )
                  }
                />

                <button
                  type="button"
                  className="btn btn-outline-danger"
                  disabled={
                    options.length <=
                    2
                  }
                  onClick={() =>
                    removeOption(
                      index
                    )
                  }
                >

                  <i className="bi bi-trash" />

                </button>

              </div>

            )
          )}

        </div>

      )}

      <div className="form-check form-switch mb-4">

        <input
          className="form-check-input"
          type="checkbox"
          role="switch"
          id="questionActive"
          checked={
            isActive
          }
          onChange={(
            event
          ) =>
            setIsActive(
              event.target
                .checked
            )
          }
        />

        <label
          className="form-check-label"
          htmlFor="questionActive"
        >

          Active and available for campaigns

        </label>

      </div>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={
          submitting
        }
      >

        {submitting ? (

          <>
            <span className="spinner-border spinner-border-sm me-2" />

            Saving...
          </>

        ) : (

          <>
            <i className="bi bi-check-lg me-2" />

            {
              submitLabel
            }
          </>

        )}

      </button>

    </form>
  );
}