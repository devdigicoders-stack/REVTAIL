import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASSWORD;
const smtpFrom = process.env.SMTP_FROM || smtpUser;

if (
  !smtpHost ||
  !smtpUser ||
  !smtpPass
) {
  console.warn(
    "SMTP configuration is incomplete. Email sending will fail until SMTP_HOST, SMTP_USER and SMTP_PASS are configured."
  );
}

const transporter =
  nodemailer.createTransport({
    host: smtpHost,

    port: smtpPort,

    secure:
      smtpPort === 465,

    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

type BrandStatusEmailInput = {
  to: string;

  companyName: string;

  status:
    | "ACTIVE"
    | "REJECTED";

  rejectionReason?: string | null;
};

export async function sendBrandStatusEmail({
  to,
  companyName,
  status,
  rejectionReason,
}: BrandStatusEmailInput) {
  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error(
      "SMTP configuration is incomplete."
    );
  }

  if (status === "ACTIVE") {
    return transporter.sendMail({
      from: smtpFrom,

      to,

      subject:
        "Your Revtail Brand Account Has Been Approved",

      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222">
          <h2>Brand Account Approved</h2>

          <p>Dear ${escapeHtml(companyName)},</p>

          <p>
            Your Brand account on <strong>Revtail</strong>
            has been approved by our Admin team.
          </p>

          <p>
            You can now log in to your Brand dashboard and
            use the available Brand features.
          </p>

          <p>
            Regards,<br />
            Revtail Team
          </p>
        </div>
      `,
    });
  }

  return transporter.sendMail({
    from: smtpFrom,

    to,

    subject:
      "Update Regarding Your Revtail Brand Registration",

    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222">
        <h2>Brand Registration Rejected</h2>

        <p>Dear ${escapeHtml(companyName)},</p>

        <p>
          Your Brand registration on <strong>Revtail</strong>
          could not be approved.
        </p>

        ${
          rejectionReason
            ? `
              <p>
                <strong>Reason:</strong><br />
                ${escapeHtml(rejectionReason)}
              </p>
            `
            : ""
        }

        <p>
          Regards,<br />
          Revtail Team
        </p>
      </div>
    `,
  });
}


type CampaignStatusEmailInput = {
  to: string;
  companyName: string;
  campaignCode: string;
  productName: string;
  status: "LIVE" | "REJECTED";
  rejectionReason?: string | null;
};

export async function sendCampaignStatusEmail({
  to,
  companyName,
  campaignCode,
  productName,
  status,
  rejectionReason,
}: CampaignStatusEmailInput) {
  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error(
      "SMTP configuration is incomplete."
    );
  }

  if (!to?.trim()) {
    throw new Error(
      "Brand email address is required."
    );
  }

  const safeCompanyName =
    escapeHtml(companyName);

  const safeCampaignCode =
    escapeHtml(campaignCode);

  const safeProductName =
    escapeHtml(productName);

  if (status === "LIVE") {
    return transporter.sendMail({
      from: smtpFrom,
      to,
      subject:
        `Campaign Approved and LIVE - ${campaignCode}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222">
          <h2>Campaign Approved</h2>

          <p>Dear ${safeCompanyName},</p>

          <p>
            Your campaign on <strong>Revtail</strong> has been
            approved by the Admin team and is now
            <strong>LIVE</strong>.
          </p>

          <p>
            <strong>Campaign Code:</strong>
            ${safeCampaignCode}
            <br />
            <strong>Product:</strong>
            ${safeProductName}
          </p>

          <p>
            Testers can now view and apply for the campaign
            based on the configured eligibility criteria.
          </p>

          <p>
            Regards,<br />
            Revtail Team
          </p>
        </div>
      `,
    });
  }

  return transporter.sendMail({
    from: smtpFrom,
    to,
    subject:
      `Campaign Rejected - ${campaignCode}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222">
        <h2>Campaign Rejected</h2>

        <p>Dear ${safeCompanyName},</p>

        <p>
          Your campaign on <strong>Revtail</strong>
          could not be approved.
        </p>

        <p>
          <strong>Campaign Code:</strong>
          ${safeCampaignCode}
          <br />
          <strong>Product:</strong>
          ${safeProductName}
        </p>

        ${
          rejectionReason
            ? `
              <p>
                <strong>Reason:</strong><br />
                ${escapeHtml(rejectionReason)}
              </p>
            `
            : ""
        }

        <p>
          Please review the campaign details and make
          the required corrections before submitting
          again, if applicable.
        </p>

        <p>
          Regards,<br />
          Revtail Team
        </p>
      </div>
    `,
  });
}

type CampaignCompletedEmailInput = {
  to: string;
  companyName: string;
  campaignCode: string;
  productName: string;
};

export async function sendCampaignCompletedEmail({
  to,
  companyName,
  campaignCode,
  productName,
}: CampaignCompletedEmailInput) {
  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error("SMTP configuration is incomplete.");
  }

  if (!to?.trim()) {
    throw new Error("Brand email address is required.");
  }

  return transporter.sendMail({
    from: smtpFrom,
    to,
    subject: `Campaign Completed - ${campaignCode}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222">
        <h2>Campaign Completed</h2>

        <p>Dear ${escapeHtml(companyName)},</p>

        <p>
          Your campaign on <strong>Revtail</strong> has been marked
          as <strong>COMPLETED</strong> by the Admin team.
        </p>

        <p>
          <strong>Campaign Code:</strong> ${escapeHtml(campaignCode)}<br />
          <strong>Product:</strong> ${escapeHtml(productName)}
        </p>

        <p>
          All campaign activities are now closed.
        </p>

        <p>
          Regards,<br />
          Revtail Team
        </p>
      </div>
    `,
  });
}


function escapeHtml(
  value: string
) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}