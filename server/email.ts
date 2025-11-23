import sgMail from "@sendgrid/mail";

// Initialize SendGrid with API key
const sendGridApiKey = process.env.SENDGRID_API_KEY;

if (!sendGridApiKey) {
  console.warn("SENDGRID_API_KEY not configured - email sending will fail");
} else {
  sgMail.setApiKey(sendGridApiKey);
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!sendGridApiKey) {
      throw new Error("SENDGRID_API_KEY is not configured");
    }

    const msg = {
      to: options.to,
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@novaguardiantech.com",
      subject: options.subject,
      html: options.html,
      text: options.text || options.html,
    };

    await sgMail.send(msg);
    console.log(`Email sent to ${options.to}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetCode: string,
  firstName?: string
): Promise<boolean> {
  const name = firstName || "Usuário";

  const html = `
    <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
            background-color: #f9f9f9;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #0066cc;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #0066cc;
            margin: 0;
            font-size: 24px;
          }
          .content {
            margin: 20px 0;
          }
          .code-box {
            background-color: #f0f0f0;
            border: 2px dashed #0066cc;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
            border-radius: 8px;
          }
          .code-box .code {
            font-size: 32px;
            font-weight: bold;
            color: #0066cc;
            font-family: 'Courier New', monospace;
            letter-spacing: 2px;
          }
          .code-box .expires {
            font-size: 12px;
            color: #666;
            margin-top: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            padding: 10px;
            border-radius: 4px;
            margin: 20px 0;
            font-size: 14px;
            color: #856404;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Recuperação de Senha</h1>
          </div>

          <div class="content">
            <p>Olá ${name},</p>

            <p>Recebemos uma solicitação para redefinir sua senha do NovaGuardianTech. Use o código abaixo para continuar:</p>

            <div class="code-box">
              <div class="code">${resetCode}</div>
              <div class="expires">Este código expira em 15 minutos</div>
            </div>

            <p>Se você não solicitou uma redefinição de senha, ignore este email. Sua conta permanecerá segura.</p>

            <div class="warning">
              ⚠️ <strong>Nunca compartilhe este código</strong> com ninguém. Nossos funcionários nunca pedirão esse código por email ou telefone.
            </div>
          </div>

          <div class="footer">
            <p>© 2024 NovaGuardianTech. Todos os direitos reservados.</p>
            <p>Se você tiver dúvidas, entre em contato com: support@novaguardiantech.com</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "🔐 Código de Recuperação de Senha - NovaGuardianTech",
    html,
    text: `Seu código de reset de senha: ${resetCode}\n\nEste código expira em 15 minutos.`,
  });
}
