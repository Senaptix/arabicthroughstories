// Shared by the sign-up form (live checklist) and the server action (error text),
// so what the page asks for and what it reports can never drift apart.
export const PASSWORD_RULES = [
  { label: "At least 10 characters", missing: "at least 10 characters", test: (p: string) => p.length >= 10 },
  { label: "A lowercase letter", missing: "a lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "An uppercase letter", missing: "an uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "A number", missing: "a number", test: (p: string) => /[0-9]/.test(p) },
  { label: "A symbol, such as ! - ? @ #", missing: "a symbol (such as ! - ? @ #)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

export function missingPasswordParts(password: string): string[] {
  return PASSWORD_RULES.filter((r) => !r.test(password)).map((r) => r.missing);
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** Plain-English reason a password was refused, given what the person typed. */
export function weakPasswordMessage(password: string, pwned: boolean): string {
  if (pwned) {
    return "That password has appeared in a known data breach, so it is not safe to use. Choose a different one.";
  }
  const missing = missingPasswordParts(password);
  if (missing.length > 0) {
    return `Your password needs ${joinList(missing)}.`;
  }
  // Meets every visible rule, so the remaining cause is the breach check.
  return "That password was not accepted. It is most likely a common or breached password. Try a longer one that is not used elsewhere, for example three words with a number and a symbol.";
}
