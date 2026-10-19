import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import Eyebrow from "@/components/Eyebrow";
import HomeBar from "@/components/HomeBar";

export const metadata: Metadata = {
  title: "Children's Privacy",
  description: "How Qasas Kids protects young readers: data minimisation, no ads, no tracking, and total parental control.",
};

export default function ChildrenPage() {
  return (
    <>
      <HomeBar />

      <main className="mx-auto w-full max-w-[720px] px-6 py-12 sm:px-8 lg:py-16">
        <header>
          <Eyebrow>Children</Eyebrow>
          <h1
            className="text-ink mt-4 font-semibold text-balance"
            style={{
              fontSize: "clamp(30px, 5.5vw, 44px)",
              lineHeight: 1.15,
              letterSpacing: "-0.015em",
            }}
          >
            Children&rsquo;s Privacy
          </h1>
          <p className="text-ink/50 mt-3 text-[14px]">Last updated 19 October 2026</p>
        </header>

        <div className="text-ink/80 mt-10 space-y-8 text-[16px] leading-7">
          {/* Section for children to read directly */}
          <section className="rounded-2xl border border-ink/10 bg-sand/25 p-6 sm:p-7">
            <h2 className="text-ink text-[18px] font-semibold">A quick note for young readers</h2>
            <p className="mt-3">
              Hello! Here is what you should know when you use Qasas Kids:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-[15px]">
              <li>
                <strong>We don&rsquo;t know who you are.</strong> We never ask for your real name, your age, where you live, or a photo.
              </li>
              <li>
                <strong>Just a nickname:</strong> You use a nickname and an avatar that you and your parent choose together.
              </li>
              <li>
                <strong>What we save:</strong> We remember which story pages you have read, your practice answers, and words you save so you can see them next time.
              </li>
              <li>
                <strong>No ads and no tracking:</strong> There are no advertisements, no pop-ups trying to sell things, and nobody tracking you.
              </li>
              <li>
                <strong>Your parent is in charge:</strong> Your parent can change your nickname or delete your saved words and progress at any time.
              </li>
            </ul>
          </section>

          {/* Detailed section for parents */}
          <section>
            <h2 className="text-ink text-[20px] font-semibold">Our approach: the ICO Children&rsquo;s Code</h2>
            <p className="mt-3">
              We designed Qasas Kids in the spirit of the UK Information Commissioner&rsquo;s Office (ICO) Age Appropriate Design Code (Children&rsquo;s Code). We believe children&rsquo;s educational spaces online should be quiet, private, and free from commercial pressure.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Strict data minimisation</h2>
            <p className="mt-3">
              Children do not hold accounts. Only an adult (parent, guardian, or teacher) can create an account on Qasas Kids.
            </p>
            <p className="mt-3">
              Inside the parent account, parents create child profiles. We never collect personal identifiers from children: no real name, no age, no date of birth, no gender, no photo, and no contact details. A profile is just a nickname (up to 30 characters) and an avatar chosen from our preset library.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">High privacy by default</h2>
            <p className="mt-3">
              Profiles are entirely private to the parent&rsquo;s account. There are no public user profiles, search directories, chat rooms, or social features. Children cannot communicate with strangers or other users on the platform.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">No advertising, no profiling, and no nudging</h2>
            <p className="mt-3">
              We never display third-party advertisements or sponsored links. We do not use tracking cookies or behavioral profiling to study how your child browses.
            </p>
            <p className="mt-3">
              We deliberately avoid behavioral &ldquo;nudge&rdquo; techniques. There are no daily streaks intended to create compulsive screen use, no push notifications demanding attention, and no in-app purchases or upsells aimed at children.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">What progress data is kept</h2>
            <p className="mt-3">
              The only information recorded for a child profile is their learning journey:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Which pages of the Arabic story they have opened and completed.</li>
              <li>Practice exercise answers and scores for each page.</li>
              <li>Vocabulary words saved to the child&rsquo;s personal word list.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">How a parent deletes everything</h2>
            <p className="mt-3">
              Parents have complete control over all stored data:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>Rename or change avatars:</strong> You can update nicknames and avatars anytime from the Account dashboard.
              </li>
              <li>
                <strong>Delete profiles:</strong> You can delete any individual child profile and its entire associated learning history directly from your account.
              </li>
              <li>
                <strong>Complete account deletion:</strong> If you want to delete your entire parent account and wipe all child profiles, saved words, and progress permanently, email us at{" "}
                <a href="mailto:accounts@qasaskids.com" className="text-brand-blue underline underline-offset-4">
                  accounts@qasaskids.com
                </a>{" "}
                and we will process your deletion request promptly.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Questions and ICO registration</h2>
            <p className="mt-3">
              Qasas Kids is operated by Senaptix Limited, which is registered with the Information Commissioner&rsquo;s Office (ICO reference ZC119614). If you have questions about our children&rsquo;s privacy protections, please contact us at{" "}
              <a href="mailto:accounts@qasaskids.com" className="text-brand-blue underline underline-offset-4">
                accounts@qasaskids.com
              </a>.
            </p>
          </section>
        </div>
      </main>

      <SiteFooter maxWidth="max-w-[720px]" />
    </>
  );
}
