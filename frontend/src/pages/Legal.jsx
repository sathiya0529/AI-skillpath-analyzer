import { useState } from 'react';
import { Download, Shield, FileText } from 'lucide-react';
import { PublicLayout } from '../components/layout';

// Lazy-load jsPDF only when someone actually clicks Download, so it never
// slows down normal page loads.
async function downloadAsPdf({ filename, heading, sections }) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;
  let y = 64;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor('#C9974B');
  doc.text('SkillPath', margin, y);
  y += 22;
  doc.setFontSize(15);
  doc.setTextColor('#111111');
  doc.text(heading, margin, y);
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor('#666666');
  doc.text(`Last updated: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, y);
  y += 26;

  const addPageIfNeeded = (lines) => {
    if (y + lines * 14 > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = 64;
    }
  };

  sections.forEach(({ title, body }) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor('#111111');
    addPageIfNeeded(2);
    doc.text(title, margin, y);
    y += 18;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor('#333333');
    const lines = doc.splitTextToSize(body, maxWidth);
    lines.forEach((line) => {
      addPageIfNeeded(1);
      doc.text(line, margin, y);
      y += 14;
    });
    y += 10;
  });

  doc.save(filename);
}

function LegalShell({ icon: Icon, title, intro, sections, filename }) {
  const [downloading, setDownloading] = useState(false);

  const onDownload = async () => {
    setDownloading(true);
    try { await downloadAsPdf({ filename, heading: title, sections }); }
    finally { setDownloading(false); }
  };

  return (
    <PublicLayout>
      <div className="page"><div className="container" style={{ maxWidth: 780 }}>
        <div className="page-head">
          <div>
            <h1><Icon size={26} style={{ verticalAlign: -4, marginRight: 8, color: 'var(--primary)' }} />{title}</h1>
            <p>{intro}</p>
          </div>
          <button className="btn btn-primary" onClick={onDownload} disabled={downloading}>
            <Download size={16} /> {downloading ? 'Preparing…' : 'Download PDF'}
          </button>
        </div>
        <div className="card" style={{ marginTop: 8 }}>
          {sections.map((s) => (
            <div key={s.title} style={{ marginBottom: 22 }}>
              <div className="card-title">{s.title}</div>
              <p style={{ color: 'var(--muted)', fontSize: 14.5, lineHeight: 1.7, marginTop: 6, whiteSpace: 'pre-line' }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div></div>
    </PublicLayout>
  );
}

const PRIVACY_SECTIONS = [
  { title: '1. Information We Collect', body: 'When you create a SkillPath account we collect your name, email address, and the profile details you choose to add — such as your headline, location, target role, skills, and an optional resume upload. If you sign in with Google, we receive your name, email address and profile photo from your Google account. We also store the learning progress, roadmap activity and notification preferences you generate while using the app.' },
  { title: '2. How We Use Your Information', body: 'We use your information to run the core features of SkillPath: comparing your skills against a target role, generating a personalized learning roadmap, tracking your progress, sending account-related emails (such as login verification codes and password-reset codes), and improving the accuracy of our skill-gap analysis.' },
  { title: '3. Email & OTP Codes', body: 'To protect your account, manual (email + password) logins require a one-time 6-digit verification code sent to your registered email, and password resets are confirmed the same way. These codes expire automatically after a short period and are never shared with third parties.' },
  { title: '4. Google Sign-In', body: 'If you choose "Continue with Google", authentication is handled directly by Google using Google Identity Services. SkillPath never sees or stores your Google password — we only receive a verified token confirming your identity, name, email and profile photo.' },
  { title: '5. Data Sharing', body: 'We do not sell, rent, or trade your personal information. Your data is used solely to operate SkillPath. It may be processed by trusted infrastructure providers (such as our database and email-delivery services) strictly to deliver the service to you.' },
  { title: '6. Data Security', body: 'Passwords are hashed before storage and are never stored in plain text. Sessions are secured with signed tokens, and sensitive actions (login, password reset) require a time-limited email verification code in addition to your password.' },
  { title: '7. Your Choices', body: 'You may update or delete the information in your profile at any time from the Settings page, change your password via the verification-code flow, and request account deletion by contacting the site administrator.' },
  { title: '8. Changes to This Policy', body: 'We may update this Privacy Policy from time to time to reflect changes to our features or applicable law. Continued use of SkillPath after an update constitutes acceptance of the revised policy.' },
  { title: '9. Contact', body: 'Questions about this Privacy Policy can be directed to the SkillPath team through the contact details listed on our About page.' },
];

const TERMS_SECTIONS = [
  { title: '1. Acceptance of Terms', body: 'By creating an account or otherwise using SkillPath, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree, please do not use the platform.' },
  { title: '2. Description of Service', body: 'SkillPath is an AI-assisted skill-gap analysis and career-readiness tool. It compares the skills on your profile or resume against a chosen target job role, produces a readiness score, and suggests a personalized learning roadmap, courses, projects and certifications.' },
  { title: '3. Account Responsibilities', body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Manual logins are protected with an emailed one-time verification code — do not share this code with anyone. Notify us immediately if you suspect unauthorized access to your account.' },
  { title: '4. Acceptable Use', body: 'You agree not to misuse SkillPath, including but not limited to: attempting to gain unauthorized access to other accounts or systems, uploading malicious files, scraping or reverse-engineering the platform, or using the service for any unlawful purpose.' },
  { title: '5. Content You Provide', body: 'Any resume, profile information or other content you upload remains yours. By uploading it, you grant SkillPath a limited license to process that content solely for the purpose of providing the skill-analysis and roadmap features to you.' },
  { title: '6. AI-Generated Guidance', body: 'Skill-gap scores, roadmaps and recommendations are generated automatically and are intended as guidance only. SkillPath does not guarantee employment outcomes, interview results, or the complete accuracy of AI-generated suggestions.' },
  { title: '7. Third-Party Sign-In', body: 'If you sign in using Google, your use of that service is also governed by Google\'s own terms and privacy policy. SkillPath is not responsible for the practices of third-party identity providers.' },
  { title: '8. Termination', body: 'We may suspend or terminate accounts that violate these Terms or that we reasonably believe pose a security risk to the platform or other users.' },
  { title: '9. Limitation of Liability', body: 'SkillPath is provided "as is" without warranties of any kind. To the fullest extent permitted by law, SkillPath and its creators are not liable for any indirect, incidental or consequential damages arising from your use of the platform.' },
  { title: '10. Changes to These Terms', body: 'We may revise these Terms from time to time. Continued use of SkillPath after changes are posted constitutes acceptance of the updated Terms.' },
  { title: '11. Contact', body: 'Questions about these Terms and Conditions can be directed to the SkillPath team through the contact details listed on our About page.' },
];

export function PrivacyPolicy() {
  return (
    <LegalShell
      icon={Shield}
      title="Privacy Policy"
      intro="How SkillPath collects, uses and protects your information."
      sections={PRIVACY_SECTIONS}
      filename="SkillPath-Privacy-Policy.pdf"
    />
  );
}

export function TermsAndConditions() {
  return (
    <LegalShell
      icon={FileText}
      title="Terms and Conditions"
      intro="The rules and guidelines for using SkillPath."
      sections={TERMS_SECTIONS}
      filename="SkillPath-Terms-and-Conditions.pdf"
    />
  );
}
