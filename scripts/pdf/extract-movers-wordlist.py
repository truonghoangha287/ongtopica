#!/usr/bin/env python3
"""
Extract the A1 Movers wordlist from the official Cambridge YLE word list PDF.

    pip install pdfminer.six
    python3 scripts/pdf/extract-movers-wordlist.py --pdf tmp/cambridge-wordlist-2025.pdf

Writes `scripts/data/movers-wordlist.raw.json`, which is committed and is the
only thing `npm run gen:movers` reads. The PDF itself is copyrighted and must
NOT be committed -- keep it under `tmp/` (gitignored).

This script does *geometry*, not linguistics. Every string it emits is verbatim
from the PDF; all cleaning, splitting and interpretation happens in
`scripts/lib/movers-normalize.ts`, where it is unit-tested. Keeping the two
apart is what stops a parser tweak from silently changing what a child sees.

Why pdfminer and not pypdf: both passes need to know which *column* a word sits
in, and pypdf's visitor reports one text matrix per text-showing operation, so
the first entry of a table row is reported at the header's x. That silently
merges columns -- it cost this extractor 74 Movers words before the layout was
measured properly. pdfminer hands back a box per character, so columns are
recovered by measurement rather than by guesswork.

Two passes over the document:

  A-Z pass (pages 8-11) -- the Movers-only alphabetical list, laid out in four
    columns per page. Every real entry ends in a part-of-speech tag, which is
    what separates content from page chrome.

  Thematic pass (pages 38-43) -- topic tables. Six word columns, *two per
    level*: Starters at x~105/180, Movers at x~256/332, Flyers at x~407/483,
    with topic headers at x~48. A level's second column is the overflow of its
    first within the same topic block, so both belong to the topic whose header
    sits above them.
"""
import argparse
import hashlib
import json
import re
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path

from pdfminer.high_level import extract_pages
from pdfminer.layout import LAParams, LTChar

EXTRACTOR_VERSION = "scripts/pdf/extract-movers-wordlist.py@2"
SOURCE_URL = (
    "https://www.cambridgeenglish.org/Images/"
    "506166-starters-movers-flyers-word-list-2025.pdf"
)

# 1-based, inclusive, as printed in the PDF's own contents page.
AZ_PAGES = (8, 11)
THEMATIC_PAGES = (38, 43)

# Sanity bounds. The 2025 edition yields 399 A-Z entries and 270 thematic ones;
# the windows leave room for a reprint without letting a half-parsed document
# through. A truncated wordlist that ships silently is the worst failure mode
# here, so falling outside them is a hard error.
AZ_MIN, AZ_MAX = 390, 410
THEMATIC_MIN, THEMATIC_MAX = 260, 285

# Column left edges, measured from a run-start histogram over the real pages.
# A run is a group of characters with no horizontal gap wider than RUN_GAP_PT.
AZ_COLUMN_STARTS = (60.0, 189.0, 317.0, 446.0)
AZ_COLUMN_WIDTH = 128.0
THEMATIC_HEADER_BAND = (40.0, 76.0)
THEMATIC_MOVERS_BANDS = ((250.0, 300.0), (328.0, 378.0))

# Wider than inter-letter tracking, narrower than the gap between a word and
# its part-of-speech tag.
RUN_GAP_PT = 8.0
# Characters printed on one visual line share a baseline to within a hair.
Y_LINE_TOLERANCE = 0.6
# Lets an entry printed on the header's own baseline attach to that header
# rather than to the topic above it.
HEADER_CLAIM_EPSILON = 1.0

# The closed set of part-of-speech tags Cambridge uses. Closed on purpose: an
# unrecognised tag means the PDF changed and we want to hear about it.
POS_TAGS = [
    "adj", "adv", "conj", "det", "dis", "excl", "int", "num", "poss", "prep",
    "pron", "n", "v",
]
_POS_ALT = "|".join(sorted(POS_TAGS, key=len, reverse=True))
# `dolphin n` and `all adj + adv + det + pron` both fall out of this one rule.
AZ_ENTRY_RE = re.compile(
    rf"^(?P<head>.+?)\s+"
    rf"(?P<pos>(?:{_POS_ALT})(?:\s*\+\s*(?:{_POS_ALT}))*(?:\s+of\s+\w+)?)$"
)
# The grammatical key printed above each A-Z section ("n noun", "adj adjective").
KEY_LINE_RE = re.compile(rf"^(?:{_POS_ALT})\s+[a-z ]+$")
CHROME_RE = re.compile(
    r"Cambridge|wordlist|vocabulary list|Grammatical key|Pre A1|A1 Movers|A2 Flyers"
    r"|^\(No words at this level\)$|^Candidates will be expected|^\d+$",
    re.I,
)

# Page 11 closes the Movers list by re-listing the personal names candidates
# must recognise, as bare untagged words. Every one of them already appears in
# the alphabetical list proper ("Charlie n"), so this block is a recap: matching
# it lets us drop it deliberately instead of logging 16 phantom parse failures.
NAME_RECAP_RE = re.compile(r"^[A-Z][a-z]+$")

# Every topic title in the 2025 thematic list, after wrapped lines are merged.
KNOWN_TOPICS = {
    "Animals", "The body and the face", "Clothes", "Colours", "Family & friends",
    "Food & drink", "Health", "The home", "Materials", "Names", "Numbers",
    "Places & directions", "School", "Sports & leisure", "Time", "Toys",
    "Transport", "Weather", "The world around us", "Work",
}


def sha256_of(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def page_runs(page) -> list[tuple[float, float, str]]:
    """Every horizontal run of characters as (x, y, text).

    A run breaks wherever a horizontal gap exceeds RUN_GAP_PT, which is what
    keeps a word and the part-of-speech tag beside it -- or two words in
    adjacent columns -- from being glued into one string.
    """
    chars: list[LTChar] = []

    def walk(element) -> None:
        for child in element:
            if isinstance(child, LTChar):
                chars.append(child)
            elif hasattr(child, "__iter__"):
                walk(child)

    walk(page)

    rows: dict[float, list[LTChar]] = defaultdict(list)
    for char in chars:
        for baseline in rows:
            if abs(baseline - char.y0) <= Y_LINE_TOLERANCE:
                rows[baseline].append(char)
                break
        else:
            rows[char.y0].append(char)

    runs: list[tuple[float, float, str]] = []
    for baseline, row in rows.items():
        row = sorted(row, key=lambda c: c.x0)
        group = [row[0]]
        for previous, current in zip(row, row[1:]):
            if current.x0 - previous.x1 > RUN_GAP_PT:
                runs.append((group[0].x0, baseline, _text_of(group)))
                group = [current]
            else:
                group.append(current)
        runs.append((group[0].x0, baseline, _text_of(group)))

    return [run for run in runs if run[2]]


def _text_of(chars: list[LTChar]) -> str:
    raw = "".join(char.get_text() for char in chars)
    return re.sub(r"\s+", " ", raw.replace("\xa0", " ")).strip()


def _cells(runs, x_min: float, x_max: float) -> list[tuple[float, str]]:
    """Runs falling inside an x band, joined per baseline, top of page first."""
    rows: dict[float, list[tuple[float, str]]] = defaultdict(list)
    for x, y, text in runs:
        if x_min <= x <= x_max:
            rows[y].append((x, text))
    cells = [
        (y, " ".join(text for _, text in sorted(items)))
        for y, items in rows.items()
    ]
    return sorted(cells, key=lambda cell: -cell[0])


def extract_az(pdf_path: Path) -> tuple[list[dict], list[dict]]:
    """Pages 8-11: the Movers-only alphabetical list. Returns (entries, unparsed)."""
    entries: list[dict] = []
    unparsed: list[dict] = []
    order = 0
    page_numbers = list(range(AZ_PAGES[0] - 1, AZ_PAGES[1]))

    for offset, page in enumerate(
        extract_pages(str(pdf_path), page_numbers=page_numbers, laparams=LAParams())
    ):
        page_no = AZ_PAGES[0] + offset
        runs = page_runs(page)
        # Reading order is column by column, each top to bottom.
        for left in AZ_COLUMN_STARTS:
            lines = [
                text
                for _, text in _cells(runs, left - 4.0, left + AZ_COLUMN_WIDTH)
                if not CHROME_RE.search(text) and not KEY_LINE_RE.match(text)
            ]
            index = 0
            while index < len(lines):
                line = lines[index]
                match = AZ_ENTRY_RE.match(line)
                # A wrapped entry only matches once its tail is joined back on,
                # so retry a failing line exactly once with its successor.
                if not match and index + 1 < len(lines) and not NAME_RECAP_RE.match(line):
                    joined = f"{line} {lines[index + 1]}"
                    if AZ_ENTRY_RE.match(joined):
                        line, match = joined, AZ_ENTRY_RE.match(joined)
                        index += 1
                if match:
                    entries.append({"raw": line, "page": page_no, "order": order})
                    order += 1
                elif NAME_RECAP_RE.match(line):
                    pass  # recap of names already captured above
                else:
                    unparsed.append({"raw": line, "page": page_no, "pass": "az"})
                index += 1

    return entries, unparsed


def _merge_wrapped_headers(headers: list[tuple[float, str]]) -> list[tuple[float, str]]:
    """Join a topic title split across lines ("Food &" / "drink").

    Matched against the closed KNOWN_TOPICS set rather than by line spacing:
    lines are absorbed while the accumulated title is still a strict prefix of
    some known topic, and emitted the moment it equals one. Spacing alone is
    not enough -- where short blocks stack (Materials / Names / Numbers) the gap
    between two different topics is the same as the gap inside a wrapped one.

    A title that never resolves is emitted as-is, which fails the KNOWN_TOPICS
    assertion in check() and tells us the PDF's topic list has changed.
    """
    prefixes = {
        " ".join(topic.split()[:count])
        for topic in KNOWN_TOPICS
        for count in range(1, len(topic.split()))
    }

    merged: list[tuple[float, str]] = []
    index = 0
    while index < len(headers):
        top, title = headers[index]
        while title not in KNOWN_TOPICS and title in prefixes and index + 1 < len(headers):
            index += 1
            title = f"{title} {headers[index][1]}"
        # Report the topmost baseline: entries in this block start level with it.
        merged.append((top, re.sub(r"\s+", " ", title).strip()))
        index += 1
    return merged


def _join_continuations(cells: list[tuple[float, str]]) -> list[tuple[float, str]]:
    """Fold a wrapped parenthetical back onto the entry it belongs to.

    A narrow column breaks long entries across lines, always inside the
    parenthetical: "sports centre" / "(US center)", "floor (e.g. ground," /
    "1st, etc.)". Both shapes are caught by looking at the parentheses -- the
    continuation either opens with one, or completes one its predecessor left
    unbalanced. Cells arrive top-to-bottom, so the predecessor is the last cell
    already emitted.
    """
    joined: list[tuple[float, str]] = []
    for baseline, text in cells:
        unbalanced = joined and joined[-1][1].count("(") > joined[-1][1].count(")")
        if joined and (text.startswith("(") or unbalanced):
            top, previous = joined[-1]
            joined[-1] = (top, f"{previous} {text}")
        else:
            joined.append((baseline, text))
    return joined


def extract_thematic(pdf_path: Path) -> tuple[list[dict], list[dict]]:
    """Pages 38-43: both Movers columns of the thematic tables, with topics."""
    entries: list[dict] = []
    unparsed: list[dict] = []
    page_numbers = list(range(THEMATIC_PAGES[0] - 1, THEMATIC_PAGES[1]))

    for offset, page in enumerate(
        extract_pages(str(pdf_path), page_numbers=page_numbers, laparams=LAParams())
    ):
        page_no = THEMATIC_PAGES[0] + offset
        runs = page_runs(page)

        headers = [
            cell
            for cell in _cells(runs, *THEMATIC_HEADER_BAND)
            if not CHROME_RE.search(cell[1])
        ]
        headers = _merge_wrapped_headers(headers)

        for band in THEMATIC_MOVERS_BANDS:
            cells = [c for c in _cells(runs, *band) if not CHROME_RE.search(c[1])]
            for baseline, text in _join_continuations(cells):
                # The owning topic is the lowest header still at or above this
                # entry; the epsilon lets a first entry share that baseline.
                above = [h for h in headers if h[0] >= baseline - HEADER_CLAIM_EPSILON]
                if not above:
                    unparsed.append(
                        {"raw": text, "page": page_no, "pass": "thematic"}
                    )
                    continue
                entries.append(
                    {
                        "raw": text,
                        "topicRaw": min(above, key=lambda h: h[0])[1],
                        "page": page_no,
                        "y": round(baseline, 2),
                    }
                )

    return entries, unparsed


def check(az: list[dict], thematic: list[dict]) -> list[str]:
    problems: list[str] = []

    if not AZ_MIN <= len(az) <= AZ_MAX:
        problems.append(f"A-Z entries: got {len(az)}, want {AZ_MIN}-{AZ_MAX}")
    if not THEMATIC_MIN <= len(thematic) <= THEMATIC_MAX:
        problems.append(
            f"thematic entries: got {len(thematic)}, "
            f"want {THEMATIC_MIN}-{THEMATIC_MAX}"
        )

    heads = [
        match.group("head") if (match := AZ_ENTRY_RE.match(entry["raw"])) else entry["raw"]
        for entry in az
    ]
    duplicates = sorted({head for head in heads if heads.count(head) > 1})
    if duplicates:
        problems.append(f"duplicate A-Z heads: {duplicates}")

    missing = set(range(AZ_PAGES[0], AZ_PAGES[1] + 1)) - {e["page"] for e in az}
    if missing:
        problems.append(f"A-Z pages with no entries: {sorted(missing)}")

    unknown = sorted({e["topicRaw"] for e in thematic} - KNOWN_TOPICS)
    if unknown:
        problems.append(f"unrecognised topic headers: {unknown}")

    return problems


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pdf", required=True, type=Path)
    parser.add_argument(
        "--out", type=Path, default=Path("scripts/data/movers-wordlist.raw.json")
    )
    args = parser.parse_args()

    if not args.pdf.exists():
        print(f"error: no such PDF: {args.pdf}", file=sys.stderr)
        return 2

    az, az_unparsed = extract_az(args.pdf)
    thematic, thematic_unparsed = extract_thematic(args.pdf)

    problems = check(az, thematic)
    if problems:
        print("Extraction failed its sanity checks:", file=sys.stderr)
        for problem in problems:
            print(f"  - {problem}", file=sys.stderr)
        return 1

    payload = {
        "source": {
            "url": SOURCE_URL,
            "sha256": sha256_of(args.pdf),
            "pages": {"az": list(AZ_PAGES), "thematic": list(THEMATIC_PAGES)},
            "extractedAt": date.today().isoformat(),
            "extractor": EXTRACTOR_VERSION,
        },
        "azEntries": az,
        "thematicEntries": thematic,
        "unparsed": az_unparsed + thematic_unparsed,
    }

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")

    print(f"{len(az)} A-Z entries, {len(thematic)} thematic entries")
    if payload["unparsed"]:
        print(f"WARNING: {len(payload['unparsed'])} unparsed lines recorded")
    print(f"wrote {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
