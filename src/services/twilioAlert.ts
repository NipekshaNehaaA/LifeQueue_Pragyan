interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

interface SMSResponse {
  success: boolean;
  messageSid?: string;
  error?: string;
}

/**
 * Sends an SMS notification via Twilio API
 * @param to - Recipient phone number (E.164 format: +1234567890)
 * @param body - Message content
 * @returns Promise with success status and message SID or error
 */
export async function sendTwilioSMS(
  to: string,
  body: string
): Promise<SMSResponse> {
  // Get Twilio credentials from environment variables
  const config: TwilioConfig = {
    accountSid: import.meta.env.VITE_TWILIO_SID || "",
    authToken: import.meta.env.VITE_TWILIO_TOKEN || "",
    fromNumber: import.meta.env.VITE_TWILIO_FROM || "",
  };

  // Validate configuration
  if (!config.accountSid || !config.authToken || !config.fromNumber) {
    console.warn("Twilio credentials not configured");
    return {
      success: false,
      error: "Twilio credentials not configured",
    };
  }

  // Validate phone number format
  if (!isValidPhoneNumber(to)) {
    return {
      success: false,
      error: "Invalid phone number format. Use E.164 format: +1234567890",
    };
  }

  try {
    // Construct Twilio API endpoint
    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;

    // Create Basic Auth header
    const credentials = btoa(`${config.accountSid}:${config.authToken}`);

    // Prepare form data
    const formData = new URLSearchParams();
    formData.append("From", config.fromNumber);
    formData.append("To", to);
    formData.append("Body", body);

    // Make API request
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `Twilio API error: ${response.status}`
      );
    }

    const data = await response.json();

    return {
      success: true,
      messageSid: data.sid,
    };
  } catch (error) {
    console.error("Failed to send SMS:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Validates phone number format (E.164)
 * @param phoneNumber - Phone number to validate
 * @returns true if valid E.164 format
 */
function isValidPhoneNumber(phoneNumber: string): boolean {
  // E.164 format: +[country code][number]
  // Example: +14155552671
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
}

/**
 * Sends a high-risk patient alert to medical staff
 * @param patientName - Name of the patient
 * @param riskScore - Calculated risk score
 * @param department - Recommended department
 * @param doctorPhone - Doctor's phone number
 * @returns Promise with SMS send result
 */
export async function sendHighRiskAlert(
  patientName: string,
  riskScore: number,
  department: string,
  doctorPhone: string
): Promise<SMSResponse> {
  const message = `🚨 CRITICAL ALERT - LifeQueue
  
Patient: ${patientName}
Risk Level: HIGH (${riskScore} pts)
Department: ${department}

Immediate attention required.
Review patient details in system.`;

  return sendTwilioSMS(doctorPhone, message);
}

/**
 * Sends a test SMS to verify Twilio configuration
 * @param testPhone - Phone number to send test message
 * @returns Promise with SMS send result
 */
export async function sendTestSMS(testPhone: string): Promise<SMSResponse> {
  const message = "Test message from LifeQueue. Twilio SMS is configured correctly.";
  return sendTwilioSMS(testPhone, message);
}

/**
 * Checks if Twilio is properly configured
 * @returns true if all credentials are present
 */
export function isTwilioConfigured(): boolean {
  const accountSid = import.meta.env.VITE_TWILIO_SID;
  const authToken = import.meta.env.VITE_TWILIO_TOKEN;
  const fromNumber = import.meta.env.VITE_TWILIO_FROM;

  return !!(accountSid && authToken && fromNumber);
}
