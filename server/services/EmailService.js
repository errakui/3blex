/**
 * Email Service - Sistema di invio email automatizzate
 * 3Blex Network
 */

const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  /**
   * Inizializza il transporter SMTP
   */
  initialize() {
    if (this.initialized) return;

    const smtpConfig = {
      host: process.env.SMTP_HOST || 'webmailsmtp.register.it',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true per 465, false per altri
      auth: {
        user: process.env.SMTP_USER || 'noreply@3blex.net',
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false // Per server con certificati self-signed
      }
    };

    this.transporter = nodemailer.createTransport(smtpConfig);
    this.fromEmail = process.env.SMTP_FROM || 'noreply@3blex.net';
    this.fromName = process.env.SMTP_FROM_NAME || '3Blex Network';
    this.baseUrl = process.env.FRONTEND_URL || 'https://3blex-errakui-6251cccf.koyeb.app';
    this.initialized = true;

    console.log('📧 Email service initialized');
  }

  /**
   * Template base HTML per tutte le email
   */
  getBaseTemplate(content, preheader = '') {
    return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>3Blex Network</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <!-- Preheader text -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${preheader}
  </div>
  
  <!-- Email Container -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f1f5f9;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; max-width: 600px;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="text-align: center; padding-bottom: 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 16px; padding: 16px 24px;">
                    <span style="color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: -1px;">3Blex</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content Card -->
          <tr>
            <td>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);">
                <tr>
                  <td style="padding: 40px;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding-top: 30px; text-align: center;">
              <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">
                © ${new Date().getFullYear()} 3Blex Network. Tutti i diritti riservati.
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                Questa email è stata inviata automaticamente. Non rispondere a questo messaggio.
              </p>
              <p style="margin-top: 20px;">
                <a href="${this.baseUrl}" style="color: #6366f1; text-decoration: none; font-size: 12px;">Visita 3Blex</a>
                <span style="color: #cbd5e1; margin: 0 10px;">|</span>
                <a href="${this.baseUrl}/support" style="color: #6366f1; text-decoration: none; font-size: 12px;">Supporto</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Invia email di verifica account
   */
  async sendVerificationEmail(user, verificationToken) {
    this.initialize();

    const verificationUrl = `${this.baseUrl}/verify-email?token=${verificationToken}`;
    
    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981 0%, #34d399 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 40px;">✉️</span>
        </div>
        <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0 0 10px 0;">
          Verifica il tuo account
        </h1>
        <p style="color: #64748b; font-size: 16px; margin: 0;">
          Ciao <strong>${user.firstName || 'Utente'}</strong>! Benvenuto in 3Blex Network.
        </p>
      </div>
      
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
        Per completare la registrazione e attivare il tuo account, clicca sul pulsante qui sotto:
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.4);">
          ✓ Verifica Account
        </a>
      </div>
      
      <p style="color: #94a3b8; font-size: 13px; margin: 25px 0 0 0;">
        Se il pulsante non funziona, copia e incolla questo link nel browser:
      </p>
      <p style="color: #6366f1; font-size: 12px; word-break: break-all; margin: 10px 0 0 0;">
        ${verificationUrl}
      </p>
      
      <div style="border-top: 1px solid #e2e8f0; margin-top: 30px; padding-top: 20px;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          ⏰ Questo link scadrà tra 24 ore.<br>
          🔒 Se non hai creato questo account, ignora questa email.
        </p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: user.email,
        subject: '✓ Verifica il tuo account 3Blex',
        html: this.getBaseTemplate(content, 'Conferma la tua email per attivare il tuo account 3Blex Network'),
      });
      console.log(`📧 Verification email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Error sending verification email:', error);
      return false;
    }
  }

  /**
   * Invia email di benvenuto dopo verifica
   */
  async sendWelcomeEmail(user) {
    this.initialize();

    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 60px; margin-bottom: 20px;">🎉</div>
        <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0 0 10px 0;">
          Benvenuto in 3Blex Network!
        </h1>
        <p style="color: #64748b; font-size: 16px; margin: 0;">
          Il tuo account è stato verificato con successo.
        </p>
      </div>
      
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
        Ciao <strong>${user.firstName}</strong>, sei ufficialmente parte della community 3Blex! 
        Ecco cosa puoi fare ora:
      </p>
      
      <div style="background: linear-gradient(135deg, #f0f4ff 0%, #f5f3ff 100%); border-radius: 12px; padding: 20px; margin: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="padding: 10px 0;">
              <span style="color: #6366f1; font-weight: bold;">1.</span>
              <span style="color: #475569; margin-left: 10px;">Completa il tuo profilo</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0;">
              <span style="color: #6366f1; font-weight: bold;">2.</span>
              <span style="color: #475569; margin-left: 10px;">Attiva il tuo account con un acquisto</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0;">
              <span style="color: #6366f1; font-weight: bold;">3.</span>
              <span style="color: #475569; margin-left: 10px;">Inizia a costruire il tuo network</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0;">
              <span style="color: #6366f1; font-weight: bold;">4.</span>
              <span style="color: #475569; margin-left: 10px;">Guadagna commissioni!</span>
            </td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${this.baseUrl}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.4);">
          🚀 Vai alla Dashboard
        </a>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <p style="color: #64748b; font-size: 14px; margin: 0;">
          Il tuo codice referral personale:
        </p>
        <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 15px; margin-top: 10px;">
          <code style="color: #6366f1; font-size: 18px; font-weight: bold; letter-spacing: 2px;">
            ${user.referralCode || 'N/A'}
          </code>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: user.email,
        subject: '🎉 Benvenuto in 3Blex Network!',
        html: this.getBaseTemplate(content, 'Account verificato! Inizia subito a costruire il tuo network.'),
      });
      console.log(`📧 Welcome email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }

  /**
   * Invia email di reset password
   */
  async sendPasswordResetEmail(user, resetToken) {
    this.initialize();

    const resetUrl = `${this.baseUrl}/reset-password?token=${resetToken}`;
    
    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 40px;">🔐</span>
        </div>
        <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0 0 10px 0;">
          Reset Password
        </h1>
        <p style="color: #64748b; font-size: 16px; margin: 0;">
          Hai richiesto di reimpostare la tua password.
        </p>
      </div>
      
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
        Ciao <strong>${user.firstName}</strong>, clicca sul pulsante qui sotto per creare una nuova password:
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px 0 rgba(245, 158, 11, 0.4);">
          🔑 Reimposta Password
        </a>
      </div>
      
      <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <p style="color: #92400e; font-size: 13px; margin: 0;">
          ⚠️ <strong>Attenzione:</strong> Se non hai richiesto questo reset, qualcuno potrebbe aver tentato di accedere al tuo account. Ignora questa email e la tua password rimarrà invariata.
        </p>
      </div>
      
      <p style="color: #94a3b8; font-size: 12px; margin: 25px 0 0 0;">
        ⏰ Questo link scadrà tra 1 ora.
      </p>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: user.email,
        subject: '🔐 Reset Password - 3Blex',
        html: this.getBaseTemplate(content, 'Hai richiesto di reimpostare la tua password 3Blex'),
      });
      console.log(`📧 Password reset email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  /**
   * Invia notifica nuovo affiliato
   */
  async sendNewAffiliateNotification(sponsor, newUser) {
    this.initialize();

    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 60px; margin-bottom: 20px;">👥</div>
        <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0 0 10px 0;">
          Nuovo Affiliato nel tuo Team!
        </h1>
      </div>
      
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
        Ottima notizia <strong>${sponsor.firstName}</strong>! 🎉<br>
        Un nuovo membro si è unito al tuo network:
      </p>
      
      <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="color: #065f46; font-size: 18px; font-weight: 600; margin: 0;">
          ${newUser.firstName} ${newUser.lastName}
        </p>
        <p style="color: #10b981; font-size: 14px; margin: 10px 0 0 0;">
          ${newUser.email}
        </p>
      </div>
      
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 20px 0;">
        Quando questo affiliato attiverà il suo account con un acquisto, riceverai una 
        <strong style="color: #10b981;">commissione diretta del 20%!</strong>
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${this.baseUrl}/network" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600;">
          👀 Vedi il tuo Network
        </a>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: sponsor.email,
        subject: '👥 Nuovo affiliato nel tuo team!',
        html: this.getBaseTemplate(content, `${newUser.firstName} si è unito al tuo network 3Blex!`),
      });
      console.log(`📧 New affiliate notification sent to ${sponsor.email}`);
      return true;
    } catch (error) {
      console.error('Error sending new affiliate notification:', error);
      return false;
    }
  }

  /**
   * Invia notifica commissione ricevuta
   */
  async sendCommissionNotification(user, commission) {
    this.initialize();

    const typeLabels = {
      direct: 'Commissione Diretta',
      binary: 'Commissione Binaria',
      multilevel: 'Commissione Multilevel',
      rank_bonus: 'Bonus Rank',
    };

    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 60px; margin-bottom: 20px;">💰</div>
        <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0 0 10px 0;">
          Commissione Accreditata!
        </h1>
      </div>
      
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
        Ciao <strong>${user.firstName}</strong>! Hai ricevuto una nuova commissione:
      </p>
      
      <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; padding: 25px; margin: 20px 0; text-align: center;">
        <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">
          ${typeLabels[commission.type] || 'Commissione'}
        </p>
        <p style="color: #ffffff; font-size: 36px; font-weight: 700; margin: 0;">
          +€${commission.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
        </p>
      </div>
      
      ${commission.description ? `
      <p style="color: #64748b; font-size: 14px; text-align: center; margin: 20px 0;">
        ${commission.description}
      </p>
      ` : ''}
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${this.baseUrl}/wallet" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600;">
          💳 Vai al Wallet
        </a>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: user.email,
        subject: `💰 +€${commission.amount.toLocaleString('it-IT')} - Commissione ricevuta!`,
        html: this.getBaseTemplate(content, `Hai ricevuto €${commission.amount} di commissione!`),
      });
      console.log(`📧 Commission notification sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Error sending commission notification:', error);
      return false;
    }
  }

  /**
   * Invia notifica nuovo rank raggiunto
   */
  async sendRankUpNotification(user, newRank, bonus) {
    this.initialize();

    const rankEmojis = {
      BRONZE: '🥉',
      SILVER: '🥈',
      GOLD: '🥇',
      PLATINUM: '💎',
      DIAMOND: '👑',
    };

    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 80px; margin-bottom: 20px;">${rankEmojis[newRank] || '🏆'}</div>
        <h1 style="color: #0f172a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">
          Congratulazioni!
        </h1>
        <p style="color: #64748b; font-size: 18px; margin: 0;">
          Hai raggiunto il rank <strong style="color: #6366f1;">${newRank}</strong>!
        </p>
      </div>
      
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0; text-align: center;">
        <strong>${user.firstName}</strong>, il tuo impegno sta dando i suoi frutti! 
        Continua così e raggiungi nuovi traguardi.
      </p>
      
      ${bonus > 0 ? `
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 25px; margin: 20px 0; text-align: center;">
        <p style="color: #92400e; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">
          🎁 Bonus Rank Achievement
        </p>
        <p style="color: #78350f; font-size: 36px; font-weight: 700; margin: 0;">
          +€${bonus.toLocaleString('it-IT')}
        </p>
      </div>
      ` : ''}
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${this.baseUrl}/qualifications" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600;">
          🎯 Vedi Prossimo Obiettivo
        </a>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: user.email,
        subject: `${rankEmojis[newRank] || '🏆'} Congratulazioni! Sei ora ${newRank}!`,
        html: this.getBaseTemplate(content, `Hai raggiunto il rank ${newRank} in 3Blex Network!`),
      });
      console.log(`📧 Rank up notification sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Error sending rank up notification:', error);
      return false;
    }
  }

  /**
   * Invia notifica KYC approvato
   */
  async sendKYCApprovedEmail(user) {
    this.initialize();

    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981 0%, #34d399 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 40px;">✅</span>
        </div>
        <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0 0 10px 0;">
          KYC Approvato!
        </h1>
        <p style="color: #64748b; font-size: 16px; margin: 0;">
          La tua verifica identità è stata completata.
        </p>
      </div>
      
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
        Ciao <strong>${user.firstName}</strong>! La tua documentazione è stata verificata e approvata. 
        Ora puoi:
      </p>
      
      <div style="background: #ecfdf5; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #10b981; margin-right: 10px;">✓</span>
              <span style="color: #065f46;">Prelevare le tue commissioni</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #10b981; margin-right: 10px;">✓</span>
              <span style="color: #065f46;">Ricevere pagamenti senza limiti</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #10b981; margin-right: 10px;">✓</span>
              <span style="color: #065f46;">Accedere a tutte le funzionalità</span>
            </td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${this.baseUrl}/wallet" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600;">
          💳 Vai al Wallet
        </a>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: user.email,
        subject: '✅ KYC Approvato - Prelievi Sbloccati!',
        html: this.getBaseTemplate(content, 'La tua verifica KYC è stata approvata. Ora puoi prelevare!'),
      });
      console.log(`📧 KYC approved email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Error sending KYC approved email:', error);
      return false;
    }
  }

  /**
   * Invia notifica prelievo elaborato
   */
  async sendWithdrawalProcessedEmail(user, withdrawal) {
    this.initialize();

    const statusConfig = {
      completed: {
        emoji: '✅',
        title: 'Prelievo Completato!',
        color: '#10b981',
        message: 'Il tuo prelievo è stato elaborato con successo.',
      },
      rejected: {
        emoji: '❌',
        title: 'Prelievo Rifiutato',
        color: '#ef4444',
        message: 'Il tuo prelievo è stato rifiutato. Contatta il supporto per maggiori informazioni.',
      },
    };

    const config = statusConfig[withdrawal.status] || statusConfig.completed;

    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 60px; margin-bottom: 20px;">${config.emoji}</div>
        <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0 0 10px 0;">
          ${config.title}
        </h1>
      </div>
      
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
        Ciao <strong>${user.firstName}</strong>, ${config.message}
      </p>
      
      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Importo:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">
              €${withdrawal.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Metodo:</td>
            <td style="padding: 8px 0; color: #0f172a; text-align: right;">
              ${withdrawal.method === 'bank' ? 'Bonifico Bancario' : 'Crypto'}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Data:</td>
            <td style="padding: 8px 0; color: #0f172a; text-align: right;">
              ${new Date().toLocaleDateString('it-IT')}
            </td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${this.baseUrl}/wallet" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600;">
          💳 Vai al Wallet
        </a>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: user.email,
        subject: `${config.emoji} Prelievo ${withdrawal.status === 'completed' ? 'Completato' : 'Aggiornato'} - €${withdrawal.amount}`,
        html: this.getBaseTemplate(content, `Il tuo prelievo di €${withdrawal.amount} è stato elaborato.`),
      });
      console.log(`📧 Withdrawal notification sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Error sending withdrawal notification:', error);
      return false;
    }
  }

  /**
   * Test connessione SMTP
   */
  async testConnection() {
    this.initialize();
    
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified');
      return { success: true, message: 'Connessione SMTP verificata' };
    } catch (error) {
      console.error('❌ SMTP connection failed:', error);
      return { success: false, message: error.message };
    }
  }
}

module.exports = new EmailService();
