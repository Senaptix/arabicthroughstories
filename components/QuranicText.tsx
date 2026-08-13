import { Fragment } from "react";

const ORNATE_BRACKETS = /([﴾﴿])/g;

/**
 * Keep the Unicode-correct Qur'an brackets from being bidi-mirrored by the
 * surrounding RTL paragraph. The quote stays one logical Arabic string; only
 * the two neutral punctuation glyphs get their own LTR isolation boundary.
 */
export default function QuranicText({ text }: { text: string }) {
  return text.split(ORNATE_BRACKETS).map((part, index) =>
    part === "﴾" || part === "﴿" ? (
      <bdi key={index} dir="ltr" className="quran-bracket">
        {part}
      </bdi>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}
