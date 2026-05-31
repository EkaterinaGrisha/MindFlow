#!/usr/bin/env python3
"""
extract_pdf_pymupdf.py

PyMuPDF-based PDF text extractor with cp1251 fallback.

Extraction cascade (per page):
  1. get_text("text")         — standard Unicode; works for modern PDFs
  2. get_text("rawdict")      — raw char codes + cp1251 decode; works for
                                FIZMATLIT books where ToUnicode is absent/wrong
     - if >20% of char codes are in 0xC0–0xFF → treat as cp1251 bytes

Install: pip install pymupdf
Exit codes: 0=ok  1=error  2=pymupdf missing  3=wrong args
"""

import sys
import os

try:
    import fitz  # PyMuPDF
except ImportError:
    sys.stderr.write("PyMuPDF (fitz) is not installed. Run: pip3 install pymupdf\n")
    sys.exit(2)

if len(sys.argv) < 2:
    sys.stderr.write("Usage: extract_pdf_pymupdf.py <pdf_path> [--debug]\n")
    sys.exit(3)

pdf_path = sys.argv[1]
debug = "--debug" in sys.argv

if not os.path.isfile(pdf_path):
    sys.stderr.write(f"File not found: {pdf_path}\n")
    sys.exit(1)


def cp1251_decode(char_codes: list[int]) -> str:
    """Decode a list of integer char codes as cp1251 bytes."""
    raw = bytes(c & 0xFF for c in char_codes if 0 <= c <= 0xFF)
    return raw.decode("cp1251", errors="replace")


def extract_via_rawdict(page) -> str:
    """
    Extract text from rawdict (char-level info, no Unicode remapping).
    Returns decoded text or "" if nothing useful found.
    """
    try:
        rd = page.get_text("rawdict", flags=fitz.TEXT_PRESERVE_WHITESPACE)
    except Exception as e:
        sys.stderr.write(f"  rawdict failed: {e}\n")
        return ""

    block_types = [b.get("type") for b in rd.get("blocks", [])]
    text_blocks = sum(1 for t in block_types if t == 0)
    image_blocks = sum(1 for t in block_types if t == 1)

    line_codes: list[list[int]] = []
    for block in rd.get("blocks", []):
        if block.get("type") != 0:  # 0 = text block
            continue
        for line in block.get("lines", []):
            codes_in_line: list[int] = []
            for span in line.get("spans", []):
                for ch in span.get("chars", []):
                    c = ch.get("c", 0)
                    codes_in_line.append(c)
            if codes_in_line:
                line_codes.append(codes_in_line)

    if not line_codes:
        if debug:
            sys.stderr.write(
                f"  rawdict: NO text blocks (text_blocks={text_blocks}, "
                f"image_blocks={image_blocks}) → SCANNED PAGE, needs OCR\n"
            )
        return ""

    all_codes = [c for line in line_codes for c in line]
    printable = [c for c in all_codes if c >= 0x20]
    ext_count = sum(1 for c in printable if 0xC0 <= c <= 0xFF)
    latin_ext_ratio = ext_count / max(len(printable), 1)

    if debug:
        sys.stderr.write(
            f"  rawdict: {len(all_codes)} codes, "
            f"{len(printable)} printable, "
            f"{ext_count} in 0xC0-0xFF ({100*latin_ext_ratio:.0f}%)\n"
        )

    if latin_ext_ratio > 0.15:
        # Looks like cp1251 encoded as latin1 — decode properly
        lines_decoded = [cp1251_decode(line) for line in line_codes]
        result = "\n".join(lines_decoded)
        if debug:
            sys.stderr.write(f"  rawdict→cp1251: first 120 chars: {result[:120]!r}\n")
        return result

    # Not cp1251 — just join char codes as Unicode chars
    lines_joined = [
        "".join(chr(c) if 0x20 <= c < 0x10000 else " " for c in line)
        for line in line_codes
    ]
    result = "\n".join(lines_joined)
    if debug:
        sys.stderr.write(f"  rawdict→unicode: first 120 chars: {result[:120]!r}\n")
    return result


def extract_page(page) -> str:
    # Mode 1: Standard Unicode extraction (works for modern PDFs)
    text = page.get_text("text", flags=fitz.TEXT_PRESERVE_WHITESPACE)
    cyr = sum(1 for c in text if "А" <= c <= "я" or c in "ЁёЄєІіЇї")
    meaningful = text.strip() and (
        cyr / max(len(text.replace(" ", "").replace("\n", "")), 1) > 0.05
        or (len(text) > 200 and cyr == 0)  # may be valid English
    )
    if meaningful:
        if debug:
            sys.stderr.write(f"  mode=text ok ({len(text)} chars, {cyr} cyr)\n")
        return text

    if debug:
        sys.stderr.write(
            f"  mode=text insufficient ({len(text)} chars, {cyr} cyr) → trying rawdict\n"
        )

    # Mode 2: Raw character codes + encoding detection
    raw = extract_via_rawdict(page)
    if raw.strip():
        return raw

    # Mode 3: HTML mode (sometimes extracts differently from "text")
    try:
        html = page.get_text("html")
        # Strip HTML tags
        import re
        plain = re.sub(r"<[^>]+>", "", html)
        plain = plain.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&nbsp;", " ")
        if plain.strip():
            if debug:
                sys.stderr.write(f"  mode=html ok ({len(plain)} chars)\n")
            return plain
    except Exception:
        pass

    return text  # whatever we got from mode 1 (may be empty)


try:
    doc = fitz.open(pdf_path)
    if debug:
        sys.stderr.write(f"Pages: {len(doc)}\n")

    pages_text = []
    for i, page in enumerate(doc):
        if debug:
            sys.stderr.write(f"Page {i+1}:\n")
        pages_text.append(extract_page(page))

    doc.close()

    output = "\n\n".join(pages_text)
    sys.stdout.buffer.write(output.encode("utf-8", errors="replace"))

except Exception as exc:
    sys.stderr.write(f"PyMuPDF extraction failed: {exc}\n")
    sys.exit(1)
