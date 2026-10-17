#!/usr/bin/env python3
"""Turns a book's print PDF into per-page WebP illustrations named by PRINTED page number.

Layout:
- PDF pages 1-3 = front matter (QR page, preface, Shaykh Akram quote)
  -> private-art/<book>/front-01.webp, front-02.webp, front-03.webp
- PDF page 4 = contents = printed page 2 -> 02.webp
- PDF page k (k >= 4) -> printed page k-2 -> NN.webp
- Printed page 1 (cover) is not in these PDFs; 01.webp is not created.

Rendered at 1376 px wide (2x the 688 px page), WebP quality 82.
Uses PyMuPDF (fitz) and Pillow.

Usage:
    python scripts/split-pdf.py [ibrahim | yusuf] [--force]
"""
import argparse
import os
import sys
import fitz

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRIVATE_ART = os.path.join(ROOT, "private-art")

EXPECTED_PAGES = {
    "ibrahim": 56,
    "yusuf": 69,
}
TARGET_WIDTH = 1376
WEBP_QUALITY = 82


def format_bytes(size: int) -> str:
    for unit in ["B", "KB", "MB", "GB"]:
        if size < 1024.0:
            return f"{size:.1f} {unit}"
        size /= 1024.0
    return f"{size:.1f} TB"


def target_filename(pdf_page_1based: int) -> str:
    """PDF pages 1-3 are front matter; PDF page k (k >= 4) is printed page k - 2."""
    if pdf_page_1based <= 3:
        return f"front-{pdf_page_1based:02d}.webp"
    printed_page = pdf_page_1based - 2
    return f"{printed_page:02d}.webp"


def verify_mapping(doc, slug: str) -> None:
    print(f"\nVerifying text mapping for '{slug}' before writing:")
    check_pages = [4, 5, len(doc)]
    for pno in check_pages:
        lines = [l.strip() for l in doc[pno - 1].get_text().splitlines() if l.strip()]
        first_line = lines[0] if lines else "(no text)"
        filename = target_filename(pno)
        label = "contents" if pno == 4 else ("story start" if pno == 5 else "last page")
        print(f"  PDF page {pno:2d} -> {filename:<14} ({label}): {first_line[:70]}")


def process_pdf(slug: str, force: bool = False) -> None:
    pdf_path = os.path.join(PRIVATE_ART, f"{slug}.pdf")
    if not os.path.exists(pdf_path):
        sys.exit(f"Error: {pdf_path} does not exist.")

    doc = fitz.open(pdf_path)
    page_count = len(doc)
    expected = EXPECTED_PAGES.get(slug)

    print(f"\n==================================================")
    print(f"Processing '{slug}': {page_count} page(s) found in {pdf_path}")
    print(f"==================================================")

    if expected is not None and page_count != expected:
        msg = (
            f"ERROR: Page count mismatch for '{slug}'!\n"
            f"  Expected: {expected} pages\n"
            f"  Actual:   {page_count} pages in {pdf_path}\n"
            f"Stopping without renumbering."
        )
        if not force:
            sys.exit(msg)
        else:
            print(f"Warning: {msg}\nProceeding because --force was specified.")

    # Verification before writing files
    verify_mapping(doc, slug)

    out_dir = os.path.join(PRIVATE_ART, slug)
    os.makedirs(out_dir, exist_ok=True)

    generated_files = []
    total_size = 0

    print(f"\nRendering {page_count} pages to {out_dir}:")
    for i in range(page_count):
        pdf_page_num = i + 1
        page = doc[i]
        scale = TARGET_WIDTH / page.rect.width
        matrix = fitz.Matrix(scale, scale)
        pix = page.get_pixmap(matrix=matrix, alpha=False)

        filename = target_filename(pdf_page_num)
        out_path = os.path.join(out_dir, filename)
        pix.pil_save(out_path, format="WEBP", quality=WEBP_QUALITY)

        size = os.path.getsize(out_path)
        total_size += size
        generated_files.append((filename, size))
        print(f"  [{pdf_page_num:2d}/{page_count}] {filename:<14} ({pix.width}x{pix.height}, {format_bytes(size)})")

    first_file = generated_files[0][0] if generated_files else "none"
    last_file = generated_files[-1][0] if generated_files else "none"

    print(f"\nSummary for '{slug}':")
    print(f"  File count: {len(generated_files)}")
    print(f"  First file: {first_file}")
    print(f"  Last file:  {last_file}")
    print(f"  Total size: {format_bytes(total_size)} ({total_size} bytes)")
    print(f"  Output dir: {out_dir}")


def main():
    parser = argparse.ArgumentParser(description="Split PDF into 1376px wide WebP pages named by printed page number.")
    parser.add_argument("book", nargs="?", choices=["ibrahim", "yusuf"], help="Book slug (ibrahim or yusuf)")
    parser.add_argument("--force", "-f", action="store_true", help="Proceed even if page count differs from expected")
    args = parser.parse_args()

    books = [args.book] if args.book else ["ibrahim", "yusuf"]
    for book in books:
        process_pdf(book, force=args.force)


if __name__ == "__main__":
    main()
