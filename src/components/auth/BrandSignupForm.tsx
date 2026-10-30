"use client";

import { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Turnstile,
  type TurnstileInstance,
} from "@marsidev/react-turnstile";

export default function BrandSignupForm() {
  const router = useRouter();

  const turnstileRef =
    useRef<TurnstileInstance | null>(null);

  const [captchaToken, setCaptchaToken] =
    useState("");

  // ============================================================
  // FORM STATE
  // ============================================================

  const [companyName, setCompanyName] =
    useState("");


  type Interest = {
    id: number;
    name: string;
  };

  const [categoryId, setCategoryId] =
    useState("");

  const [interests, setInterests] =
    useState<Interest[]>([]);

  const [
    interestsLoading,
    setInterestsLoading,
  ] = useState(true);





  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  // ============================================================
  // UI STATE
  // ============================================================

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  useEffect(() => {
    const loadInterests = async () => {
      try {
        setInterestsLoading(true);

        const response =
          await fetch(
            "/api/interests",
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Unable to load interests."
          );
        }

        const fetched =
          Array.isArray(result.data) && result.data.length > 0
            ? result.data
            : [
                { id: 1, name: "Electronics & Gadgets" },
                { id: 2, name: "Beauty & Personal Care" },
                { id: 3, name: "Fashion & Apparel" },
                { id: 4, name: "Home & Kitchen" },
                { id: 5, name: "Health & Nutrition" },
                { id: 6, name: "Food & Beverages" },
              ];

        setInterests(fetched);
      } catch (error) {
        console.warn(
          "LOAD BRAND INTERESTS (using fallback):",
          error
        );

        setInterests([
          { id: 1, name: "Electronics & Gadgets" },
          { id: 2, name: "Beauty & Personal Care" },
          { id: 3, name: "Fashion & Apparel" },
          { id: 4, name: "Home & Kitchen" },
          { id: 5, name: "Health & Nutrition" },
          { id: 6, name: "Food & Beverages" },
        ]);
      } finally {
        setInterestsLoading(false);
      }
    };

    loadInterests();
  }, []);

  // ============================================================
  // FRONTEND VALIDATION
  // ============================================================

  const validateForm = () => {
    setErrorMessage("");

    // ----------------------------------------------------------
    // Company Name
    // ----------------------------------------------------------

    if (!companyName.trim()) {
      setErrorMessage(
        "Company name is required."
      );

      return false;
    }

    // ----------------------------------------------------------
    // Category
    // ----------------------------------------------------------

    if (!categoryId) {
      setErrorMessage(
        "Company category is required."
      );

      return false;
    }

    // ----------------------------------------------------------
    // Email
    // ----------------------------------------------------------

    if (!email.trim()) {
      setErrorMessage(
        "Email address is required."
      );

      return false;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailRegex.test(
        email.trim()
      )
    ) {
      setErrorMessage(
        "Please enter a valid email address."
      );

      return false;
    }

    // ----------------------------------------------------------
    // Password
    // ----------------------------------------------------------

    if (!password) {
      setErrorMessage(
        "Password is required."
      );

      return false;
    }

    if (password.length < 8) {
      setErrorMessage(
        "Password must be at least 8 characters."
      );

      return false;
    }

    if (!confirmPassword) {
      setErrorMessage(
        "Confirm password is required."
      );

      return false;
    }

    if (
      password !==
      confirmPassword
    ) {
      setErrorMessage(
        "Password and confirm password do not match."
      );

      return false;
    }

    return true;
  };

  // ============================================================
  // FORM SUBMISSION
  // ============================================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    if (!captchaToken) {
      setErrorMessage(
        "Please complete the CAPTCHA verification."
      );
      return;
    }

    try {
      setIsLoading(true);

      const response =
        await fetch(
          "/api/brand/signup",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              companyName:
                companyName.trim(),

              // Current API/Prisma schema still requires companyType.
              // Keep the signup form simple while preserving compatibility.
              companyType:
                "Not Specified",

              categoryId:
                Number(categoryId),

              email:
                email
                  .trim()
                  .toLowerCase(),

              password,
              captchaToken,
            }),
          }
        );

      // ========================================================
      // PROTECT AGAINST NON-JSON ERROR RESPONSE
      // ========================================================

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
          "BRAND SIGNUP NON-JSON RESPONSE:",
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
          "Unable to create account. The server returned an invalid response."
        );

        turnstileRef.current?.reset();
        setCaptchaToken("");

        return;
      }

      const result =
        await response.json();

      // ========================================================
      // API ERROR
      // ========================================================
      if (!response.ok) {
          setErrorMessage(
            result.message ||
              "Unable to create Brand account."
          );

          turnstileRef.current?.reset();
          setCaptchaToken("");

          return;
        }
        setSuccessMessage(
          "Your account is under review." +
            "You will be notified once approved." 
        );
        setPassword("");
        setConfirmPassword("");
    } catch (error) {
      console.error(
        "BRAND SIGNUP ERROR:",
        error
      );

      setErrorMessage(
        "Unable to connect to the server. Please try again."
      );

      turnstileRef.current?.reset();
      setCaptchaToken("");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
    >
      {/* ==================================================== */}
      {/* ERROR */}
      {/* ==================================================== */}

      {errorMessage && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {/* ==================================================== */}
      {/* SUCCESS */}
      {/* ==================================================== */}

      {successMessage && (
        <div
          className="alert alert-success"
          role="alert"
        >
          {successMessage}
        </div>
      )}

      <div className="row g-3 g-md-4">
        {/* ==================================================== */}
        {/* COMPANY NAME */}
        {/* ==================================================== */}
        <div className="col-12 col-md-6">
          <div className="login-form-group mb-0">
            <label
              htmlFor="companyName"
              className="login-form-label"
            >
              Company Name
            </label>

            <div className="login-input-group">
              <i className="bi bi-building input-icon"></i>

              <input
                type="text"
                id="companyName"
                name="companyName"
                className="login-input"
                placeholder="Enter company name"
                value={companyName}
                onChange={(event) =>
                  setCompanyName(
                    event.target.value
                  )
                }
                disabled={isLoading}
                autoComplete="organization"
                required
              />
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* BUSINESS CATEGORY */}
        {/* ==================================================== */}
        <div className="col-12 col-md-6">
          <div className="login-form-group mb-0">
            <label
              htmlFor="categoryId"
              className="login-form-label"
            >
              Business Category
            </label>

            <div className="login-input-group">
              <i className="bi bi-tags input-icon"></i>

              <select
                id="categoryId"
                name="categoryId"
                className="login-input"
                value={categoryId}
                onChange={(event) =>
                  setCategoryId(
                    event.target.value
                  )
                }
                disabled={
                  isLoading ||
                  interestsLoading
                }
                required
              >
                <option value="">
                  {interestsLoading
                    ? "Loading categories..."
                    : "Select Business Category"}
                </option>

                {interests.map(
                  (interest) => (
                    <option
                      key={interest.id}
                      value={interest.id}
                    >
                      {interest.name}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* EMAIL */}
        {/* ==================================================== */}
        <div className="col-12">
          <div className="login-form-group mb-0">
            <label
              htmlFor="email"
              className="login-form-label"
            >
              Official Email Address
            </label>

            <div className="login-input-group">
              <i className="bi bi-envelope input-icon"></i>

              <input
                type="email"
                id="email"
                name="email"
                className="login-input"
                placeholder="name@company.com"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                disabled={isLoading}
                autoComplete="email"
                required
              />
            </div>

            <small className="form-helper-text">
              This email will be used for your Brand portal login and campaign updates.
            </small>
          </div>
        </div>

        {/* ==================================================== */}
        {/* PASSWORD */}
        {/* ==================================================== */}
        <div className="col-12 col-md-6">
          <div className="login-form-group mb-0">
            <label
              htmlFor="password"
              className="login-form-label"
            >
              Password
            </label>

            <div className="login-input-group">
              <i className="bi bi-lock input-icon"></i>

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                id="password"
                name="password"
                className="login-input login-input-password"
                placeholder="Create password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                disabled={isLoading}
                autoComplete="new-password"
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
                disabled={isLoading}
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
        </div>

        {/* ==================================================== */}
        {/* CONFIRM PASSWORD */}
        {/* ==================================================== */}
        <div className="col-12 col-md-6">
          <div className="login-form-group mb-0">
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
                name="confirmPassword"
                className="login-input login-input-password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                disabled={isLoading}
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                className="password-toggle-btn"
                aria-label={
                  showConfirmPassword
                    ? "Hide password"
                    : "Show password"
                }
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
                disabled={isLoading}
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
        </div>

        <div className="col-12 mt-1">
          <small className="form-helper-text">
            Password must be at least 8 characters long.
          </small>
        </div>

        {/* ==================================================== */}
        {/* CLOUDFLARE TURNSTILE */}
        {/* ==================================================== */}
        <div className="col-12 d-flex justify-content-center pt-2">
          <div className="captcha-wrapper">
            <Turnstile
              ref={turnstileRef}
              siteKey={
                process.env
                  .NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""
              }
              onSuccess={(token) => {
                setCaptchaToken(token);
              }}
              onExpire={() => {
                setCaptchaToken("");
              }}
              onError={(errorCode) => {
                console.error(
                  "Turnstile error:",
                  errorCode
                );

                setCaptchaToken("");

                setErrorMessage(
                  "CAPTCHA verification failed. Please try again."
                );
              }}
              options={{
                theme: "auto",
                size: "normal",
                action: "brand_signup",
              }}
            />
          </div>
        </div>

        {/* ==================================================== */}
        {/* SUBMIT */}
        {/* ==================================================== */}
        <div className="col-12 pt-2">
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
                  Creating Account...
                </span>
              </>
            ) : (
              <>
                <span>
                  Create Brand Account
                </span>

                <i className="bi bi-arrow-right"></i>
              </>
            )}
          </button>
        </div>

        {/* ==================================================== */}
        {/* LOGIN LINK */}
        {/* ==================================================== */}
        <div className="col-12 text-center pt-2">
          <span className="text-muted">
            Already registered?{" "}
          </span>

          <Link
            href="/login"
            className="forgot-password-link"
          >
            Sign In &rarr;
          </Link>
        </div>
      </div>
    </form>
  );
}