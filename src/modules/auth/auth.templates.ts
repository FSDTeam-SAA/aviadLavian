export const forgotPasswordOtpTemplate = (
  name: string,
  otp: string
): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #eef2ff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    }

    .wrapper {
      padding: 40px 16px;
    }

    .card {
      max-width: 520px;
      margin: auto;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(79, 70, 229, 0.15);
      overflow: hidden;
    }

    .top-bar {
      height: 6px;
      background: linear-gradient(90deg, #6366f1, #22d3ee);
    }

    .content {
      padding: 32px 28px;
      color: #1f2937;
    }

    .logo {
      font-size: 20px;
      font-weight: 700;
      color: #4f46e5;
      margin-bottom: 20px;
      text-align: center;
    }

    .content p {
      font-size: 15px;
      line-height: 1.7;
      margin: 0 0 18px;
      color: #374151;
    }

    .otp-section {
      text-align: center;
      margin: 30px 0;
    }

    .otp-label {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .otp {
      display: inline-block;
      padding: 16px 36px;
      font-size: 30px;
      letter-spacing: 8px;
      font-weight: 800;
      color: #111827;
      background: linear-gradient(135deg, #eef2ff, #f8fafc);
      border-radius: 12px;
      border: 1px solid #e0e7ff;
    }

    .expiry {
      margin-top: 14px;
      font-size: 14px;
      color: #dc2626;
      font-weight: 600;
    }

    .note {
      font-size: 14px;
      color: #6b7280;
      background: #f9fafb;
      padding: 14px;
      border-radius: 10px;
      margin-top: 24px;
    }

    .footer {
      padding: 18px;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
      background: #f9fafb;
    }

    .brand {
      color: #4f46e5;
      font-weight: 600;
    }
  </style>
</head>

<body>
  <div class="wrapper">
    <div class="card">
      <div class="top-bar"></div>

      <div class="content">
        <div class="logo">VIRUS COMPUTER</div>

        <p>Hi <strong>${name}</strong>,</p>

        <p>
          We received a request to reset your password.  
          Please use the verification code below to continue.
        </p>

        <div class="otp-section">
          <div class="otp-label">Your One-Time Password</div>
          <div class="otp">${otp}</div>
          <div class="expiry">⏳ Valid for 10 minutes only</div>
        </div>

        <div class="note">
          If you did not request a password reset, no action is required.
          Your account remains secure.
        </div>

        <p style="margin-top: 24px;">
          Regards,<br />
          <span class="brand">VIRUS COMPUTER Team</span>
        </p>
      </div>

      <div class="footer">
        This is an automated email. Please do not reply.
      </div>
    </div>
  </div>
</body>
</html>
`;
};

export const accountVerifyTemplate = (name: string, otp: number |null): any => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify Your Account</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: Arial, Helvetica, sans-serif;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .header {
      background: #2563eb;
      color: #ffffff;
      padding: 20px;
      text-align: center;
      font-size: 22px;
      font-weight: bold;
    }
    .content {
      padding: 30px;
      color: #333;
      line-height: 1.6;
    }
    .otp {
      margin: 24px 0;
      text-align: center;
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 6px;
      color: #2563eb;
    }
    .footer {
      padding: 20px;
      background: #f9fafb;
      text-align: center;
      font-size: 13px;
      color: #777;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      Account Verification
    </div>
    <div class="content">
      <p>Hello <strong>${name}</strong>,</p>
      <p>Please use the OTP below to verify your account:</p>

      <div class="otp">${otp}</div>

      <p>This OTP is valid for <strong>10 minutes</strong>.</p>
      <p>If you didn’t request this, please ignore this email.</p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Your App Name
    </div>
  </div>
</body>
</html>
`;
};
