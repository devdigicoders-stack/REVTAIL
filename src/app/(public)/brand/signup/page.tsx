import BrandSignupForm from "@/components/auth/BrandSignupForm";
import "@/app/(public)/tester/signup/login.css";

export default function BrandSignupPage() {
  return (
    <div className="login-wrapper">
      <div className="container d-flex justify-content-center" style={{ maxWidth: "900px" }}>
        <div className="login-card brand-card-wide">
          <div className="text-center mb-4 pb-2 border-bottom border-light-subtle">
            <span className="auth-badge">
              <i className="bi bi-briefcase me-1"></i> Brand Partnership
            </span>
            <h1 className="login-title" style={{ fontSize: "26px" }}>
              Create Brand Account
            </h1>
            <p className="login-subtitle mb-2">
              Register your company to launch product testing campaigns and connect with verified testers.
            </p>
          </div>

          <BrandSignupForm />
        </div>
      </div>
    </div>
  );
}
