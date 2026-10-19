import type { Metadata } from "next";
import Link from "next/link";
import BrandLockup from "@/components/BrandLockup";
import Eyebrow from "@/components/Eyebrow";
import HomeBar from "@/components/HomeBar";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Information about cookies and browser storage used on Qasas Kids.",
};

export default function CookiesPage() {
  return (
    <>
      <HomeBar />

      <main className="mx-auto w-full max-w-[720px] px-6 py-12 sm:px-8 lg:py-16">
        <header>
          <Eyebrow>Cookies</Eyebrow>
          <h1
            className="text-ink mt-4 font-semibold text-balance"
            style={{
              fontSize: "clamp(30px, 5.5vw, 44px)",
              lineHeight: 1.15,
              letterSpacing: "-0.015em",
            }}
          >
            Cookie Policy
          </h1>
          <p className="text-ink/50 mt-3 text-[14px]">Last updated 19 October 2026</p>
        </header>

        <div className="text-ink/80 mt-10 space-y-8 text-[16px] leading-7">
          <section>
            <h2 className="text-ink text-[20px] font-semibold">What are cookies?</h2>
            <p className="mt-3">
              Cookies are small text files stored on your device by your web browser when you visit a website. They are commonly used to remember preferences, keep you signed in, or track user activity.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">No analytics, advertising, or tracking cookies</h2>
            <p className="mt-3">
              We do not use analytics services, advertising networks, or behavioral tracking scripts. We do not track you across the web or build profiles about your habits.
            </p>
            <p className="mt-3">
              Because we only use storage that is strictly necessary to deliver the service you request, UK law (the Privacy and Electronic Communications Regulations) does not require a cookie consent banner. You will not see a cookie pop-up on our site.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Strictly necessary storage</h2>
            <p className="mt-3">
              The only cookies and storage used on Qasas Kids are essential for the website to function: keeping your parent account signed in and remembering which child profile is currently reading. On checkout pages, our merchant of record (Paddle) sets cookies required to complete your purchase securely.
            </p>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full border-collapse border border-ink/15 text-left text-[14px] leading-6">
                <thead className="bg-sand/30 text-ink font-semibold">
                  <tr>
                    <th className="border border-ink/15 p-3">Cookie / Key</th>
                    <th className="border border-ink/15 p-3">Provider</th>
                    <th className="border border-ink/15 p-3">Purpose</th>
                    <th className="border border-ink/15 p-3">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  <tr>
                    <td className="border border-ink/15 p-3 font-mono text-[13px]">sb-*-auth-token</td>
                    <td className="border border-ink/15 p-3">Qasas Kids (Supabase Auth)</td>
                    <td className="border border-ink/15 p-3">
                      Maintains your authenticated parent session and token refresh so you stay securely signed in as you browse.
                    </td>
                    <td className="border border-ink/15 p-3">Session / refreshed during use</td>
                  </tr>
                  <tr>
                    <td className="border border-ink/15 p-3 font-mono text-[13px]">qk_child</td>
                    <td className="border border-ink/15 p-3">Qasas Kids</td>
                    <td className="border border-ink/15 p-3">
                      Stores the ID of your active child profile so reading progress, practice results, and saved vocabulary are attributed to the right child.
                    </td>
                    <td className="border border-ink/15 p-3">1 year (or until sign-out / profile switch)</td>
                  </tr>
                  <tr>
                    <td className="border border-ink/15 p-3 font-mono text-[13px]">Paddle checkout cookies</td>
                    <td className="border border-ink/15 p-3">Paddle.com (cdn.paddle.com)</td>
                    <td className="border border-ink/15 p-3">
                      Loaded exclusively on buy pages (/buy) to manage the checkout overlay, process payment, and prevent transaction fraud.
                    </td>
                    <td className="border border-ink/15 p-3">Session to 1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Managing cookies in your browser</h2>
            <p className="mt-3">
              You can configure your browser to block or delete cookies at any time through your browser settings.
            </p>
            <p className="mt-3">
              Please note that because the cookies listed above are strictly necessary for authentication and profile management, blocking them will prevent you from signing in, accessing your child profiles, or reading purchased digital editions.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Contact</h2>
            <p className="mt-3">
              If you have questions about how we use cookies, please contact us at{" "}
              <a href="mailto:accounts@qasaskids.com" className="text-brand-blue underline underline-offset-4">
                accounts@qasaskids.com
              </a>.
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
            <Link href="/terms" className="hover:text-ink underline-offset-4 hover:underline">
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
