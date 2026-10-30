"use client";

import { useState, useRef } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  Turnstile,
  type TurnstileInstance,
} from "@marsidev/react-turnstile";

export default function LoginForm() {
  const router = useRouter();

  const turnstileRef =
    useRef<TurnstileInstance | null>(null);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  /*
   * identifier can be:
   *
   * ADMIN / BRAND -> Email
   * TESTER        -> Mobile
   */
  const [
    identifier,
    setIdentifier,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    captchaToken,
    setCaptchaToken,
  ] = useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  /*
   * --------------------------------------------------
   * FRONTEND IDENTIFIER VALIDATION
   * --------------------------------------------------
   */
  const validateIdentifier = () => {
    const value =
      identifier.trim();

    if (!value) {
      setErrorMessage(
        "Email address or mobile number is required."
      );

      return false;
    }

    /*
     * Email format
     */
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    /*
     * Mobile format
     *
     * Accept:
     * 9818712325
     * +919818712325
     *
     * Also allow spaces / hyphens
     * before normalization.
     */
    const normalizedMobile =
      value.replace(
        /[\s-]/g,
        ""
      );

    const mobileRegex =
      /^(\+91)?[6-9]\d{9}$/;

    const isEmail =
      emailRegex.test(value);

    const isMobile =
      mobileRegex.test(
        normalizedMobile
      );

    if (
      !isEmail &&
      !isMobile
    ) {
      setErrorMessage(
        "Please enter a valid email address or mobile number."
      );

      return false;
    }

    return true;
  };

  /*
   * --------------------------------------------------
   * LOGIN SUBMIT
   * --------------------------------------------------
   */
  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setErrorMessage("");

    /*  
     * Identifier validation
     */
    if (!validateIdentifier()) {
      return;
    }

    /*
     * Password validation
     */
    if (!password) {
      setErrorMessage(
        "Password is required."
      );

      return;
    }

    /*
     * CAPTCHA validation
     */
    if (!captchaToken) {
      setErrorMessage(
        "Please complete the CAPTCHA verification."
      );

      return;
    }

    try {
      setIsLoading(true);

      /*
       * Call Login API
       */
      const response =
        await fetch(
          "/api/login",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              identifier:
                identifier.trim(),

              password,

              captchaToken,
            }),
          }
        );

      /*
       * Protect against HTML / invalid server response.
       */
      const contentType =
        response.headers.get(
          "content-type"
        );

      if (
        !contentType?.includes(
          "application/json"
        )
      ) {
        const responseText =
          await response.text();

        console.error(
          "LOGIN NON-JSON RESPONSE:",
          {
            status:
              response.status,

            url:
              response.url,

            response:
              responseText,
          }
        );

        setErrorMessage(
          "Unable to login. Server returned an invalid response."
        );

        turnstileRef.current?.reset();
        setCaptchaToken("");

        return;
      }

      const result =
        await response.json();

      /*
       * API error
       */
      if (!response.ok) {
        setErrorMessage(
          result.message ||
            "Login failed."
        );

        /*
         * Turnstile token is single-use,
         * so reset after failed login.
         */
        turnstileRef.current?.reset();

        setCaptchaToken("");

        return;
      }

      /*
       * Get role
       */
      const role =
        result.data?.role;

      if (!role) {
        setErrorMessage(
          "Unable to determine user role."
        );

        return;
      }

      /*
       * ------------------------------------------------
       * ROLE-BASED REDIRECT
       * ------------------------------------------------
       */

      switch (role) {
        case "ADMIN":
          router.replace(
            "/admin"
          );
          break;

        case "BRAND":
          router.replace(
            "/brand"
          );
          break;

        case "TESTER":
          router.replace(
            "/tester"
          );
          break;

        default:
          setErrorMessage(
            "Invalid user role."
          );

          return;
      }

      /*
       * Refresh server components
       * so authenticated cookie is reflected.
       */
      router.refresh();
    } catch (error) {
      console.error(
        "LOGIN FORM ERROR:",
        error
      );

      setErrorMessage(
        "Unable to connect to the server. Please try again."
      );

      /*
       * Reset CAPTCHA after request failure.
       */
      turnstileRef.current?.reset();

      setCaptchaToken("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
    >
      {/* ERROR MESSAGE */}

      {errorMessage && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {/* ========================================= */}
      {/* EMAIL / MOBILE */}
      {/* ========================================= */}

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
                event.target.value
              )
            }
            disabled={
              isLoading
            }
            autoComplete="username"
            required
          />
        </div>
      </div>

      {/* ========================================= */}
      {/* PASSWORD */}
      {/* ========================================= */}

      <div className="login-form-group">
        <label
          htmlFor="password"
          className="login-form-label"
        >
          Password
        </label>

        <div className="login-input-group">
          <i className="bi bi-shield-lock input-icon"></i>

          <input
            type={
              showPassword
                ? "text"
                : "password"
            }
            id="password"
            name="password"
            className="login-input login-input-password"
            placeholder="••••••••"
            value={password}
            onChange={(
              event
            ) =>
              setPassword(
                event.target.value
              )
            }
            disabled={
              isLoading
            }
            autoComplete="current-password"
            required
          />

          <button
            type="button"
            className="password-toggle-btn"
            aria-label={
              showPassword
                ? "Hide password"
                : "Show password"
            }
            onClick={() =>
              setShowPassword(
                !showPassword
              )
            }
            disabled={
              isLoading
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

      {/* ========================================= */}
      {/* FORGOT PASSWORD */}
      {/* ========================================= */}

      <div className="login-options">
        <span></span>

        <Link
          href="/forgot-password"
          className="forgot-password-link"
        >
          Forgot Password?
        </Link>
      </div>

      {/* ========================================= */}
      {/* CLOUDFLARE TURNSTILE */}
      {/* ========================================= */}

      <div className="captcha-wrapper">
        <Turnstile
          ref={
            turnstileRef
          }

          siteKey={
            process.env
              .NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
            ""
          }

          onSuccess={(
            token
          ) => {
            setCaptchaToken(
              token
            );
          }}

          onExpire={() => {
            setCaptchaToken(
              ""
            );
          }}

          onError={(
            errorCode
          ) => {
            console.error(
              "Turnstile error:",
              errorCode
            );

            setCaptchaToken(
              ""
            );

            setErrorMessage(
              "CAPTCHA verification failed. Please try again."
            );
          }}

          options={{
            theme:
              "auto",

            size:
              "normal",

            action:
              "login",
          }}
        />
      </div>

      {/* ========================================= */}
      {/* LOGIN BUTTON */}
      {/* ========================================= */}

      <button
        type="submit"
        className="btn-login"
        disabled={
          isLoading ||
          !captchaToken
        }
      >
        {isLoading ? (
          <>
            <span
              className="spinner-border spinner-border-sm"
              aria-hidden="true"
            ></span>

            <span>
              Signing In...
            </span>
          </>
        ) : (
          <>
            <span>
              Sign In to Dashboard
            </span>

            <i className="bi bi-arrow-right"></i>
          </>
        )}
      </button>
    </form>
  );
}
