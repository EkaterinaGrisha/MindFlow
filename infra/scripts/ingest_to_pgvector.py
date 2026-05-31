#!/usr/bin/env python3
"""Ingest approved RAG sources into Supabase pgvector table."""

from __future__ import annotations

import argparse
import json
import os
import pathlib
from dataclasses import dataclass
from typing import Any

import requests

try:
    from pypdf import PdfReader
except Exception:  # noqa: BLE001
    PdfReader = None

CHUNK_TOKENS = 512
OVERLAP_TOKENS = int(CHUNK_TOKENS * 0.1)


@dataclass
class ManifestItem:
    id: str
    title: str
    approved_for_rag: bool
    local_path: str | None


def load_manifest(path: pathlib.Path) -> list[ManifestItem]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    items: list[ManifestItem] = []
    for row in raw:
        items.append(
            ManifestItem(
                id=row["id"],
                title=row["title"],
                approved_for_rag=bool(row.get("approved_for_rag", False)),
                local_path=row.get("local_path"),
            )
        )
    return items


def tokenize(text: str) -> list[str]:
    return text.split()


def chunk_tokens(tokens: list[str], chunk_size: int = CHUNK_TOKENS, overlap: int = OVERLAP_TOKENS) -> list[str]:
    if not tokens:
        return []
    chunks: list[str] = []
    step = max(1, chunk_size - overlap)
    for start in range(0, len(tokens), step):
        window = tokens[start : start + chunk_size]
        if not window:
            continue
        chunks.append(" ".join(window))
        if start + chunk_size >= len(tokens):
            break
    return chunks


def extract_text(path: pathlib.Path) -> str:
    suffix = path.suffix.lower()
    if suffix in {".txt", ".md"}:
        return path.read_text(encoding="utf-8", errors="ignore")

    if suffix == ".pdf":
        if PdfReader is None:
            raise RuntimeError("pypdf is required for PDF ingestion. Install: pip install pypdf")
        reader = PdfReader(str(path))
        pages: list[str] = []
        for page in reader.pages:
            pages.append(page.extract_text() or "")
        return "\n".join(pages)

    raise RuntimeError(f"Unsupported source format: {path}")


def deepseek_embed(
    api_key: str,
    text: str,
    *,
    base_url: str,
    embedding_model: str,
    cloudflare_ai_gateway_token: str | None,
) -> list[float]:
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    if cloudflare_ai_gateway_token:
        headers["cf-aig-authorization"] = f"Bearer {cloudflare_ai_gateway_token}"

    response = requests.post(
        f"{base_url.rstrip('/')}/embeddings",
        headers=headers,
        json={"model": embedding_model, "input": text},
        timeout=90,
    )
    if response.status_code >= 400:
        raise RuntimeError(f"DeepSeek embedding error {response.status_code}: {response.text}")

    data = response.json()
    embedding = data.get("data", [{}])[0].get("embedding")
    if not embedding:
        raise RuntimeError("DeepSeek embedding missing in response")
    return embedding


def cloudflare_embed(
    api_token: str,
    account_id: str,
    text: str,
    *,
    model: str,
) -> list[float]:
    response = requests.post(
        f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model}",
        headers={"Authorization": f"Bearer {api_token}", "Content-Type": "application/json"},
        json={"text": text},
        timeout=90,
    )
    if response.status_code >= 400:
        raise RuntimeError(f"Cloudflare embedding error {response.status_code}: {response.text}")

    data = response.json()
    embedding = data.get("result", {}).get("data", [[]])[0]
    if not embedding:
        raise RuntimeError("Cloudflare embedding missing in response")
    return embedding


def upsert_chunks(supabase_url: str, service_role_key: str, rows: list[dict[str, Any]]) -> None:
    endpoint = f"{supabase_url.rstrip('/')}/rest/v1/rag_chunks"
    response = requests.post(
        endpoint,
        headers={
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        json=rows,
        timeout=90,
    )
    if response.status_code >= 400:
        raise RuntimeError(f"Supabase insert error {response.status_code}: {response.text}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", default="infra/data/rag_manifest.json")
    parser.add_argument("--batch-size", type=int, default=25)
    args = parser.parse_args()

    embedding_provider = os.environ.get("EMBEDDING_PROVIDER", "cloudflare").strip().lower()

    cloudflare_api_token = os.environ.get("CLOUDFLARE_API_TOKEN")
    cloudflare_account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID")
    cloudflare_embedding_model = os.environ.get("CLOUDFLARE_EMBEDDING_MODEL", "@cf/baai/bge-small-en-v1.5")

    deepseek_api_key = os.environ.get("DEEPSEEK_API_KEY")
    deepseek_base_url = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
    deepseek_embedding_model = os.environ.get("DEEPSEEK_EMBEDDING_MODEL", "deepseek-embed")
    cloudflare_ai_gateway_token = os.environ.get("CLOUDFLARE_AI_GATEWAY_TOKEN")
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if embedding_provider == "cloudflare":
        if not cloudflare_api_token or not cloudflare_account_id:
            raise RuntimeError(
                "CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID are required for EMBEDDING_PROVIDER=cloudflare"
            )
    elif embedding_provider == "deepseek":
        if not deepseek_api_key:
            raise RuntimeError("DEEPSEEK_API_KEY is required for EMBEDDING_PROVIDER=deepseek")
    else:
        raise RuntimeError("EMBEDDING_PROVIDER must be 'cloudflare' or 'deepseek'")
    if not supabase_url or not supabase_service_role_key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")

    manifest_path = pathlib.Path(args.manifest)
    items = load_manifest(manifest_path)
    approved_items = [item for item in items if item.approved_for_rag]

    total_chunks = 0
    batch: list[dict[str, Any]] = []

    for item in approved_items:
        if not item.local_path:
            print(f"[skip] {item.id}: local_path is empty")
            continue

        local_path = pathlib.Path(item.local_path)
        if not local_path.exists():
            print(f"[skip] {item.id}: file not found at {local_path}")
            continue

        print(f"[ingest] {item.id}: {local_path}")
        text = extract_text(local_path)
        chunks = chunk_tokens(tokenize(text), chunk_size=CHUNK_TOKENS, overlap=OVERLAP_TOKENS)

        for idx, chunk_text in enumerate(chunks):
            if embedding_provider == "cloudflare":
                embedding = cloudflare_embed(
                    cloudflare_api_token,
                    cloudflare_account_id,
                    chunk_text,
                    model=cloudflare_embedding_model,
                )
            else:
                embedding = deepseek_embed(
                    deepseek_api_key,
                    chunk_text,
                    base_url=deepseek_base_url,
                    embedding_model=deepseek_embedding_model,
                    cloudflare_ai_gateway_token=cloudflare_ai_gateway_token,
                )
            batch.append(
                {
                    "source_id": item.id,
                    "source_title": item.title,
                    "chunk_text": chunk_text,
                    "embedding": embedding,
                    "page_hint": f"chunk {idx + 1}",
                    "chunk_index": idx,
                }
            )
            total_chunks += 1

            if len(batch) >= args.batch_size:
                upsert_chunks(supabase_url, supabase_service_role_key, batch)
                print(f"[flush] uploaded {len(batch)} chunks")
                batch = []

    if batch:
        upsert_chunks(supabase_url, supabase_service_role_key, batch)
        print(f"[flush] uploaded {len(batch)} chunks")

    print(f"Done. Uploaded chunks: {total_chunks}")


if __name__ == "__main__":
    main()
