"use client";

import {
  useEffect,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import Link from "next/link";

type Step =
  | "IDENTIFIER"
  | "OTP"
  | "PASSWORD"
  | "SUCCESS";

export default function ForgotPasswordForm() {
  const [step, setStep] =
    useState<Step>("IDENTIFIER");

  const [
    identifier,
    setIdentifier,
  ] = useState("");

  const [otp, setOtp] =
    useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    resendSeconds,
    setResendSeconds,
  ] = useState(0);

  const isMobile =
    /^(\+91)?[6-9]\d{9}$/.test(
      identifier
        .trim()
        .replace(/[\s-]/g, "")
    );

  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          setResendSeconds(
            (current) =>
              current > 0
                ? current - 1
                : 0
          );
        },
        1000
      );

    return () =>
      window.clearInterval(timer);
  }, [resendSeconds]);

  const validateIdentifier =
    () => {
      const value =
        identifier.trim();

      if (!value) {
        setErrorMessage(
          "Email address or mobile number is required."
        );
        return false;
      }

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      const mobileRegex =
        /^(\+91)?[6-9]\d{9}$/;

      const mobileValue =
        value.replace(
          /[\s-]/g,
          ""
        );

      if (
        !emailRegex.test(value) &&
        !mobileRegex.test(
          mobileValue
        )
      ) {
        setErrorMessage(
          "Please enter a valid email address or 10-digit mobile number."
        );
        return false;
      }

      return true;
    };

  const sendOtp =
    async () => {
      setErrorMessage("");
      setSuccessMessage("");

      if (!validateIdentifier()) {
        return;
      }

      try {
        setIsLoading(true);

        const response =
          await fetch(
            "/api/forgot-password",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body:
                JSON.stringify({
                  identifier:
                    identifier.trim(),
                }),
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          setErrorMessage(
            result.message ||
              "Unable to send OTP."
          );

          if (result.retryAfter) {
            setResendSeconds(
              Number(
                result.retryAfter
              )
            );
          }

          return;
        }

        setOtp("");
        setResendSeconds(
          Number(
            result.resendAfter ??
              60
          )
        );

        setSuccessMessage(
          result.message ||
            (
              isMobile
                ? "OTP sent to your registered WhatsApp number."
                : "OTP sent to your registered email address."
            )
        );

        setStep("OTP");
      } catch (error) {
        console.error(
          "FORGOT PASSWORD SEND OTP ERROR:",
          error
        );

        setErrorMessage(
          "Unable to connect to the server. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    };

  const verifyOtp =
    async () => {
      setErrorMessage("");
      setSuccessMessage("");

      if (!/^\d{6}$/.test(otp)) {
        setErrorMessage(
          "Please enter the 6-digit OTP."
        );
        return;
      }

      try {
        setIsLoading(true);

        const response =
          await fetch(
            "/api/verify-reset-otp",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body:
                JSON.stringify({
                  identifier:
                    identifier.trim(),
                  otp,
                }),
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          setErrorMessage(
            result.message ||
              "Invalid OTP."
          );
          return;
        }

        setSuccessMessage(
          result.message ||
            "OTP verified successfully."
        );

        setStep("PASSWORD");
      } catch (error) {
        console.error(
          "VERIFY RESET OTP ERROR:",
          error
        );

        setErrorMessage(
          "Unable to verify OTP. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    };

  const resetPassword =
    async () => {
      setErrorMessage("");
      setSuccessMessage("");

      if (!newPassword) {
        setErrorMessage(
          "New password is required."
        );
        return;
      }

      if (newPassword.length < 8) {
        setErrorMessage(
          "Password must be at least 8 characters."
        );
        return;
      }

      if (!confirmPassword) {
        setErrorMessage(
          "Confirm password is required."
        );
        return;
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        setErrorMessage(
          "Password and confirm password do not match."
        );
        return;
      }

      try {
        setIsLoading(true);

        const response =
          await fetch(
            "/api/reset-password",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body:
                JSON.stringify({
                  newPassword,
                  confirmPassword,
                }),
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          setErrorMessage(
            result.message ||
              "Unable to reset password."
          );
          return;
        }

        setSuccessMessage(
          result.message ||
            "Password reset successfully."
        );

        setNewPassword("");
        setConfirmPassword("");
        setStep("SUCCESS");
      } catch (error) {
        console.error(
          "RESET PASSWORD ERROR:",
          error
        );

        setErrorMessage(
          "Unable to reset password. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    };

  const handleSubmit = async (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      step === "IDENTIFIER"
    ) {
      await sendOtp();
      return;
    }

    if (step === "OTP") {
      await verifyOtp();
      return;
    }

    if (
      step === "PASSWORD"
    ) {
      await resetPassword();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
    >
      {errorMessage && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          className="alert alert-success"
          role="alert"
        >
          {successMessage}
        </div>
      )}

      {step === "IDENTIFIER" && (
        <>
          <div className="login-form-group">
            <label
              htmlFor="identifier"
              className="login-form-label"
            >
              Email or Mobile Number
            </label>

            <div className="login-input-group">
              <i className="bi bi-person input-icon"></i>

              <input
                type="text"
                id="identifier"
                name="identifier"
                className="login-input"
                placeholder="Email address or mobile number"
                value={identifier}
                onChange={(
                  event
                ) =>
                  setIdentifier(
                    event.target
                      .value
                  )
                }
                disabled={
                  isLoading
                }
                autoComplete="username"
                required
              />
            </div>

            {/* <small className="text-muted">
              Brand/Admin: use your registered email. Tester: use your registered mobile number.
            </small> */}
          </div>

          <button
            type="submit"
            className="btn-login"
            disabled={isLoading}
          >
            {isLoading
              ? "Sending OTP..."
              : "Send OTP"}
          </button>
        </>
      )}

      {step === "OTP" && (
        <>
          <div className="login-form-group">
            <label
              htmlFor="otp"
              className="login-form-label"
            >
              Verification OTP
            </label>

            <div className="login-input-group">
              <i className="bi bi-shield-lock input-icon"></i>

              <input
                type="text"
                id="otp"
                className="login-input"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(
                  event
                ) =>
                  setOtp(
                    event.target
                      .value
                      .replace(
                        /\D/g,
                        ""
                      )
                      .slice(
                        0,
                        6
                      )
                  )
                }
                disabled={
                  isLoading
                }
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
              />
            </div>

            <small className="text-muted">
              {isMobile
                ? "Enter the OTP sent to your registered WhatsApp number."
                : "Enter the OTP sent to your registered email address."}
            </small>
          </div>

          <button
            type="submit"
            className="btn-login"
            disabled={
              isLoading ||
              otp.length !== 6
            }
          >
            {isLoading
              ? "Verifying..."
              : "Verify OTP"}
          </button>

          <div className="text-center mt-3">
            <button
              type="button"
              className="btn btn-link p-0"
              disabled={
                isLoading ||
                resendSeconds > 0
              }
              onClick={sendOtp}
            >
              {resendSeconds > 0
                ? `Resend OTP in ${resendSeconds}s`
                : "Resend OTP"}
            </button>
          </div>
        </>
      )}

      {step === "PASSWORD" && (
        <>
          <div className="login-form-group">
            <label
              htmlFor="newPassword"
              className="login-form-label"
            >
              New Password
            </label>

            <div className="login-input-group">
              <i className="bi bi-lock input-icon"></i>

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                id="newPassword"
                className="login-input login-input-password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(
                  event
                ) =>
                  setNewPassword(
                    event.target
                      .value
                  )
                }
                disabled={isLoading}
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                className="password-toggle-btn"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                disabled={isLoading}
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                <i
                  className={
                    showPassword
                      ? "bi bi-eye-slash"
                      : "bi bi-eye"
                  }
                ></i>
              </button>
            </div>
          </div>

          <div className="login-form-group">
            <label
              htmlFor="confirmPassword"
              className="login-form-label"
            >
              Confirm Password
            </label>

            <div className="login-input-group">
              <i className="bi bi-shield-check input-icon"></i>

              <input
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                id="confirmPassword"
                className="login-input login-input-password"
                placeholder="Confirm new password"
                value={
                  confirmPassword
                }
                onChange={(
                  event
                ) =>
                  setConfirmPassword(
                    event.target
                      .value
                  )
                }
                disabled={isLoading}
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                className="password-toggle-btn"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
                disabled={isLoading}
                aria-label={
                  showConfirmPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                <i
                  className={
                    showConfirmPassword
                      ? "bi bi-eye-slash"
                      : "bi bi-eye"
                  }
                ></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-login"
            disabled={isLoading}
          >
            {isLoading
              ? "Resetting Password..."
              : "Reset Password"}
          </button>
        </>
      )}

      {step === "SUCCESS" && (
        <div className="text-center">
          <p className="mb-3">
            Your password has been reset successfully.
          </p>

          <Link
            href="/login"
            className="btn-login d-inline-flex justify-content-center text-decoration-none"
          >
            Sign In
          </Link>
        </div>
      )}
    </form>
  );
}
