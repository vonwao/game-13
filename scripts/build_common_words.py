#!/usr/bin/env python3
"""
Build a ranked common-word module for Word Hunt.

Sources:
  https://github.com/david47k/top-english-wordlists

We intentionally build this from ranked nouns, adjectives, and verbs instead
of a generic top-words list. The game still uses the full lexicon for
validation, but planted words should come from a more recognizable,
content-heavy subset.
"""

from __future__ import annotations

import json
import re
import urllib.request
from pathlib import Path


SOURCE_URLS = {
    "nouns": (
        "https://raw.githubusercontent.com/david47k/top-english-wordlists/"
        "master/top_english_nouns_lower_10000.txt"
    ),
    "verbs": (
        "https://raw.githubusercontent.com/david47k/top-english-wordlists/"
        "master/top_english_verbs_lower_10000.txt"
    ),
    "adjs": (
        "https://raw.githubusercontent.com/david47k/top-english-wordlists/"
        "master/top_english_adjs_lower_10000.txt"
    ),
}
ROOT = Path(__file__).resolve().parents[1]
WORDS_RAW = ROOT / "modules" / "words_raw.txt"
OUT = ROOT / "modules" / "common_words.js"

BLOCKLIST = {
    "time", "people", "world", "state", "work", "system", "number",
    "government", "order", "part", "case", "cases", "example",
    "information", "development", "power", "view", "position", "type",
    "result", "results", "study", "studies", "language", "conditions",
    "service", "services", "business", "company", "policy", "general",
    "social", "political", "important", "different", "following",
    "direct", "final", "original", "complete", "financial", "primary",
    "western", "english", "religious", "appropriate", "standard",
    "available", "international", "national", "federal", "certain",
    "current", "public", "private", "common", "several", "various",
    "future", "recent", "modern", "legal", "official", "regional",
    "is", "was", "be", "are", "have", "had", "were", "can", "has",
    "been", "would", "will", "do", "may", "could", "should", "did",
    "said", "must", "being", "does", "make", "made", "used", "means",
    "seem", "appear", "become", "became", "include", "includes",
    "involved", "needed", "written", "understand", "received",
    "doing", "taking", "established", "followed", "consider",
    "published", "produced", "continued", "provide", "provided",
    "using", "working", "support", "supports", "believe",
}


def load_full_lexicon() -> set[str]:
    text = WORDS_RAW.read_text()
    return {line.strip().lower() for line in text.splitlines() if line.strip()}


def load_ranked_common_words() -> dict[str, list[str]]:
    out: dict[str, list[str]] = {}
    for key, url in SOURCE_URLS.items():
        text = urllib.request.urlopen(url, timeout=20).read().decode("utf-8")
        out[key] = [line.strip().lower() for line in text.splitlines() if line.strip()]
    return out


def filter_words(words: list[str], lexicon: set[str]) -> list[str]:
    filtered: list[str] = []
    seen: set[str] = set()
    for word in words:
        if word in seen:
            continue
        if not re.fullmatch(r"[a-z]+", word):
            continue
        if len(word) < 4 or len(word) > 8:
            continue
        if word not in lexicon:
            continue
        if word in BLOCKLIST:
            continue
        seen.add(word)
        filtered.append(word.upper())
    return filtered


def merge_ranked_lists(buckets: dict[str, list[str]]) -> list[str]:
    merged: list[str] = []
    seen: set[str] = set()
    nouns = buckets.get("nouns", [])
    adjs = buckets.get("adjs", [])
    verbs = buckets.get("verbs", [])
    max_len = max(len(nouns), len(adjs), len(verbs))

    for i in range(max_len):
        for bucket in (nouns, nouns, adjs, verbs):
            if i >= len(bucket):
                continue
            word = bucket[i]
            if word in seen:
                continue
            seen.add(word)
            merged.append(word)

    return merged


def write_module(words: list[str]) -> None:
    payload = json.dumps(words, separators=(",", ":"))
    source_payload = json.dumps(SOURCE_URLS, separators=(",", ":"))
    text = f"""(function () {{
  'use strict';

  window.LD = window.LD || {{}};

  window.LD.CommonWords = {{
    SOURCE_NAME: 'top-english-wordlists (nouns + adjectives + verbs)',
    SOURCE_URLS: {source_payload},
    RANKED: {payload}
  }};
}})();
"""
    OUT.write_text(text)


def main() -> None:
    lexicon = load_full_lexicon()
    source_words = load_ranked_common_words()
    filtered_buckets = {key: filter_words(words, lexicon) for key, words in source_words.items()}
    filtered = merge_ranked_lists(filtered_buckets)
    write_module(filtered)
    print(f"Generated {OUT.relative_to(ROOT)} with {len(filtered)} ranked words.")


if __name__ == "__main__":
    main()
