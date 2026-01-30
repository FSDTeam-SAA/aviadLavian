export type ServerLiveEmailTemplateProps = {
  appName: string;
  environment: "development" | "production" | "staging" | string;
  liveUrl: string;
};

export const serverLiveEmailTemplate = ({
  appName,
  environment,
  liveUrl,
}: ServerLiveEmailTemplateProps): string => {
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
      background-color: #f1f5f9;
      font-family: Arial, Helvetica, sans-serif;
    }

    .container {
      max-width: 520px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(90deg, #22c55e, #4ade80);
      padding: 20px;
      text-align: center;
      color: #ffffff;
      font-size: 20px;
      font-weight: 700;
    }

    .content {
      padding: 28px;
      color: #334155;
      font-size: 15px;
      line-height: 1.6;
    }

    .status-box {
      margin: 24px 0;
      text-align: center;
      background: #ecfdf5;
      border: 1px solid #86efac;
      border-radius: 12px;
      padding: 18px;
    }

    .status {
      font-size: 20px;
      font-weight: 700;
      color: #166534;
      margin-bottom: 6px;
    }

    .env {
      font-size: 13px;
      font-weight: 600;
      color: #065f46;
    }

    .link {
      display: inline-block;
      margin-top: 14px;
      font-size: 14px;
      color: #2563eb;
      word-break: break-all;
    }

    .footer {
      background: #f8fafc;
      padding: 16px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }
  </style>
</head>

<body>
  <div class="container">
    <div class="header">🚀 Server Is Live</div>

    <div class="content">
      <p>Hello Team,</p>

      <p>
        We’re happy to inform you that the <strong>${appName}</strong> server
        is now up and running successfully.
      </p>

      <div class="status-box">
        <div class="status">✅ Live & Operational</div>
        <div class="env">Environment: ${environment}</div>
        <a class="link" href="${liveUrl}" target="_blank">${liveUrl}</a>
      </div>

      <p>
        Please monitor logs and performance to ensure everything runs smoothly.
      </p>

      <p>
        Regards,<br />
        <strong>${appName} System</strong>
      </p>
    </div>

    <div class="footer">
      This is an automated system notification.
    </div>
  </div>
</body>
</html>
`;
};
