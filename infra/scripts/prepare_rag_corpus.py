#!/usr/bin/env python3
"""Prepare a legal-first RAG corpus manifest and optional downloads.

By default this script only generates manifests and does not download anything
unless --download-approved is used and rows are explicitly marked include_in_rag=true
with license_status set to open or licensed.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import pathlib
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

ALLOWED_LICENSES = {"open", "licensed"}
HTTP_SCHEMES = {"http", "https"}


def to_bool(value: str) -> bool:
    return str(value).strip().lower() in {"1", "true", "yes", "y"}


def is_approved(row: dict[str, str]) -> bool:
    return to_bool(row.get("include_in_rag", "false")) and row.get("license_status", "").lower() in ALLOWED_LICENSES


def sanitize_filename(title: str, source_id: str, url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    suffix = pathlib.Path(parsed.path).suffix or ".pdf"
    slug = "".join(c if c.isalnum() else "_" for c in title.lower()).strip("_")
    return f"{source_id}_{slug[:60]}{suffix}"


def build_records(csv_path: pathlib.Path) -> list[dict[str, str]]:
    with csv_path.open("r", encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file)
        return list(reader)


def download_file(url: str, out_path: pathlib.Path) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=60) as response:
        data = response.read()
    out_path.write_bytes(data)
    return hashlib.sha256(data).hexdigest()


def probe_url(url: str) -> dict[str, Any]:
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in HTTP_SCHEMES:
        return {"ok": False, "status": "unsupported_scheme", "content_type": None, "content_length": None}

    request = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return {
                "ok": True,
                "status": getattr(response, "status", 200),
                "content_type": response.headers.get("Content-Type"),
                "content_length": response.headers.get("Content-Length"),
            }
    except urllib.error.HTTPError as exc:
        return {"ok": False, "status": exc.code, "content_type": None, "content_length": None}
    except Exception as exc:  # noqa: BLE001
        return {"ok": False, "status": f"error: {exc}", "content_type": None, "content_length": None}


def build_manifest(rows: list[dict[str, str]], check_links: bool) -> list[dict[str, Any]]:
    manifest: list[dict[str, Any]] = []
    for row in rows:
        url = row["url"]
        parsed = urllib.parse.urlparse(url)
        approved = is_approved(row)
        item: dict[str, Any] = {
            "id": row["id"],
            "title": row["title"],
            "url": url,
            "source_type": row["source_type"],
            "license_status": row["license_status"],
            "approved_for_rag": approved,
            "downloaded": False,
            "sha256": None,
            "local_path": None,
            "http_scheme_allowed": parsed.scheme in HTTP_SCHEMES,
            "notes": row.get("notes", ""),
        }
        if check_links:
            item["probe"] = probe_url(url)
        manifest.append(item)
    return manifest


def maybe_download(manifest: list[dict[str, Any]], download_dir: pathlib.Path) -> None:
    for item in manifest:
        if not item["approved_for_rag"]:
            continue
        if not item["http_scheme_allowed"]:
            item["notes"] = f"{item['notes']} | skipped_non_http_url".strip(" |")
            continue

        filename = sanitize_filename(item["title"], item["id"], item["url"])
        destination = download_dir / filename
        try:
            checksum = download_file(item["url"], destination)
            item["downloaded"] = True
            item["sha256"] = checksum
            item["local_path"] = str(destination)
        except Exception as exc:  # noqa: BLE001
            item["notes"] = f"{item['notes']} | download_error: {exc}".strip(" |")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="infra/data/textbooks_sources.csv")
    parser.add_argument("--manifest", default="infra/data/rag_manifest.json")
    parser.add_argument("--download-dir", default="infra/data/raw")
    parser.add_argument("--download-approved", action="store_true")
    parser.add_argument("--check-links", action="store_true", help="Run HEAD probes and include status in manifest")
    args = parser.parse_args()

    rows = build_records(pathlib.Path(args.input))
    manifest = build_manifest(rows, check_links=args.check_links)

    download_dir = pathlib.Path(args.download_dir)
    download_dir.mkdir(parents=True, exist_ok=True)

    if args.download_approved:
        maybe_download(manifest, download_dir)

    manifest_path = pathlib.Path(args.manifest)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {manifest_path} with {len(manifest)} records")


if __name__ == "__main__":
    main()
