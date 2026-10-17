// Run: npx tsx lib/book-pages.check.ts
// Self-check proving a non-entitled access result never produces a signed URL.
import assert from "node:assert/strict";
import { getPageImageUrl } from "./book-pages";

async function runChecks() {
  let signedUrlCallCount = 0;
  const mockSigner = async (path: string, expiresIn: number) => {
    signedUrlCallCount++;
    return `https://storage.example.com/${path}?expires=${expiresIn}`;
  };

  // 1. Non-entitled access result MUST NEVER produce a signed URL
  //    and must never call createSignedUrl.
  const nonEntitledYusuf = await getPageImageUrl({
    bookSlug: "yusuf",
    page: 25,
    canView: false,
    createSignedUrl: mockSigner,
  });
  assert.equal(nonEntitledYusuf, null, "non-entitled yusuf must return null");
  assert.equal(
    signedUrlCallCount,
    0,
    "non-entitled yusuf access must never call createSignedUrl",
  );

  const nonEntitledIbrahimGated = await getPageImageUrl({
    bookSlug: "ibrahim",
    page: 25,
    canView: false,
    createSignedUrl: mockSigner,
  });
  assert.equal(
    nonEntitledIbrahimGated,
    null,
    "non-entitled gated ibrahim must return null",
  );
  assert.equal(
    signedUrlCallCount,
    0,
    "non-entitled gated ibrahim access must never call createSignedUrl",
  );

  // 2. Entitled access on private pages produces a signed URL with 600s expiry
  const entitledYusuf = await getPageImageUrl({
    bookSlug: "yusuf",
    page: 25,
    canView: true,
    createSignedUrl: mockSigner,
  });
  assert.equal(
    entitledYusuf,
    "https://storage.example.com/yusuf/25.webp?expires=600",
  );
  assert.equal(signedUrlCallCount, 1, "entitled access calls createSignedUrl");

  // 3. Ibrahim pages 1-10 keep using public/book/ibrahim for everyone
  signedUrlCallCount = 0;
  const ibrahimPublic = await getPageImageUrl({
    bookSlug: "ibrahim",
    page: 5,
    canView: true,
    createSignedUrl: mockSigner,
  });
  assert.equal(
    ibrahimPublic,
    "/book/ibrahim/05.webp",
    "ibrahim pages 1-10 use public assets",
  );
  assert.equal(
    signedUrlCallCount,
    0,
    "public ibrahim pages must never call createSignedUrl",
  );

  // 4. Page 1 (cover) is not in bucket: uses existing public cover if there is one
  signedUrlCallCount = 0;
  const ibrahimCover = await getPageImageUrl({
    bookSlug: "ibrahim",
    page: 1,
    canView: true,
    createSignedUrl: mockSigner,
  });
  assert.equal(
    ibrahimCover,
    "/book/ibrahim/01.webp",
    "ibrahim page 1 uses existing public cover",
  );
  assert.equal(
    signedUrlCallCount,
    0,
    "ibrahim cover must not call createSignedUrl",
  );

  const yusufCover = await getPageImageUrl({
    bookSlug: "yusuf",
    page: 1,
    canView: true,
    createSignedUrl: mockSigner,
  });
  assert.equal(
    yusufCover,
    null,
    "yusuf page 1 has no public cover, returns null",
  );
  assert.equal(
    signedUrlCallCount,
    0,
    "yusuf cover must not call createSignedUrl",
  );

  console.log("book-pages.check: ok");
}

runChecks().catch((err) => {
  console.error(err);
  process.exit(1);
});
