import TesterSignupForm from "@/components/auth/TesterSignupForm";
import "./login.css";

export default function TesterSignupPage() {
  return (
    <div className="login-wrapper">
      <div className="container d-flex justify-content-center" style={{ maxWidth: "900px" }}>
        <div className="login-card tester-card-wide">
          <div className="text-center mb-4 pb-2 border-bottom border-light-subtle">
            <span className="auth-badge">
              <i className="bi bi-person-check me-1"></i> Tester Community
            </span>
            <h1 className="login-title" style={{ fontSize: "26px" }}>
              Create Tester Account
            </h1>
            <p className="login-subtitle mb-2">
              Register using your mobile number to test authentic products and receive guaranteed cash rewards.
            </p>
          </div>

          <TesterSignupForm />
        </div>
      </div>
    </div>
  );
}
