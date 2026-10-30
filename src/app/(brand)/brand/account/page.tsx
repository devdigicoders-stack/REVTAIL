"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

// ============================================================
// TYPES
// ============================================================

type BrandAccount = {
  id: number;

  companyName: string;

  companyType: string;

  categoryId:
    | number
    | null;

  category:
    | {
        id: number;

        name: string;
      }
    | null;

  website:
    | string
    | null;

  pocFullName:
    | string
    | null;

  pocMobile:
    | string
    | null;

  designation:
    | string
    | null;

  approvalStatus:
    string;

  email:
    | string
    | null;

  mobile:
    | string
    | null;

  userStatus:
    string;
};

type ApiResponse = {
  success: boolean;

  message?: string;

  data?: BrandAccount;
};

type PasswordApiResponse = {
  success: boolean;

  message?: string;
};

// ============================================================
// PAGE
// ============================================================

export default function BrandAccountPage() {
  // ==========================================================
  // ACCOUNT
  // ==========================================================

  const [
    account,
    setAccount,
  ] =
    useState<BrandAccount | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState("");

  // ==========================================================
  // PROFILE FORM
  // ==========================================================

  const [
    website,
    setWebsite,
  ] =
    useState("");

  const [
    pocFullName,
    setPocFullName,
  ] =
    useState("");

  const [
    pocMobile,
    setPocMobile,
  ] =
    useState("");

  const [
    designation,
    setDesignation,
  ] =
    useState("");

  // ==========================================================
  // PASSWORD FORM
  // ==========================================================

  const [
    currentPassword,
    setCurrentPassword,
  ] =
    useState("");

  const [
    newPassword,
    setNewPassword,
  ] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState("");

  const [
    changingPassword,
    setChangingPassword,
  ] =
    useState(false);

  const [
    passwordError,
    setPasswordError,
  ] =
    useState("");

  const [
    passwordSuccess,
    setPasswordSuccess,
  ] =
    useState("");

  const [
    showCurrentPassword,
    setShowCurrentPassword,
  ] =
    useState(false);

  const [
    showNewPassword,
    setShowNewPassword,
  ] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] =
    useState(false);

  // ==========================================================
  // LOAD ACCOUNT
  // ==========================================================

  const loadAccount =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setError("");

          const response =
            await fetch(
              "/api/brand/account",
              {
                method:
                  "GET",

                credentials:
                  "include",

                cache:
                  "no-store",
              }
            );

          const result =
            (await response.json()) as
              ApiResponse;

          if (
            !response.ok ||
            !result.success ||
            !result.data
          ) {
            throw new Error(
              result.message ||
                "Unable to load Brand account."
            );
          }

          const data =
            result.data;

          setAccount(
            data
          );

          setWebsite(
            data.website ??
              ""
          );

          setPocFullName(
            data.pocFullName ??
              ""
          );

          setPocMobile(
            data.pocMobile ??
              ""
          );

          setDesignation(
            data.designation ??
              ""
          );
        } catch (
          err
        ) {
          console.error(
            "LOAD BRAND ACCOUNT ERROR:",
            err
          );

          setError(
            err instanceof
              Error
              ? err.message
              : "Unable to load Brand account."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    loadAccount();
  }, [
    loadAccount,
  ]);

  // ==========================================================
  // SAVE PROFILE
  // ==========================================================

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      try {
        setSaving(
          true
        );

        setError("");

        setSuccessMessage("");

        if (
          !pocFullName.trim()
        ) {
          throw new Error(
            "POC Full Name is required."
          );
        }

        if (
          !/^[0-9]{10}$/.test(
            pocMobile.trim()
          )
        ) {
          throw new Error(
            "POC Mobile must contain exactly 10 digits."
          );
        }

        if (
          !designation.trim()
        ) {
          throw new Error(
            "Designation is required."
          );
        }

        const response =
          await fetch(
            "/api/brand/account",
            {
              method:
                "PATCH",

              credentials:
                "include",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  website:
                    website.trim(),

                  pocFullName:
                    pocFullName.trim(),

                  pocMobile:
                    pocMobile.trim(),

                  designation:
                    designation.trim(),
                }),
            }
          );

        const result =
          (await response.json()) as
            ApiResponse;

        if (
          !response.ok ||
          !result.success ||
          !result.data
        ) {
          throw new Error(
            result.message ||
              "Unable to update Brand account."
          );
        }

        setAccount(
          result.data
        );

        setWebsite(
          result.data.website ??
            ""
        );

        setPocFullName(
          result.data.pocFullName ??
            ""
        );

        setPocMobile(
          result.data.pocMobile ??
            ""
        );

        setDesignation(
          result.data.designation ??
            ""
        );

        setSuccessMessage(
          result.message ||
            "Brand account updated successfully."
        );
      } catch (
        err
      ) {
        console.error(
          "UPDATE BRAND ACCOUNT ERROR:",
          err
        );

        setError(
          err instanceof
            Error
            ? err.message
            : "Unable to update Brand account."
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  // ==========================================================
  // CHANGE PASSWORD
  // ==========================================================

  const handleChangePassword =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      try {
        setChangingPassword(
          true
        );

        setPasswordError("");

        setPasswordSuccess("");

        // ====================================================
        // CLIENT VALIDATION
        // ====================================================

        if (
          !currentPassword
        ) {
          throw new Error(
            "Current password is required."
          );
        }

        if (
          newPassword.length <
          8
        ) {
          throw new Error(
            "New password must be at least 8 characters long."
          );
        }

        const strongPassword =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

        if (
          !strongPassword.test(
            newPassword
          )
        ) {
          throw new Error(
            "New password must contain at least one uppercase letter, one lowercase letter and one number."
          );
        }

        if (
          newPassword !==
          confirmPassword
        ) {
          throw new Error(
            "New password and confirmation password do not match."
          );
        }

        if (
          currentPassword ===
          newPassword
        ) {
          throw new Error(
            "New password must be different from the current password."
          );
        }

        // ====================================================
        // API
        // ====================================================

        const response =
          await fetch(
            "/api/brand/account/change-password",
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
                JSON.stringify({
                  currentPassword,

                  newPassword,

                  confirmPassword,
                }),
            }
          );

        const result =
          (await response.json()) as
            PasswordApiResponse;

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              "Unable to change password."
          );
        }

        // ====================================================
        // CLEAR PASSWORD FIELDS
        // ====================================================

        setCurrentPassword(
          ""
        );

        setNewPassword(
          ""
        );

        setConfirmPassword(
          ""
        );

        setPasswordSuccess(
          result.message ||
            "Password changed successfully."
        );
      } catch (
        err
      ) {
        console.error(
          "CHANGE BRAND PASSWORD ERROR:",
          err
        );

        setPasswordError(
          err instanceof
            Error
            ? err.message
            : "Unable to change password."
        );
      } finally {
        setChangingPassword(
          false
        );
      }
    };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body py-5 text-center">

            <div
              className="spinner-border text-primary"
              role="status"
            />

            <div className="text-muted mt-3">
              Loading account...
            </div>

          </div>

        </div>

      </div>
    );
  }

  if (!account) {
    return (
      <div className="col-12">

        <div className="alert alert-danger">

          {error ||
            "Brand account not found."}

        </div>

      </div>
    );
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <>
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="col-12">

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">

          <div>

            <h3 className="fw-bold mb-1">
              My Account
            </h3>

            <p className="text-muted mb-0">
              Manage your Brand profile and account security.
            </p>

          </div>

          <span
            className={`badge fs-6 ${
              account.approvalStatus ===
              "ACTIVE"
                ? "bg-success"
                : account.approvalStatus ===
                    "PENDING"
                  ? "bg-warning text-dark"
                  : "bg-secondary"
            }`}
          >

            {
              account.approvalStatus
            }

          </span>

        </div>

      </div>

      {/* ======================================================
          PROFILE MESSAGE
      ====================================================== */}

      {successMessage && (

        <div className="col-12">

          <div className="alert alert-success">

            <i className="bi bi-check-circle me-2" />

            {
              successMessage
            }

          </div>

        </div>

      )}

      {error && (

        <div className="col-12">

          <div className="alert alert-danger">

            <i className="bi bi-exclamation-triangle me-2" />

            {
              error
            }

          </div>

        </div>

      )}

      {/* ======================================================
          BRAND SUMMARY
      ====================================================== */}

      <div className="col-lg-4">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-body">

            <div className="text-center mb-4">

              <div
                className="mx-auto mb-3 rounded-circle border bg-light d-flex align-items-center justify-content-center"
                style={{
                  width:
                    100,

                  height:
                    100,
                }}
              >

                <i className="bi bi-building fs-1 text-muted" />

              </div>

              <h4 className="fw-bold mb-1">

                {
                  account.companyName
                }

              </h4>

              <div className="text-muted">

                {
                  account.companyType
                }

              </div>

            </div>

            <InfoRow
              label="Category"
              value={
                account.category
                  ?.name ??
                "-"
              }
            />

            <InfoRow
              label="Email"
              value={
                account.email ??
                "-"
              }
            />

            <InfoRow
              label="Mobile"
              value={
                account.mobile ??
                "-"
              }
            />

            <InfoRow
              label="User Status"
              value={
                account.userStatus
              }
            />

          </div>

        </div>

      </div>

      {/* ======================================================
          PROFILE FORM
      ====================================================== */}

      <div className="col-lg-8">

        <div className="card border-0 shadow-sm">

          <div className="card-body">

            <h5 className="fw-bold mb-4">

              <i className="bi bi-building me-2" />

              Brand Information

            </h5>

            <form
              onSubmit={
                handleSubmit
              }
            >

              <div className="row g-3">

                <div className="col-md-6">

                  <label className="form-label">
                    Company Name
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    value={
                      account.companyName
                    }
                    disabled
                  />

                </div>

                <div className="col-md-6">

                  <label className="form-label">
                    Company Type
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    value={
                      account.companyType
                    }
                    disabled
                  />

                </div>

                <div className="col-md-6">

                  <label className="form-label">
                    Category
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    value={
                      account.category
                        ?.name ??
                      "-"
                    }
                    disabled
                  />

                </div>

                <div className="col-md-6">

                  <label className="form-label">
                    Login Email
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    value={
                      account.email ??
                      ""
                    }
                    disabled
                  />

                </div>

                <div className="col-12">

                  <label className="form-label">
                    Website
                  </label>

                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://example.com"
                    value={
                      website
                    }
                    onChange={(
                      event
                    ) =>
                      setWebsite(
                        event.target.value
                      )
                    }
                  />

                </div>

                <div className="col-12">

                  <hr />

                  <h6 className="fw-bold">
                    Point of Contact
                  </h6>

                </div>

                <div className="col-md-6">

                  <label className="form-label">
                    POC Full Name *
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    value={
                      pocFullName
                    }
                    onChange={(
                      event
                    ) =>
                      setPocFullName(
                        event.target.value
                      )
                    }
                    required
                  />

                </div>

                <div className="col-md-6">

                  <label className="form-label">
                    POC Mobile *
                  </label>

                  <input
                    type="tel"
                    className="form-control"
                    maxLength={
                      10
                    }
                    value={
                      pocMobile
                    }
                    onChange={(
                      event
                    ) => {
                      const value =
                        event.target.value.replace(
                          /\D/g,
                          ""
                        );

                      setPocMobile(
                        value
                      );
                    }}
                    required
                  />

                </div>

                <div className="col-md-6">

                  <label className="form-label">
                    Designation *
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    value={
                      designation
                    }
                    onChange={(
                      event
                    ) =>
                      setDesignation(
                        event.target.value
                      )
                    }
                    required
                  />

                </div>

                <div className="col-md-6">

                  <label className="form-label">
                    Account Status
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    value={
                      account.userStatus
                    }
                    disabled
                  />

                </div>

              </div>

              <div className="d-flex justify-content-end mt-4">

                <button
                  type="submit"
                  className="btn btn-primary px-4"
                  disabled={
                    saving
                  }
                >

                  {saving ? (

                    <>
                      <span className="spinner-border spinner-border-sm me-2" />

                      Saving...
                    </>

                  ) : (

                    <>
                      <i className="bi bi-check-circle me-2" />

                      Save Changes
                    </>

                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      </div>

      {/* ======================================================
          CHANGE PASSWORD
      ====================================================== */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body">

            <div className="mb-4">

              <h5 className="fw-bold mb-1">

                <i className="bi bi-shield-lock me-2" />

                Change Password

              </h5>

              <div className="text-muted">
                Update the password used to login to your Brand account.
              </div>

            </div>

            {passwordSuccess && (

              <div className="alert alert-success">

                <i className="bi bi-check-circle me-2" />

                {
                  passwordSuccess
                }

              </div>

            )}

            {passwordError && (

              <div className="alert alert-danger">

                <i className="bi bi-exclamation-triangle me-2" />

                {
                  passwordError
                }

              </div>

            )}

            <form
              onSubmit={
                handleChangePassword
              }
            >

              <div className="row g-3">

                {/* CURRENT PASSWORD */}

                <div className="col-md-4">

                  <label className="form-label">
                    Current Password *
                  </label>

                  <div className="input-group">

                    <input
                      type={
                        showCurrentPassword
                          ? "text"
                          : "password"
                      }
                      className="form-control"
                      value={
                        currentPassword
                      }
                      onChange={(
                        event
                      ) =>
                        setCurrentPassword(
                          event.target.value
                        )
                      }
                      autoComplete="current-password"
                      required
                    />

                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() =>
                        setShowCurrentPassword(
                          (
                            previous
                          ) =>
                            !previous
                        )
                      }
                    >

                      <i
                        className={
                          showCurrentPassword
                            ? "bi bi-eye-slash"
                            : "bi bi-eye"
                        }
                      />

                    </button>

                  </div>

                </div>

                {/* NEW PASSWORD */}

                <div className="col-md-4">

                  <label className="form-label">
                    New Password *
                  </label>

                  <div className="input-group">

                    <input
                      type={
                        showNewPassword
                          ? "text"
                          : "password"
                      }
                      className="form-control"
                      value={
                        newPassword
                      }
                      onChange={(
                        event
                      ) =>
                        setNewPassword(
                          event.target.value
                        )
                      }
                      minLength={
                        8
                      }
                      autoComplete="new-password"
                      required
                    />

                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() =>
                        setShowNewPassword(
                          (
                            previous
                          ) =>
                            !previous
                        )
                      }
                    >

                      <i
                        className={
                          showNewPassword
                            ? "bi bi-eye-slash"
                            : "bi bi-eye"
                        }
                      />

                    </button>

                  </div>

                </div>

                {/* CONFIRM PASSWORD */}

                <div className="col-md-4">

                  <label className="form-label">
                    Confirm New Password *
                  </label>

                  <div className="input-group">

                    <input
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      className="form-control"
                      value={
                        confirmPassword
                      }
                      onChange={(
                        event
                      ) =>
                        setConfirmPassword(
                          event.target.value
                        )
                      }
                      autoComplete="new-password"
                      required
                    />

                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() =>
                        setShowConfirmPassword(
                          (
                            previous
                          ) =>
                            !previous
                        )
                      }
                    >

                      <i
                        className={
                          showConfirmPassword
                            ? "bi bi-eye-slash"
                            : "bi bi-eye"
                        }
                      />

                    </button>

                  </div>

                </div>

              </div>

              {/* PASSWORD REQUIREMENTS */}

              <div className="form-text mt-3">

                <i className="bi bi-info-circle me-1" />

                Password must contain at least 8 characters,
                one uppercase letter, one lowercase letter and one number.

              </div>

              {/* BUTTON */}

              <div className="d-flex justify-content-end mt-4">

                <button
                  type="submit"
                  className="btn btn-warning px-4"
                  disabled={
                    changingPassword
                  }
                >

                  {changingPassword ? (

                    <>
                      <span className="spinner-border spinner-border-sm me-2" />

                      Changing Password...
                    </>

                  ) : (

                    <>
                      <i className="bi bi-key me-2" />

                      Change Password
                    </>

                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      </div>
    </>
  );
}

// ============================================================
// INFO ROW
// ============================================================

function InfoRow({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div className="d-flex flex-column border-bottom py-2">

      <span className="text-muted mb-1">

        {
          label
        }

      </span>

      <span className="fw-semibold">

        {
          value
        }

      </span>

    </div>
  );
}