#!/usr/bin/env python3
"""
extract_pdf_applevision.py

Apple Vision OCR for scanned PDF pages (same engine as macOS Live Text).

Important: Russian recognition requires macOS 13 (Ventura) or later, which
includes VNRecognizeTextRequestRevision3 with Cyrillic language model.
On older macOS, Vision falls back to English-only and recognises Cyrillic
letters as Latin look-alikes (А→A, Р→P), producing useless output.

Use --info to print supported recognition languages and exit.

Requirements (macOS 13+ recommended):
  pip3 install pyobjc-framework-Vision pymupdf

Usage:
  python3 extract_pdf_applevision.py --info
  python3 extract_pdf_applevision.py /path/to/file.pdf
  python3 extract_pdf_applevision.py /path/to/file.pdf --output /tmp/out.txt
  python3 extract_pdf_applevision.py /path/to/file.pdf --pages 1-10

Exit codes:
  0  — success     1  — extraction error
  2  — deps missing  3  — wrong arguments
  4  — Russian language model unavailable (macOS too old)
"""

import sys
import os
import argparse
from typing import Optional, List

try:
    import fitz
except ImportError:
    sys.stderr.write("PyMuPDF not installed. Run: pip3 install pymupdf\n")
    sys.exit(2)

try:
    from Foundation import NSData
    from Vision import VNImageRequestHandler, VNRecognizeTextRequest
    VN_FAST = 0
    VN_ACCURATE = 1
except ImportError:
    sys.stderr.write(
        "Apple Vision bindings not installed.\n"
        "Run: pip3 install pyobjc-framework-Vision\n"
    )
    sys.exit(2)


def get_supported_languages(revision: int, recognition_level: int = VN_ACCURATE) -> List[str]:
    """Try to query Vision for supported recognition languages on this macOS."""
    try:
        # macOS 12+ class-method API
        result = VNRecognizeTextRequest.supportedRecognitionLanguagesForTextRecognitionLevel_revision_error_(
            recognition_level, revision, None
        )
        if isinstance(result, tuple):
            langs = result[0]
        else:
            langs = result
        return list(langs) if langs else []
    except Exception:
        pass

    # Fall back to instance method (older pyobjc or macOS variant)
    try:
        req = VNRecognizeTextRequest.alloc().init()
        req.setRecognitionLevel_(recognition_level)
        try:
            req.setRevision_(revision)
        except Exception:
            pass
        langs = req.supportedRecognitionLanguagesAndReturnError_(None)
        if isinstance(langs, tuple):
            langs = langs[0]
        return list(langs) if langs else []
    except Exception:
        return []


def has_russian(langs: List[str]) -> bool:
    """Check if Russian is in the language list (any variant)."""
    return any(l.lower().startswith("ru") for l in langs)


# ─── --info mode: print supported languages and exit ──────────────────────────
if "--info" in sys.argv:
    sys.stderr.write("Querying Apple Vision supported recognition languages...\n\n")
    for level_name, level in (("accurate", VN_ACCURATE), ("fast", VN_FAST)):
        sys.stderr.write(f"Recognition level: {level_name}\n")
        for rev in range(10, 0, -1):
            langs = get_supported_languages(rev, level)
            if not langs:
                continue
            sys.stderr.write(f"  Revision {rev}: {langs}\n")
            if has_russian(langs):
                sys.stderr.write(f"    ✅ Russian supported in revision {rev} ({level_name})\n")
        sys.stderr.write("\n")
    sys.exit(0)

# ─── Argument parsing ─────────────────────────────────────────────────────────
parser = argparse.ArgumentParser(add_help=True)
parser.add_argument("pdf_path", nargs="?")
parser.add_argument("--output", dest="output_path")
parser.add_argument("--pages", dest="pages")
level_group = parser.add_mutually_exclusive_group()
level_group.add_argument("--fast", action="store_true")
level_group.add_argument("--accurate", action="store_true")
parser.add_argument("--require-language", dest="required_lang")
args = parser.parse_args()

pdf_path = args.pdf_path
if not pdf_path:
    parser.error("pdf_path is required unless --info is provided")
if not os.path.isfile(pdf_path):
    sys.stderr.write(f"File not found: {pdf_path}\n")
    sys.exit(1)

output_path: Optional[str] = args.output_path

page_start, page_end = None, None
if args.pages:
    parts = args.pages.split("-")
    try:
        page_start = int(parts[0]) - 1
        page_end = int(parts[1]) if len(parts) > 1 else None
    except ValueError:
        sys.stderr.write("--pages format: N-M\n")
        sys.exit(3)

recognition_level = VN_FAST if args.fast else VN_ACCURATE
if args.accurate:
    recognition_level = VN_ACCURATE

required_lang: Optional[str] = args.required_lang

# ─── Detect supported languages and pick best revision ────────────────────────
# Try revisions from highest to lowest so we use the most capable model.
# macOS 13 (Ventura) added Revision 3 with Cyrillic. Later OS versions
# may introduce higher revision numbers (e.g. macOS 26 Tahoe).
chosen_revision = None
chosen_langs: List[str] = []
for rev in range(10, 0, -1):
    langs = get_supported_languages(rev, recognition_level)
    if langs and has_russian(langs):
        chosen_revision = rev
        ru_tag = next((l for l in langs if l.lower().startswith("ru")), "ru-RU")
        chosen_langs = [ru_tag, "en-US"]
        break

# If user requires Russian and accurate mode has no Russian, auto-fallback to fast.
if chosen_revision is None and required_lang and required_lang.startswith("ru") and recognition_level == VN_ACCURATE:
    for rev in range(10, 0, -1):
        langs = get_supported_languages(rev, VN_FAST)
        if langs and has_russian(langs):
            chosen_revision = rev
            recognition_level = VN_FAST
            ru_tag = next((l for l in langs if l.lower().startswith("ru")), "ru-RU")
            chosen_langs = [ru_tag, "en-US"]
            sys.stderr.write(
                "Accurate mode has no Russian on this macOS; switched to fast mode for ru-RU.\n"
            )
            break

if chosen_revision is None:
    # Russian not available
    if required_lang and required_lang.startswith("ru"):
        # Caller insists on Russian — exit early with a recognisable code
        # instead of producing English-OCR garbage that pollutes the index.
        sys.stderr.write(
            "Russian (ru-RU) NOT supported by Apple Vision on this macOS.\n"
            "Need macOS 13 (Ventura) or later, or use Tesseract with rus.traineddata.\n"
            "Skipping OCR (--require-language was set).\n"
        )
        sys.exit(4)
    chosen_revision = 3
    chosen_langs = ["en-US"]
    sys.stderr.write(
        "⚠️  Russian (ru-RU) NOT supported by Apple Vision on this macOS.\n"
        "   Need macOS 13 (Ventura) or later for Cyrillic OCR.\n"
        "   Will OCR as English-only — Cyrillic letters will be mis-recognised.\n"
        "   Run with --info to see supported languages.\n\n"
    )
else:
    sys.stderr.write(
        f"Using Vision revision {chosen_revision}, level {'accurate' if recognition_level == VN_ACCURATE else 'fast'} with languages {chosen_langs}\n"
    )


def ocr_page(page) -> str:
    pix = page.get_pixmap(matrix=fitz.Matrix(3, 3), colorspace=fitz.csRGB)
    img_bytes = pix.tobytes("png")
    ns_data = NSData.dataWithBytes_length_(img_bytes, len(img_bytes))

    req = VNRecognizeTextRequest.alloc().init()
    req.setRecognitionLevel_(recognition_level)
    req.setRecognitionLanguages_(chosen_langs)
    req.setUsesLanguageCorrection_(True)
    req.setMinimumTextHeight_(0.01)
    try:
        req.setRevision_(chosen_revision)
    except Exception:
        pass  # older PyObjC may not have this setter

    handler = VNImageRequestHandler.alloc().initWithData_options_(ns_data, None)
    success, error = handler.performRequests_error_([req], None)
    if not success or error:
        sys.stderr.write(f"\n  Vision error: {error}\n")
        return ""

    results = req.results()
    if not results:
        return ""

    return "\n".join(c[0].string() for obs in results if (c := obs.topCandidates_(1)))


# ─── Main loop ────────────────────────────────────────────────────────────────
try:
    doc = fitz.open(pdf_path)
    total = len(doc)
    pages = list(range(total))
    if page_start is not None:
        end = page_end if page_end is not None else total
        pages = list(range(page_start, min(end, total)))

    sys.stderr.write(f"Apple Vision OCR: {os.path.basename(pdf_path)} ({len(pages)} pages)\n")

    pages_text: List[str] = []
    good = 0
    for i, page_num in enumerate(pages):
        sys.stderr.write(f"\r  Page {i+1}/{len(pages)} (p.{page_num+1})...   ")
        sys.stderr.flush()
        page = doc[page_num]
        try:
            text = ocr_page(page)
        except Exception as page_exc:
            sys.stderr.write(f"\n  Page {page_num+1} failed: {page_exc}\n")
            text = ""
        pages_text.append(text)
        if text.strip():
            good += 1
        # Show preview of first non-empty page so user can verify Cyrillic worked
        if i == 0 and text.strip():
            sys.stderr.write(f"\n  First page preview: {text.strip()[:200]!r}\n")

    doc.close()
    sys.stderr.write(f"\n  Done: {good}/{len(pages)} pages with text\n")

    output = "\n\n".join(pages_text)

    if output_path:
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(output)
        sys.stderr.write(f"  Wrote {len(output)} chars to {output_path}\n")
    else:
        sys.stdout.buffer.write(output.encode("utf-8", errors="replace"))
        sys.stdout.flush()

except Exception as exc:
    sys.stderr.write(f"\nError: {exc}\n")
    sys.exit(1)
