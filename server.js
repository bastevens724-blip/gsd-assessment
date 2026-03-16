require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Serve the assessment HTML at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'gsd-assessment.html'));
});

// Build the HTML email body from the lead payload
function buildEmailHtml(p) {
  const insights = (p.insights || [])
    .map(i => `
      <tr>
        <td style="padding:6px 0;">
          <strong>${i.icon || ''} ${i.title || ''}</strong><br>
          <span style="color:#555;">${i.body || ''}</span>
        </td>
      </tr>`)
    .join('');

  const ratingRow = (label, val) =>
    `<tr><td style="padding:3px 8px;color:#555;width:220px;">${label}</td><td style="padding:3px 8px;"><strong>${val || '—'}</strong></td></tr>`;

  const listVal = (arr) => Array.isArray(arr) && arr.length ? arr.join(', ') : '—';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f4f4f4;margin:0;padding:0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
  <tr><td align="center">
    <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

      <!-- Header -->
      <tr><td style="background:#0B1829;padding:28px 36px;">
        <h1 style="margin:0;color:#E8A020;font-size:22px;letter-spacing:-0.3px;">GSD — New Assessment Lead</h1>
        <p style="margin:6px 0 0;color:#8BA0B8;font-size:13px;">Submitted ${new Date(p.submittedAt).toLocaleString('en-US', { dateStyle:'long', timeStyle:'short' })}</p>
      </td></tr>

      <!-- Score banner -->
      <tr><td style="background:#142338;padding:18px 36px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="color:#E8EDF3;font-size:14px;">Efficiency Score</td>
            <td align="right" style="font-size:32px;font-weight:700;color:#E8A020;">${p.score != null ? p.score : '—'}<span style="font-size:16px;color:#8BA0B8;">/100</span></td>
          </tr>
        </table>
      </td></tr>

      <tr><td style="padding:28px 36px;">

        <!-- Contact -->
        <h2 style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#0B1829;border-bottom:2px solid #E8A020;padding-bottom:6px;margin:0 0 14px;">Contact</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
          ${ratingRow('Name', `${p.firstName || ''} ${p.lastName || ''}`.trim())}
          ${ratingRow('Email', p.email)}
          ${ratingRow('Phone', p.phone)}
          ${ratingRow('LinkedIn', p.linkedin)}
          ${ratingRow('Role / Title', p.roleTitle)}
          ${ratingRow('Call Preference', p.callPref)}
        </table>

        <!-- Company -->
        <h2 style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#0B1829;border-bottom:2px solid #E8A020;padding-bottom:6px;margin:24px 0 14px;">Company</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
          ${ratingRow('Company Name', p.companyName)}
          ${ratingRow('Website', p.website)}
          ${ratingRow('Industry', p.industry)}
          ${ratingRow('Annual Revenue', p.revenue)}
          ${ratingRow('Headcount', p.headcount)}
          ${ratingRow('Geographies', p.geographies)}
        </table>

        <!-- Org Structure -->
        <h2 style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#0B1829;border-bottom:2px solid #E8A020;padding-bottom:6px;margin:24px 0 14px;">Org Structure</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
          ${ratingRow('Org Model', p.orgModel)}
          ${ratingRow('Reporting Layers', p.layers)}
          ${ratingRow('Span of Control', p.span)}
          ${ratingRow('Shared Functions', listVal(p.shared))}
        </table>

        <!-- Process Health -->
        <h2 style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#0B1829;border-bottom:2px solid #E8A020;padding-bottom:6px;margin:24px 0 14px;">Process Health</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
          ${ratingRow('Record to Report (RTR)', p.rtr)}
          ${ratingRow('Procure to Pay (PTP)', p.ptp)}
          ${ratingRow('Order to Cash (OTC)', p.otc)}
          ${ratingRow('Human Resources (HR)', p.hr)}
          ${ratingRow('IT &amp; Systems', p.it)}
          ${ratingRow('Close Cycle Time', p.closeTime)}
          ${ratingRow('Automation %', p.automationPct != null ? p.automationPct + '%' : '—')}
        </table>

        <!-- Goals & Context -->
        <h2 style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#0B1829;border-bottom:2px solid #E8A020;padding-bottom:6px;margin:24px 0 14px;">Goals &amp; Context</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
          ${ratingRow('Challenges', listVal(p.challenges))}
          ${ratingRow('Primary Goal', p.primaryGoal)}
          ${ratingRow('Budget Range', p.budget)}
          ${ratingRow('Timeline', p.timeline)}
        </table>

        ${p.notes ? `
        <h2 style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#0B1829;border-bottom:2px solid #E8A020;padding-bottom:6px;margin:24px 0 14px;">Additional Notes</h2>
        <p style="font-size:14px;color:#333;line-height:1.6;margin:0;">${p.notes.replace(/\n/g, '<br>')}</p>
        ` : ''}

        ${insights ? `
        <!-- AI Insights -->
        <h2 style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#0B1829;border-bottom:2px solid #E8A020;padding-bottom:6px;margin:24px 0 14px;">AI Insights</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
          ${insights}
        </table>
        ` : ''}

      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#f8f8f8;padding:16px 36px;border-top:1px solid #e8e8e8;">
        <p style="margin:0;font-size:12px;color:#999;">Sent automatically by the GSD Assessment Tool · <a href="https://gsdsol.com" style="color:#999;">gsdsol.com</a></p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// POST /submit-lead
app.post('/submit-lead', async (req, res) => {
  const payload = req.body;

  // Always log to console as a safety net
  console.log('\n=== LEAD CAPTURED ===');
  console.log(JSON.stringify(payload, null, 2));
  console.log('=====================\n');

  const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      ciphers: 'SSLv3',
    },
  });

  const name = [payload.firstName, payload.lastName].filter(Boolean).join(' ') || 'Unknown';
  const company = payload.companyName || 'Unknown Company';

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'bstevens@gsdsol.com',
    subject: `New GSD Assessment Lead — ${name} @ ${company}`,
    html: buildEmailHtml(payload),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to bstevens@gsdsol.com for ${name} @ ${company}`);
    res.json({ ok: true });
  } catch (err) {
    // Graceful fallback: lead data is already logged to console above
    console.error('SMTP send failed:', err.message);
    console.error('Full error:', err);
    console.log('NOTE: Lead payload was logged to console above — no data was lost.');
    // Still return 200 so the user sees the success screen
    res.json({ ok: true, warning: 'Email delivery failed — lead logged to console.' });
  }
});

app.listen(PORT, () => {
  console.log(`GSD Assessment server running at http://localhost:${PORT}`);
});
