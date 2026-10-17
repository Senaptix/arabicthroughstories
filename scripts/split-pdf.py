#!/usr/bin/env python3
"""Turns a book's print PDF into per-page WebP illustrations.

Input:  private-art/<book>.pdf (book slug = ibrahim | yusuf)
Output: private-art/<book>/01.webp, 02.webp ... (two-digit, three if >99),
        one file per PDF page, in PDF order.

- Rendered at 1376 px wide (2x the 688 px page), WebP quality 82.
- Uses PyMuPDF (fitz) and Pillow, both already installed in the Python environment.
- Validates expected page counts and stops if a count differs (never renumbers).

Usage:
    python scripts/split-pdf.py [ibrahim | yusuf] [--force]
"""
import argparse
import os
import sys
import fitz

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRIVATE_ART = os.path.join(ROOT, "private-art")

EXPECTED_PAGES = {
    "ibrahim": 54,
    "yusuf": 67,
}
TARGET_WIDTH = 1376
WEBP_QUALITY = 82


def format_bytes(size: int) -> str:
    for unit in ["B", "KB", "MB", "GB"]:
        if size < 1024.0:
            return f"{size:.1f} {unit}"
        size /= 1024.0
    return f"{size:.1f} TB"


def process_pdf(slug: str, force: bool = False) -> None:
    pdf_path = os.path.join(PRIVATE_ART, f"{slug}.pdf")
    if not os.path.exists(pdf_path):
        sys.exit(f"Error: {pdf_path} does not exist.")

    doc = fitz.open(pdf_path)
    page_count = len(doc)
    expected = EXPECTED_PAGES.get(slug)

    print(f"\nProcessing {slug}: {page_count} page(s) found in {pdf_path}")

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

    out_dir = os.path.join(PRIVATE_ART, slug)
    os.makedirs(out_dir, exist_ok=True)

    pad_width = 3 if page_count > 99 else 2
    total_size = 0

    for i in range(page_count):
        page = doc[i]
        scale = TARGET_WIDTH / page.rect.width
        matrix = fitz.Matrix(scale, scale)
        pix = page.get_pixmap(matrix=matrix, alpha=False)

        filename = f"{i + 1:0{pad_width}d}.webp"
        out_path = os.path.join(out_dir, filename)
        pix.pil_save(out_path, format="WEBP", quality=WEBP_QUALITY)

        size = os.path.getsize(out_path)
        total_size += size
        print(f"  [{i + 1}/{page_count}] {filename} ({pix.width}x{pix.height}, {format_bytes(size)})")

    print(f"\nFinished '{slug}':")
    print(f"  Pages rendered: {page_count}")
    print(f"  Total size:     {format_bytes(total_size)} ({total_size} bytes)")
    print(f"  Output dir:     {out_dir}")


def main():
    parser = argparse.ArgumentParser(description="Split PDF into 1376px wide WebP pages.")
    parser.add_argument("book", nargs="?", choices=["ibrahim", "yusuf"], help="Book slug (ibrahim or yusuf)")
    parser.add_argument("--force", "-f", action="store_true", help="Proceed even if page count differs from expected")
    args = parser.parse_args()

    books = [args.book] if args.book else ["ibrahim", "yusuf"]
    for book in books:
        process_pdf(book, force=args.force)


if __name__ == "__main__":
    main()
