import type { Metadata } from "next";
import Link from "next/link";
import BrandLockup from "@/components/BrandLockup";
import Eyebrow from "@/components/Eyebrow";
import HomeBar from "@/components/HomeBar";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for purchasing and using the Qasas Kids digital edition.",
};

export default function TermsPage() {
  return (
    <>
      <HomeBar />

      <main className="mx-auto w-full max-w-[720px] px-6 py-12 sm:px-8 lg:py-16">
        <header>
          <Eyebrow>Terms</Eyebrow>
          <h1
            className="text-ink mt-4 font-semibold text-balance"
            style={{
              fontSize: "clamp(30px, 5.5vw, 44px)",
              lineHeight: 1.15,
              letterSpacing: "-0.015em",
            }}
          >
            Terms of Service
          </h1>
          <p className="text-ink/50 mt-3 text-[14px]">Last updated 19 October 2026</p>
        </header>

        <div className="text-ink/80 mt-10 space-y-8 text-[16px] leading-7">
          <section>
            <h2 className="text-ink text-[20px] font-semibold">Who we are</h2>
            <p className="mt-3">
              Qasas Kids (qasaskids.com) is provided by Senaptix Limited (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), registered in England under company number 16687527. Our registered office is 12 Corncastle Road, Luton, England, LU1 5HB. You can contact us at{" "}
              <a href="mailto:accounts@qasaskids.com" className="text-brand-blue underline underline-offset-4">
                accounts@qasaskids.com
              </a>.
            </p>
            <p className="mt-3">
              We are not registered for VAT and we do not charge VAT.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Merchant of record and payments</h2>
            <p className="mt-3">
              Paddle.com is the merchant of record for all online purchases made through this website.
            </p>
            <p className="mt-3">
              Paddle takes payment, calculates and remits VAT and sales tax per customer location, issues purchase receipts, and handles refunds. Our site provides access to digital content; Paddle&rsquo;s terms govern the payment transaction itself.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">The digital service and audio</h2>
            <p className="mt-3">
              Qasas Kids provides online digital access to the <em>Qisas an-Nabiyyin</em> Arabic reading series. We offer 12 months&rsquo; online access to one book&rsquo;s Digital Edition (or both in a bundle), or an ongoing monthly subscription that renews until cancelled.
            </p>
            <p className="mt-3">
              The Digital Edition is read online only via your web browser on qasaskids.com. Nothing is downloaded to your device, and we do not provide offline files or standalone applications.
            </p>
            <p className="mt-3">
              The audio narration on the service is currently an AI-generated voice, checked and verified against the Arabic text by a qualified teacher. Audio recordings may be updated or re-recorded by a human narrator in future revisions.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Accounts and household use</h2>
            <p className="mt-3">
              Accounts are for adults only (parents, legal guardians, or teachers aged 18 and over). Digital access requires a parent account registered with a valid email address.
            </p>
            <p className="mt-3">
              Each account is for use within a single household. You must keep your sign-in credentials secure and must not share access with people outside your household.
            </p>
            <p className="mt-3">
              Children do not hold accounts. Instead, a parent creates child profiles inside the parent account. We never collect a child&rsquo;s real name, age, photo, or contact details; a child profile is simply a nickname (up to 30 characters) and an avatar.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Licence and intellectual property</h2>
            <p className="mt-3">
              All materials on Qasas Kids &mdash; including Arabic texts, vocalisation, English translations, vocabulary glosses, word roots, illustrations, audio recordings, and practice exercises &mdash; are protected by copyright and intellectual property rights.
            </p>
            <p className="mt-3">
              We grant you a personal, revocable, non-exclusive, and non-transferable licence to access and view the digital content for private, non-commercial educational use within your household. You may not copy, redistribute, record, extract, scrape, reverse-engineer, resell, or publicly broadcast any part of the service or its content.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Access terms, pricing, and renewals</h2>
            <p className="mt-3">
              Prices for 12-month access and monthly subscriptions are shown clearly at checkout before you confirm payment.
            </p>
            <p className="mt-3">
              <strong>12-month access:</strong> Gives you full digital access to the selected book (or bundle) for 12 months from the date of purchase. It does not renew automatically.
            </p>
            <p className="mt-3">
              <strong>Monthly subscription:</strong> Renews automatically each month until cancelled. You can cancel at any time from your account by going to Account &gt; Manage subscription. When cancelled, access continues until the end of the paid billing period, and no further monthly charges are taken.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Right to cancel and immediate digital supply</h2>
            <p className="mt-3">
              Under the UK Consumer Contracts Regulations, consumers normally have a statutory right to cancel an online order within 14 days without reason.
            </p>
            <p className="mt-3">
              Because our digital content is supplied immediately upon purchase, by completing your purchase you acknowledge and agree that your statutory 14-day right of cancellation is waived once digital access begins [TODO solicitor check: wording for statutory cancellation waiver on immediate digital access].
            </p>
            <p className="mt-3">
              However, separate from the statutory rule, we provide a full 14-day refund promise on all purchases. Please see our{" "}
              <Link href="/refunds" className="text-brand-blue underline underline-offset-4">
                Refunds page
              </Link>{" "}
              for complete details.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Quality, description, and remedies</h2>
            <p className="mt-3">
              Under UK consumer law, the digital content we provide must match its description, be fit for purpose, and be of satisfactory quality.
            </p>
            <p className="mt-3">
              If the digital service is faulty, unavailable, or does not match its description, please notify us at accounts@qasaskids.com. We will work to fix the problem within a reasonable time. If we cannot fix it within a reasonable time or without significant inconvenience to you, you will be entitled to a full or partial refund.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Acceptable use</h2>
            <p className="mt-3">
              You agree to use Qasas Kids responsibly and lawfully. You must not:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Share your sign-in details with people outside your household.</li>
              <li>Circumvent, disable, or tamper with security or access controls.</li>
              <li>Scrape, extract, or capture text, audio, images, or data using automated tools.</li>
              <li>Interfere with or burden our servers, networks, or other users&rsquo; access.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Limitation of liability</h2>
            <p className="mt-3">
              Nothing in these terms limits or excludes our liability for death or personal injury caused by our negligence, for fraud or fraudulent misrepresentation, or for any other liability that cannot be excluded or limited under English law (including statutory consumer rights).
            </p>
            <p className="mt-3">
              Subject to the above, Senaptix Limited is not liable to you for any indirect, special, or consequential loss, or for loss arising from events beyond our reasonable control.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Changes to these terms</h2>
            <p className="mt-3">
              We may update these terms from time to time to reflect changes in our service or the law. If we make material changes, we will give advance notice by email or by displaying an update notice on our website.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Governing law</h2>
            <p className="mt-3">
              These terms are governed by the laws of England and Wales. Any disputes arising in connection with these terms shall be subject to the exclusive jurisdiction of the courts of England and Wales, except that if you live in Scotland or Northern Ireland, you may also bring proceedings in your local courts.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Contact</h2>
            <p className="mt-3">
              If you have any questions regarding these terms, please contact Senaptix Limited at{" "}
              <a href="mailto:accounts@qasaskids.com" className="text-brand-blue underline underline-offset-4">
                accounts@qasaskids.com
              </a>{" "}
              or write to our registered office: 12 Corncastle Road, Luton, England, LU1 5HB.
            </p>
          </section>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-[720px] px-6 py-12 sm:px-8">
        <div className="border-ink/10 flex flex-col gap-4 border-t pt-8 sm:flex-row sm:items-center sm:justify-between text-[14px] text-ink/60">
          <BrandLockup size="footer" />
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <Link href="/" className="hover:text-ink underline-offset-4 hover:underline">
              Home
            </Link>
            <span className="text-ink/25" aria-hidden="true">·</span>
            <Link href="/about" className="hover:text-ink underline-offset-4 hover:underline">
              About
            </Link>
            <span className="text-ink/25" aria-hidden="true">·</span>
            <Link href="/terms" className="text-ink font-medium underline-offset-4 hover:underline">
              Terms
            </Link>
            <span className="text-ink/25" aria-hidden="true">·</span>
            <Link href="/refunds" className="hover:text-ink underline-offset-4 hover:underline">
              Refunds
            </Link>
            <span className="text-ink/25" aria-hidden="true">·</span>
            <Link href="/privacy" className="hover:text-ink underline-offset-4 hover:underline">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
