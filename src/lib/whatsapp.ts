type WhatsAppTemplateParameter = {
  type: "text";
  text: string;
};

type SendWhatsAppTemplateInput = {
  to: string;

  templateName: string;

  parameters?: string[];

  languageCode?: string;

  callbackData?: string;

  buttonUrlParameter?: string;
};

type WhatsAppApiResponse = {
  messaging_product?: string;

  contacts?: unknown[];

  messages?: unknown[];

  error?: unknown;

  [key: string]: unknown;
};

// ============================================================
// NORMALIZE MOBILE
//
// WhatsApp expects:
//
// 919807082896
//
// not:
//
// +91 98070 82896
// ============================================================

function normalizeWhatsAppMobile(
  mobile: string
) {
  let value =
    String(mobile)
      .trim()
      .replace(/\D/g, "");

  // Indian 10-digit mobile
  if (
    /^\d{10}$/.test(
      value
    )
  ) {
    value =
      `91${value}`;
  }

  return value;
}

// ============================================================
// SEND WHATSAPP TEMPLATE
// ============================================================

export async function sendWhatsAppTemplate({
  to,

  templateName,

  parameters = [],

  languageCode =
    "en",

  callbackData,

  buttonUrlParameter,
}: SendWhatsAppTemplateInput) {
  const apiUrl =
    process.env
      .WHATSAPP_API_URL;

  const apiToken =
    process.env
      .WHATSAPP_API_TOKEN;

  if (!apiUrl) {
    throw new Error(
      "WHATSAPP_API_URL is not configured."
    );
  }

  if (!apiToken) {
    throw new Error(
      "WHATSAPP_API_TOKEN is not configured."
    );
  }

  const mobile =
    normalizeWhatsAppMobile(
      to
    );

  if (
    !/^\d{11,15}$/.test(
      mobile
    )
  ) {
    throw new Error(
      "Invalid WhatsApp mobile number."
    );
  }

  if (
    !templateName.trim()
  ) {
    throw new Error(
      "WhatsApp template name is required."
    );
  }

  const bodyParameters:
    WhatsAppTemplateParameter[] =
    parameters.map(
      (
        value
      ) => ({
        type:
          "text",

        text:
          String(
            value
          ),
      })
    );

  const components:
    Record<string, unknown>[] = [];

  if (
    bodyParameters.length >
    0
  ) {
    components.push({
      type:
        "body",

      parameters:
        bodyParameters,
    });
  }

  if (
    buttonUrlParameter
  ) {
    components.push({
      type:
        "button",

      sub_type:
        "url",

      index:
        "0",

      parameters: [
        {
          type:
            "text",

          text:
            String(
              buttonUrlParameter
            ),
        },
      ],
    });
  }

  const payload: Record<
    string,
    unknown
  > = {
    messaging_product:
      "whatsapp",

    recipient_type:
      "individual",

    to:
      mobile,

    type:
      "template",

    template: {
      name:
        templateName,

      language: {
        code:
          languageCode,
      },

      components,
    },
  };

  if (
    callbackData
  ) {
    payload.biz_opaque_callback_data =
      callbackData;
  }

  const response =
    await fetch(
      apiUrl,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${apiToken}`,
        },

        body:
          JSON.stringify(
            payload
          ),

        cache:
          "no-store",
      }
    );

  let result:
    WhatsAppApiResponse;

  try {
    result =
      await response.json();
  } catch {
    throw new Error(
      `WhatsApp API returned invalid JSON. HTTP ${response.status}.`
    );
  }

  if (
    !response.ok
  ) {
    console.error(
      "WHATSAPP API ERROR:",
      result
    );

    // Surface the provider's actual response instead of only HTTP 400.
    // Do not log credentials or the outgoing payload.
    const apiError =
      result.error;

    const providerMessage =
      typeof apiError === "string"
        ? apiError
        : apiError && typeof apiError === "object"
          ? [
              "message" in apiError &&
              typeof apiError.message === "string"
                ? apiError.message
                : null,
              "error_data" in apiError &&
              apiError.error_data &&
              typeof apiError.error_data === "object" &&
              "details" in apiError.error_data &&
              typeof apiError.error_data.details === "string"
                ? apiError.error_data.details
                : null,
            ].filter(Boolean).join(" — ")
          : "";

    const fallbackMessage =
      typeof result.message === "string"
        ? result.message
        : "";

    throw new Error(
      `WhatsApp message failed. HTTP ${response.status}. ${providerMessage || fallbackMessage || JSON.stringify(result)}`.trim()
    );
  }

  return {
    success:
      true,

    data:
      result,
  };
}