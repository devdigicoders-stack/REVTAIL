"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

type Account = {
  userId: number;

  adminProfileId:
    number;

  fullName: string;

  designation:
    string | null;

  profileImage:
    string | null;

  email:
    string | null;

  mobile:
    string | null;

  role: string;

  status: string;

  emailVerifiedAt:
    string | null;

  mobileVerifiedAt:
    string | null;

  lastLoginAt:
    string | null;

  createdAt:
    string;

  updatedAt:
    string;
};

type ApiResponse = {
  success: boolean;

  message?: string;

  data?: Account;
};

export default function AdminAccountPage() {
  const [
    account,
    setAccount,
  ] =
    useState<Account | null>(
      null
    );

  const [
    fullName,
    setFullName,
  ] =
    useState("");

  const [
    designation,
    setDesignation,
  ] =
    useState("");

  const [
    mobile,
    setMobile,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    savingProfile,
    setSavingProfile,
  ] =
    useState(false);

  const [
    profileError,
    setProfileError,
  ] =
    useState("");

  const [
    profileSuccess,
    setProfileSuccess,
  ] =
    useState("");

  // ==========================================================
  // PASSWORD
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

  // ==========================================================
  // LOAD ACCOUNT
  // ==========================================================

  const loadAccount =
    useCallback(
      async () => {
        try {
          setLoading(true);

          const response =
            await fetch(
              "/api/admin/account",
              {
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
                "Unable to load account."
            );
          }

          setAccount(
            result.data
          );

          setFullName(
            result.data
              .fullName
          );

          setDesignation(
            result.data
              .designation ??
              ""
          );

          setMobile(
            result.data
              .mobile ??
              ""
          );
        } catch (error) {
          setProfileError(
            error instanceof
              Error
              ? error.message
              : "Unable to load account."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  // ==========================================================
  // SAVE PROFILE
  // ==========================================================

  async function handleProfileSubmit(
    event:
      React.FormEvent
  ) {
    event.preventDefault();

    try {
      setSavingProfile(
        true
      );

      setProfileError("");

      setProfileSuccess("");

      const response =
        await fetch(
          "/api/admin/account",
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
                fullName,

                designation,

                mobile,
              }),
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
            "Unable to update account."
        );
      }

      setProfileSuccess(
        result.message ||
          "Account updated successfully."
      );

      await loadAccount();
    } catch (error) {
      setProfileError(
        error instanceof
          Error
          ? error.message
          : "Unable to update account."
      );
    } finally {
      setSavingProfile(
        false
      );
    }
  }

  // ==========================================================
  // CHANGE PASSWORD
  // ==========================================================

  async function handlePasswordSubmit(
    event:
      React.FormEvent
  ) {
    event.preventDefault();

    setPasswordError("");

    setPasswordSuccess("");

    if (
      newPassword !==
      confirmPassword
    ) {
      setPasswordError(
        "New password and confirmation do not match."
      );

      return;
    }

    try {
      setChangingPassword(
        true
      );

      const response =
        await fetch(
          "/api/admin/account/password",
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
                currentPassword,

                newPassword,

                confirmPassword,
              }),
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
            "Unable to change password."
        );
      }

      setPasswordSuccess(
        result.message ||
          "Password changed successfully."
      );

      setCurrentPassword(
        ""
      );

      setNewPassword("");

      setConfirmPassword(
        ""
      );
    } catch (error) {
      setPasswordError(
        error instanceof
          Error
          ? error.message
          : "Unable to change password."
      );
    } finally {
      setChangingPassword(
        false
      );
    }
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body text-center py-5">

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

          {profileError ||
            "Unable to load Admin account."}

        </div>

      </div>
    );
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <>
      {/* HEADER */}

      <div className="col-12">

        <div className="mb-3">

          <h3 className="fw-bold mb-1">
            My Account
          </h3>

          <div className="text-muted">
            Manage your Admin profile and account security.
          </div>

        </div>

      </div>

      {/* PROFILE SUMMARY */}

      <div className="col-12">

        <div className="card border-0 shadow-sm">

          <div className="card-body">

            <div className="d-flex flex-column flex-md-row align-items-md-center gap-3">

              <div
                className="rounded-circle border bg-light overflow-hidden d-flex justify-content-center align-items-center"
                style={{
                  width: 75,
                  height: 75,
                }}
              >

                {account.profileImage ? (

                  <img
                    src={
                      account.profileImage
                    }
                    alt={
                      account.fullName
                    }
                    style={{
                      width:
                        "100%",

                      height:
                        "100%",

                      objectFit:
                        "cover",
                    }}
                  />

                ) : (

                  <i className="bi bi-person fs-1 text-muted" />

                )}

              </div>

              <div className="flex-grow-1">

                <h4 className="fw-bold mb-1">

                  {
                    account.fullName
                  }

                </h4>

                <div className="text-muted">

                  {
                    account.designation ||
                    "Administrator"
                  }

                </div>

                <div className="small mt-2">

                  <span className="badge bg-primary me-2">

                    {
                      account.role
                    }

                  </span>

                  <span
                    className={`badge ${
                      account.status ===
                      "ACTIVE"
                        ? "bg-success"
                        : "bg-secondary"
                    }`}
                  >

                    {
                      account.status
                    }

                  </span>

                </div>

              </div>

              <div className="text-md-end">

                <div className="small text-muted">
                  Last login
                </div>

                <strong>

                  {
                    formatDateTime(
                      account.lastLoginAt
                    )
                  }

                </strong>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          PROFILE
      ====================================================== */}

      <div className="col-lg-7">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-body p-4">

            <h5 className="fw-bold mb-1">
              Profile Information
            </h5>

            <p className="text-muted small mb-4">
              Fields marked as read-only cannot be changed here.
            </p>

            {profileError && (

              <div className="alert alert-danger">

                {
                  profileError
                }

              </div>

            )}

            {profileSuccess && (

              <div className="alert alert-success">

                {
                  profileSuccess
                }

              </div>

            )}

            <form
              onSubmit={
                handleProfileSubmit
              }
            >

              <div className="mb-3">

                <label className="form-label fw-semibold">

                  Full Name *

                </label>

                <input
                  type="text"
                  className="form-control"
                  value={
                    fullName
                  }
                  maxLength={
                    100
                  }
                  required
                  onChange={(
                    event
                  ) =>
                    setFullName(
                      event.target
                        .value
                    )
                  }
                />

              </div>

              <div className="mb-3">

                <label className="form-label fw-semibold">

                  Designation

                </label>

                <input
                  type="text"
                  className="form-control"
                  value={
                    designation
                  }
                  maxLength={
                    100
                  }
                  placeholder="Administrator"
                  onChange={(
                    event
                  ) =>
                    setDesignation(
                      event.target
                        .value
                    )
                  }
                />

              </div>

              <div className="mb-3">

                <label className="form-label fw-semibold">

                  Mobile

                </label>

                <input
                  type="tel"
                  className="form-control"
                  value={
                    mobile
                  }
                  maxLength={
                    10
                  }
                  placeholder="10 digit mobile number"
                  onChange={(
                    event
                  ) =>
                    setMobile(
                      event.target
                        .value.replace(
                          /\D/g,
                          ""
                        )
                    )
                  }
                />

              </div>

              {/* EMAIL READ ONLY */}

              <div className="mb-3">

                <label className="form-label fw-semibold">

                  Email

                </label>

                <input
                  type="email"
                  className="form-control"
                  value={
                    account.email ??
                    ""
                  }
                  disabled
                  readOnly
                />

                <div className="form-text">
                  Email is your login identifier and cannot be changed from this page.
                </div>

              </div>

              {/* ROLE READ ONLY */}

              <div className="row">

                <div className="col-md-6 mb-3">

                  <label className="form-label fw-semibold">

                    Role

                  </label>

                  <input
                    className="form-control"
                    value={
                      account.role
                    }
                    disabled
                    readOnly
                  />

                </div>

                <div className="col-md-6 mb-3">

                  <label className="form-label fw-semibold">

                    Account Status

                  </label>

                  <input
                    className="form-control"
                    value={
                      account.status
                    }
                    disabled
                    readOnly
                  />

                </div>

              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={
                  savingProfile
                }
              >

                {savingProfile ? (

                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Saving...
                  </>

                ) : (

                  <>
                    <i className="bi bi-check-lg me-2" />
                    Save Changes
                  </>

                )}

              </button>

            </form>

          </div>

        </div>

      </div>

      {/* ======================================================
          ACCOUNT INFO
      ====================================================== */}

      <div className="col-lg-5">

        <div className="card border-0 shadow-sm h-100">

          <div className="card-body p-4">

            <h5 className="fw-bold mb-3">
              Account Information
            </h5>

            <InfoRow
              label="User ID"
              value={`#${account.userId}`}
            />

            <InfoRow
              label="Profile ID"
              value={`#${account.adminProfileId}`}
            />

            <InfoRow
              label="Email"
              value={
                account.email ||
                "-"
              }
            />

            <InfoRow
              label="Mobile"
              value={
                account.mobile ||
                "-"
              }
            />

            <InfoRow
              label="Member Since"
              value={
                formatDate(
                  account.createdAt
                )
              }
            />

            <InfoRow
              label="Last Updated"
              value={
                formatDateTime(
                  account.updatedAt
                )
              }
            />

          </div>

        </div>

      </div>

      {/* ======================================================
          PASSWORD
      ====================================================== */}

      <div className="col-lg-7">

        <div className="card border-0 shadow-sm">

          <div className="card-body p-4">

            <div className="mb-4">

              <h5 className="fw-bold mb-1">
                Change Password
              </h5>

              <div className="text-muted small">
                Enter your current password before setting a new password.
              </div>

            </div>

            {passwordError && (

              <div className="alert alert-danger">

                {
                  passwordError
                }

              </div>

            )}

            {passwordSuccess && (

              <div className="alert alert-success">

                {
                  passwordSuccess
                }

              </div>

            )}

            <form
              onSubmit={
                handlePasswordSubmit
              }
            >

              {/* CURRENT */}

              <div className="mb-3">

                <label className="form-label fw-semibold">
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
                    required
                    autoComplete="current-password"
                    onChange={(
                      event
                    ) =>
                      setCurrentPassword(
                        event.target
                          .value
                      )
                    }
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
                      className={`bi ${
                        showCurrentPassword
                          ? "bi-eye-slash"
                          : "bi-eye"
                      }`}
                    />

                  </button>

                </div>

              </div>

              {/* NEW */}

              <div className="mb-3">

                <label className="form-label fw-semibold">
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
                    minLength={
                      8
                    }
                    required
                    autoComplete="new-password"
                    onChange={(
                      event
                    ) =>
                      setNewPassword(
                        event.target
                          .value
                      )
                    }
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
                      className={`bi ${
                        showNewPassword
                          ? "bi-eye-slash"
                          : "bi-eye"
                      }`}
                    />

                  </button>

                </div>

                <div className="form-text">
                  Minimum 8 characters.
                </div>

              </div>

              {/* CONFIRM */}

              <div className="mb-4">

                <label className="form-label fw-semibold">
                  Confirm New Password *
                </label>

                <input
                  type={
                    showNewPassword
                      ? "text"
                      : "password"
                  }
                  className="form-control"
                  value={
                    confirmPassword
                  }
                  minLength={
                    8
                  }
                  required
                  autoComplete="new-password"
                  onChange={(
                    event
                  ) =>
                    setConfirmPassword(
                      event.target
                        .value
                    )
                  }
                />

              </div>

              <button
                type="submit"
                className="btn btn-warning"
                disabled={
                  changingPassword
                }
              >

                {changingPassword ? (

                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Changing...
                  </>

                ) : (

                  <>
                    <i className="bi bi-key me-2" />
                    Change Password
                  </>

                )}

              </button>

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
    <div className="d-flex justify-content-between gap-3 border-bottom py-2">

      <span className="text-muted">
        {label}
      </span>

      <span className="fw-semibold text-end">
        {value}
      </span>

    </div>
  );
}

// ============================================================
// DATE
// ============================================================

function formatDate(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",
    }
  );
}

function formatDateTime(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleString(
    "en-IN",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  );
}