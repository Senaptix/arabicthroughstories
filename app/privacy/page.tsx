import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import Eyebrow from "@/components/Eyebrow";
import HomeBar from "@/components/HomeBar";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Qasas Kids accounts, learning progress, and digital edition access.",
};

export default function PrivacyPage() {
  return (
    <>
      <HomeBar />

      <main className="mx-auto w-full max-w-[720px] px-6 py-12 sm:px-8 lg:py-16">
        <header>
          <Eyebrow>Privacy</Eyebrow>
          <h1
            className="text-ink mt-4 font-semibold text-balance"
            style={{
              fontSize: "clamp(30px, 5.5vw, 44px)",
              lineHeight: 1.15,
              letterSpacing: "-0.015em",
            }}
          >
            Privacy Policy
          </h1>
          <p className="text-ink/50 mt-3 text-[14px]">Last updated 19 October 2026</p>
        </header>

        <div className="text-ink/80 mt-10 space-y-8 text-[16px] leading-7">
          <section>
            <h2 className="text-ink text-[20px] font-semibold">Who we are and data controller</h2>
            <p className="mt-3">
              Qasas Kids (qasaskids.com) is operated by Senaptix Limited (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), a company registered in England under company number 16687527. Our registered office is 12 Corncastle Road, Luton, England, LU1 5HB.
            </p>
            <p className="mt-3">
              Senaptix Limited is the data controller for personal information collected through Qasas Kids. We are registered with the Information Commissioner&rsquo;s Office (ICO) under registration reference ZC119614.
            </p>
            <p className="mt-3">
              If you have any questions about this policy or your data, you can reach us by email at{" "}
              <a href="mailto:accounts@qasaskids.com" className="text-brand-blue underline underline-offset-4">
                accounts@qasaskids.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Accounts and children&rsquo;s privacy</h2>
            <p className="mt-3">
              Accounts on Qasas Kids are strictly for adults (parents, legal guardians, or teachers aged 18 and over).
            </p>
            <p className="mt-3">
              Children do not register or hold accounts. Instead, an adult creates child profiles inside the parent account. We never ask for a child&rsquo;s real name, age, date of birth, photo, or contact details. A child profile consists solely of a nickname (maximum 30 characters) and a chosen avatar.
            </p>
            <p className="mt-3">
              For more information on how we protect younger readers, see our dedicated{" "}
              <Link href="/children" className="text-brand-blue underline underline-offset-4">
                Children&rsquo;s Privacy page
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">What data we hold</h2>
            <p className="mt-3">
              We collect and store only the minimum personal information needed to deliver our service:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>Parent account credentials:</strong> Parent email address and hashed password for sign-in and security.
              </li>
              <li>
                <strong>Child profiles:</strong> Nickname (up to 30 characters) and avatar choice.
              </li>
              <li>
                <strong>Learning progress:</strong> Pages read, practice exercise results, and saved vocabulary words.
              </li>
              <li>
                <strong>Activation records:</strong> Activation codes redeemed and access entitlements.
              </li>
              <li>
                <strong>Purchase records:</strong> Paddle transaction IDs, customer email, book purchased, and subscription plan. Credit and debit card details never reach our servers and are never stored by us.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Lawful bases for processing (UK GDPR)</h2>
            <p className="mt-3">
              Under the UK General Data Protection Regulation (UK GDPR), we rely on the following lawful bases:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>Contract:</strong> To create your account, deliver access to digital books, save reading progress, and manage purchases.
              </li>
              <li>
                <strong>Legitimate interests:</strong> To protect account security, prevent fraud, resolve technical errors, and maintain service reliability without tracking personal browsing habits.
              </li>
              <li>
                <strong>Legal obligation:</strong> To retain purchase and tax records for 6 years as required by UK law.
              </li>
            </ul>
            <p className="mt-3">
              We do not conduct consent-based email marketing. If we ever wish to send promotional marketing emails in the future, we will ask for your clear consent first.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Third-party processors</h2>
            <p className="mt-3">
              We work with trusted third-party service providers to host and operate Qasas Kids:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>Supabase:</strong> Database, authentication, and secure storage, hosted in West Europe (London, eu-west-2).
              </li>
              <li>
                <strong>Hostinger:</strong> Cloud VPS hosting located in London, UK, and the Hostinger SMTP service (smtp.hostinger.com) used to send transactional emails (such as password resets and account confirmations) from accounts@qasaskids.com.
              </li>
              <li>
                <strong>Paddle.com:</strong> Merchant of record for all online purchases. Paddle takes payment, calculates and remits VAT and sales taxes, issues receipts, and processes refunds. Paddle&rsquo;s terms govern payment transactions.
              </li>
            </ul>
            <p className="mt-3">
              Our main providers host data in the UK. Paddle and Supabase are international companies; where they process personal data outside the UK, they do so under UK-approved safeguards in their data processing agreements.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Data retention</h2>
            <p className="mt-3">
              We keep personal information only for as long as necessary:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>Account and child profile data:</strong> kept until you delete your account (you can ask us to delete it at any time).
              </li>
              <li>
                <strong>Purchase records:</strong> Retained for 6 years to satisfy UK statutory accounting and tax obligations.
              </li>
              <li>
                <strong>Server logs:</strong> kept for up to 30 days.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Cookies and storage</h2>
            <p className="mt-3">
              We use strictly necessary cookies only (to keep the parent signed in and remember the active child profile). We do not use analytics, advertising, or tracking cookies, and we do not track you across other websites.
            </p>
            <p className="mt-3">
              You can read full details in our{" "}
              <Link href="/cookies" className="text-brand-blue underline underline-offset-4">
                Cookie Policy
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Your rights</h2>
            <p className="mt-3">
              Under UK data protection law, you have statutory rights concerning your personal data:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>Access:</strong> The right to request copies of the personal data we hold about you.
              </li>
              <li>
                <strong>Rectification:</strong> The right to request correction of inaccurate or incomplete information.
              </li>
              <li>
                <strong>Erasure:</strong> The right to ask us to delete your personal data, child profiles, and progress records.
              </li>
              <li>
                <strong>Restriction:</strong> The right to request that we restrict the processing of your information in certain circumstances.
              </li>
              <li>
                <strong>Data portability:</strong> The right to ask that we transfer the data you gave us to another organisation or to you.
              </li>
              <li>
                <strong>Objection:</strong> The right to object to processing based on legitimate interests.
              </li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:accounts@qasaskids.com" className="text-brand-blue underline underline-offset-4">
                accounts@qasaskids.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Breaches and complaints</h2>
            <p className="mt-3">
              If a personal data breach occurs that presents a risk to your rights and freedoms, we will notify you and the Information Commissioner&rsquo;s Office as required by law.
            </p>
            <p className="mt-3">
              If you have any concern about how we handle your data, please contact us first at accounts@qasaskids.com so we can resolve it. You also have the right to lodge a complaint with the UK supervisory authority, the Information Commissioner&rsquo;s Office (ICO), via their website at{" "}
              <a href="https://ico.org.uk" target="_blank" rel="noreferrer" className="text-brand-blue underline underline-offset-4">
                ico.org.uk
              </a>.
            </p>
          </section>
        </div>
      </main>

      <SiteFooter maxWidth="max-w-[720px]" />
    </>
  );
}
