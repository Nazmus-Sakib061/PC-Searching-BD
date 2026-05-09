import argparse
import hashlib
import json
import os
import re
import sqlite3
import time
from datetime import datetime, timedelta, timezone
from urllib.parse import quote_plus

import requests

from init_catalog_db import init_catalog_db

DB_NAME = "pc_builder_db.sqlite"
SOURCE_NAME = "Newegg"
RETAILER_NAME = "Newegg"
BASE_PROXY = "https://r.jina.ai/http://"
BASE_SITE = "http://www.newegg.com"

CATEGORIES = [
    {
        "product_type": "CPU",
        "category": "CPU",
        "query": "cpu processor",
        "queries": ["cpu processor", "desktop processor", "amd processor", "intel processor"],
    },
    {
        "product_type": "GPU",
        "category": "GPU",
        "query": "graphics card",
        "queries": ["graphics card", "video card", "graphics cards"],
    },
    {
        "product_type": "Motherboard",
        "category": "MOTHERBOARD",
        "query": "motherboard",
        "queries": [
            "motherboard",
            "am5 motherboard",
            "lga 1700 motherboard",
            "gaming motherboard",
            "b650 motherboard",
            "z790 motherboard",
            "micro atx motherboard",
            "mini itx motherboard",
        ],
    },
    {
        "product_type": "RAM",
        "category": "RAM",
        "query": "memory ram",
        "queries": [
            "memory ram",
            "ddr5 memory",
            "ddr4 memory",
            "desktop memory",
            "32gb ddr5",
            "16gb ddr5",
            "32gb ddr4",
            "desktop ram",
        ],
    },
    {
        "product_type": "Storage",
        "category": "STORAGE",
        "query": "solid state drive",
        "queries": [
            "solid state drive",
            "ssd",
            "nvme ssd",
            "internal ssd",
            "1tb ssd",
            "2tb ssd",
            "m.2 ssd",
            "pcie 4.0 ssd",
        ],
    },
    {
        "product_type": "PSU",
        "category": "PSU",
        "query": "power supply",
        "queries": [
            "power supply",
            "psu",
            "computer power supply",
            "modular power supply",
            "750w psu",
            "850w psu",
            "1000w psu",
            "atx power supply",
        ],
    },
    {
        "product_type": "Case",
        "category": "CASE",
        "query": "computer case",
        "queries": [
            "computer case",
            "pc case",
            "atx case",
            "gaming case",
            "micro atx case",
            "mini itx case",
            "mid tower case",
            "full tower case",
        ],
    },
    {
        "product_type": "CPU Cooler",
        "category": "CPU COOLER",
        "query": "cpu cooler",
        "queries": ["cpu cooler", "air cooler", "liquid cooler", "aio cooler"],
    },
    {
        "product_type": "Laptop",
        "category": "LAPTOP",
        "query": "laptop notebook",
        "queries": [
            "laptop notebook",
            "gaming laptop",
            "business laptop",
            "2 in 1 laptop",
            "ultrabook",
            "creator laptop",
            "notebook computer",
            "portable laptop",
        ],
    },
]

BRAND_ALIASES = [
    ("COOLER MASTER", "Cooler Master"),
    ("BE QUIET", "be quiet!"),
    ("G.SKILL", "G.SKILL"),
    ("WESTERN DIGITAL", "Western Digital"),
    ("TEAMGROUP", "TeamGroup"),
    ("THERMALRIGHT", "Thermalright"),
    ("DEEP COOL", "DeepCool"),
    ("DEEPCOOL", "DeepCool"),
    ("GIGABYTE", "GIGABYTE"),
    ("ASROCK", "ASRock"),
    ("SAPPHIRE", "SAPPHIRE"),
    ("CORSAIR", "Corsair"),
    ("KINGSTON", "Kingston"),
    ("CRUCIAL", "Crucial"),
    ("SAMSUNG", "Samsung"),
    ("SEAGATE", "Seagate"),
    ("PNY", "PNY"),
    ("XFX", "XFX"),
    ("ZOTAC", "ZOTAC"),
    ("MSI", "MSI"),
    ("ASUS", "ASUS"),
    ("LENOVO", "Lenovo"),
    ("DELL", "Dell"),
    ("HP", "HP"),
    ("ACER", "Acer"),
    ("INTEL", "Intel"),
    ("AMD", "AMD"),
    ("NVIDIA", "NVIDIA"),
]

PRICE_RE = re.compile(r"^\$([\d,]+(?:\.\d{2})?)$")
RANGE_PRICE_RE = re.compile(r"from\s+\$([\d,]+(?:\.\d{2})?)\s*-\s*\$([\d,]+(?:\.\d{2})?)", re.I)
RATING_RE = re.compile(r"\((\d{1,6})\)")
TITLE_LINK_RE = re.compile(
    r'^\[(?P<title>.+?)\]\((?P<url>https?://www\.newegg\.com/[^\s)]+)(?:\s+"View Details")?\)$'
)
SPEC_BULLET_RE = re.compile(r'^\*\s+\*\*(?P<label>[^*]+?)\:\*\s*(?P<value>.+?)\s*$')
MULTISPACE_RE = re.compile(r"\s+")

NOISE_EXACT = {
    "free shipping",
    "free gift",
    "new",
    "sale",
    "advertisement",
    "sponsored",
    "best seller",
    "add to cart",
    "shop now",
    "compare",
    "more options",
    "view details",
    "see all",
    "filter",
    "recommend use",
    "recommend series",
}


def normalize_text(value):
    return MULTISPACE_RE.sub(" ", str(value or "")).strip()


def normalize_slug(value):
    value = normalize_text(value).lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def normalize_space(value):
    return MULTISPACE_RE.sub(" ", str(value or "")).strip()


def strip_markdown_links(value):
    value = str(value or "")
    value = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", value)
    return normalize_space(value)


def make_short_name(title):
    cleaned = normalize_text(title)
    if " - " in cleaned:
      head = cleaned.split(" - ", 1)[0].strip()
      return head or cleaned
    return cleaned


def make_description(title, spec_fields):
    parts = []
    tail = ""
    cleaned = normalize_text(title)
    if " - " in cleaned:
        tail = " - ".join(segment.strip() for segment in cleaned.split(" - ")[1:]).strip()
    if tail:
        parts.append(tail)

    preferred_labels = [
        "socket",
        "socket type",
        "cores",
        "threads",
        "wattage",
        "capacity",
        "memory size",
        "memory type",
        "form factor",
        "chipset",
        "interface",
        "speed",
        "max speed",
        "fan size",
        "resolution",
        "display size",
        "processor type",
        "processor speed",
        "graphics",
    ]

    for label in preferred_labels:
        value = spec_fields.get(label)
        if value and value not in parts:
            parts.append(f"{label.title()}: {value}")
        if len(parts) >= 4:
            break

    if not parts and spec_fields:
        for key, value in list(spec_fields.items())[:4]:
            if value:
                parts.append(f"{key.replace('_', ' ').title()}: {value}")

    description = " | ".join(parts)
    if len(description) > 260:
        description = f"{description[:257].rstrip()}..."
    return description


def parse_size_gb(value):
    text = normalize_text(value).upper()
    match_tb = re.search(r"(\d+(?:\.\d+)?)\s*TB", text)
    if match_tb:
        return int(round(float(match_tb.group(1)) * 1024))
    match_gb = re.search(r"(\d+(?:\.\d+)?)\s*GB", text)
    if match_gb:
        return int(round(float(match_gb.group(1))))
    return None


def parse_integer(value):
    match = re.search(r"(\d{2,5})", normalize_text(value))
    return int(match.group(1)) if match else None


def parse_cores(text):
    match = re.search(r"(\d+)\s*-\s*Core", text, re.I)
    if match:
        return int(match.group(1))
    match = re.search(r"(\d+)\s*Core", text, re.I)
    if match:
        return int(match.group(1))
    return None


def parse_threads(text):
    match = re.search(r"(\d+)\s*Thread", text, re.I)
    return int(match.group(1)) if match else None


def parse_socket_type(text):
    patterns = [
        r"Socket\s+([A-Z0-9]+\s?[A-Z0-9]*)",
        r"\bLGA\s?\d{4}\b",
        r"\bAM[45]\b",
        r"\bsWRX8\b",
        r"\bsTR5\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.I)
        if match:
            return normalize_text(match.group(0) if len(match.groups()) == 0 else match.group(1)).upper()
    return None


def parse_ram_type(text):
    match = re.search(r"\bDDR[345]\b", text, re.I)
    return match.group(0).upper() if match else None


def parse_form_factor(text):
    patterns = [r"\bMini-ITX\b", r"\bmITX\b", r"\bmicro ATX\b", r"\bmATX\b", r"\bATX\b", r"\bE-ATX\b"]
    for pattern in patterns:
        match = re.search(pattern, text, re.I)
        if match:
            return normalize_text(match.group(0)).upper()
    return None


def derive_structured_fields(product_type, title, spec_fields):
    combined = " ".join(
        normalize_text(part)
        for part in [
            title,
            " ".join(f"{k}: {v}" for k, v in spec_fields.items()),
        ]
        if part
    )
    combined_upper = combined.upper()
    fields = dict(spec_fields)

    if product_type == "CPU":
        fields.setdefault("socket_type", parse_socket_type(combined_upper))
        fields.setdefault("cores", parse_cores(combined_upper))
        fields.setdefault("threads", parse_threads(combined_upper))
        wattage = re.search(r"(\d{2,3})\s*W\b", combined_upper)
        if wattage:
            fields.setdefault("wattage_w", int(wattage.group(1)))
    elif product_type == "GPU":
        vram = re.search(r"(\d{1,3})\s*GB", combined_upper)
        if vram:
            fields.setdefault("vram_gb", int(vram.group(1)))
        memory_type = re.search(r"\bGDDR[34567]\b", combined_upper)
        if memory_type:
            fields.setdefault("memory_type", memory_type.group(0))
        pcie = re.search(r"PCIe\s*([0-9.]+)", combined_upper, re.I)
        if pcie:
            fields.setdefault("pcie_version", pcie.group(1))
    elif product_type == "Motherboard":
        fields.setdefault("socket_type", parse_socket_type(combined_upper))
        fields.setdefault("ram_type", parse_ram_type(combined_upper))
        form_factor = parse_form_factor(combined_upper)
        if form_factor:
            fields.setdefault("form_factor", form_factor)
        chipset = re.search(r"\b(B[0-9]{3,4}|Z[0-9]{3,4}|H[0-9]{3,4}|X[0-9]{3,4})\b", combined_upper)
        if chipset:
            fields.setdefault("chipset", chipset.group(1))
    elif product_type == "RAM":
        capacity = parse_size_gb(combined_upper)
        if capacity:
            fields.setdefault("capacity_gb", capacity)
        ram_type = parse_ram_type(combined_upper)
        if ram_type:
            fields.setdefault("type", ram_type)
        speed = re.search(r"(\d{4,6})\s*(?:MT/S|MHZ)\b", combined_upper)
        if speed:
            fields.setdefault("speed_mhz", int(speed.group(1)))
    elif product_type == "Storage":
        capacity = parse_size_gb(combined_upper)
        if capacity:
            fields.setdefault("capacity_gb", capacity)
        if "NVME" in combined_upper or "M.2" in combined_upper:
            fields.setdefault("interface", "NVMe")
        elif "SATA" in combined_upper:
            fields.setdefault("interface", "SATA")
        form_factor = re.search(r"\b2\.5\"?\b|\bM\.2\b", combined_upper, re.I)
        if form_factor:
            fields.setdefault("form_factor", form_factor.group(0).replace('"', ''))
    elif product_type == "PSU":
        wattage = re.search(r"(\d{3,4})\s*W\b", combined_upper)
        if wattage:
            fields.setdefault("wattage_w", int(wattage.group(1)))
        if "MODULAR" in combined_upper:
            fields.setdefault("modular", "Yes")
    elif product_type == "Case":
        form_factor = parse_form_factor(combined_upper)
        if form_factor:
            fields.setdefault("form_factor", form_factor)
    elif product_type == "CPU Cooler":
        fan_size = re.search(r"(\d{2,3})\s*MM\b", combined_upper)
        if fan_size:
            fields.setdefault("fan_size_mm", int(fan_size.group(1)))
        if "AIO" in combined_upper or "LIQUID" in combined_upper:
            fields.setdefault("cooler_type", "Liquid")
        elif "AIR" in combined_upper:
            fields.setdefault("cooler_type", "Air")
    elif product_type == "Laptop":
        display = re.search(r"(\d{1,2}(?:\.\d+)?)\s*INCH|\b(\d{1,2}(?:\.\d+)?)\s*\"", combined_upper)
        if display:
            value = display.group(1) or display.group(2)
            fields.setdefault("display_size_in", float(value))
        cpu_match = re.search(r"(RYZEN\s+[0-9A-Z\-]+|CORE\s+i[3579][^\s,]*)", combined_upper)
        if cpu_match:
            fields.setdefault("cpu_platform", cpu_match.group(1))

    return fields


def normalize_spec_label(label):
    return normalize_space(label).lower().replace(" ", "_")


def parse_spec_fields(lines):
    fields = {}
    description_lines = []

    for line in lines:
        if is_noise_line(line):
            continue
        match = SPEC_BULLET_RE.match(line)
        if match:
            label = normalize_spec_label(match.group("label"))
            value = strip_markdown_links(match.group("value")).lstrip("* ").strip()
            if label and value:
                fields[label] = value
                continue
        cleaned = strip_markdown_links(line)
        if cleaned and not cleaned.startswith("Model #:") and not cleaned.startswith("Item #:"):
            description_lines.append(cleaned)

    return fields, description_lines


def parse_price(value):
    if value is None:
        return None
    cleaned = str(value).replace(",", "").strip()
    try:
        return round(float(cleaned), 2)
    except ValueError:
        return None


def is_noise_line(line):
    if not line:
        return True

    lowered = line.strip().lower()
    if lowered in NOISE_EXACT:
        return True

    if lowered.startswith("more options from"):
        return True
    if lowered.startswith("model #:"):
        return True
    if lowered.startswith("model #"):
        return True
    if lowered.startswith("starting at"):
        return True
    if lowered.startswith("save "):
        return True
    if lowered.startswith("* save:"):
        return True
    if lowered.startswith("save:"):
        return True
    if lowered.startswith("sale ends"):
        return True
    if lowered.startswith("coupon"):
        return True
    if lowered.startswith("bundle"):
        return True
    if lowered.startswith("ships from"):
        return True
    if lowered.startswith("free shipping"):
        return True
    if lowered.startswith("in stock"):
        return True
    if lowered.startswith("out of stock"):
        return True
    if lowered.startswith("pre-order"):
        return True
    if lowered.startswith("backorder"):
        return True
    if lowered.startswith("customer rating"):
        return True
    if lowered.startswith("ratings"):
        return True
    if lowered.startswith("sort by"):
        return True
    if lowered.startswith("page "):
        return True
    if lowered.startswith("recommend use"):
        return True
    if lowered.startswith("recommend series"):
        return True
    if lowered.startswith("you may also like"):
        return True

    return False


def extract_brand(title):
    upper_title = normalize_text(title).upper()
    for alias, display in sorted(BRAND_ALIASES, key=lambda item: len(item[0]), reverse=True):
        if upper_title.startswith(alias + " ") or upper_title == alias:
            return display
    first_word = normalize_text(title).split(" ", 1)[0]
    return first_word[:1].upper() + first_word[1:] if first_word else None


def extract_model(title, brand):
    cleaned = normalize_text(title)
    if brand:
        brand_upper = brand.upper()
        if cleaned.upper().startswith(brand_upper + " "):
            cleaned = cleaned[len(brand):].strip(" -:|")
    tokens = cleaned.split()
    if not tokens:
        return None
    for token in reversed(tokens):
        if re.search(r"[A-Z0-9]{3,}", token.upper()):
            return token.strip(" ,;")
    return tokens[-1].strip(" ,;")


def build_source_item_id(product_type, category, title, brand, model):
    payload = {
        "source": SOURCE_NAME,
        "product_type": normalize_text(product_type).upper(),
        "category": normalize_text(category).upper(),
        "brand": normalize_text(brand).upper(),
        "model": normalize_text(model).upper(),
        "title": normalize_text(title).upper(),
    }
    raw = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()


def detect_availability(lines):
    joined = " ".join(line.lower() for line in lines)
    if "out of stock" in joined or "sold out" in joined:
        return "Out of Stock"
    if "pre-order" in joined or "pre order" in joined:
        return "Pre-Order"
    if "backorder" in joined or "back order" in joined:
        return "Backorder"
    if "in stock" in joined:
        return "In Stock"
    if "available" in joined:
        return "Available"
    return None


def extract_rating_count(lines):
    for line in lines:
        match = RATING_RE.search(line)
        if match:
            return int(match.group(1))
    return 0


def extract_price(lines):
    standalone_prices = []
    for line in lines:
        match = PRICE_RE.match(line)
        if match:
            standalone_prices.append(parse_price(match.group(1)))

    if standalone_prices:
        standalone_prices = [price for price in standalone_prices if price is not None]
        if standalone_prices:
            return standalone_prices[-1]

    for line in lines:
        range_match = RANGE_PRICE_RE.search(line)
        if range_match:
            return parse_price(range_match.group(1))

    return None


def select_title(lines, price_index):
    search_space = lines[:price_index] if price_index is not None and price_index > 0 else lines
    candidates = []
    for line in search_space:
        if is_noise_line(line):
            continue
        if PRICE_RE.match(line):
            continue
        if RANGE_PRICE_RE.search(line):
            continue
        if RATING_RE.fullmatch(line):
            continue
        if len(line) < 5:
            continue
        candidates.append(line)

    if candidates:
        return max(candidates, key=len)

    for line in search_space:
        if not is_noise_line(line) and len(line) >= 5:
            return line

    return None


def parse_chunk(chunk, product_type):
    lines = [normalize_space(line) for line in chunk.splitlines()]
    lines = [line for line in lines if line]

    if len(lines) < 2:
        return None

    title = None
    product_url = None
    title_index = None
    for index, line in enumerate(lines):
        match = TITLE_LINK_RE.match(line)
        if match:
            title = normalize_text(match.group("title"))
            product_url = match.group("url")
            title_index = index
            break

    price_index = None
    for index, line in enumerate(lines):
        if PRICE_RE.match(line) or RANGE_PRICE_RE.search(line):
            price_index = index
            break

    if price_index is None:
        return None

    if not title:
        title = select_title(lines, price_index)
    if not title:
        return None

    if title_index is None:
        title_index = next(
            (i for i, line in enumerate(lines) if normalize_text(title).lower() in line.lower()),
            0,
        )

    price = extract_price(lines[price_index:])
    if price is None:
        price = extract_price(lines)
    if price is None:
        return None

    spec_start = min(price_index, len(lines))
    spec_lines = lines[title_index + 1:spec_start] if title_index is not None else lines[:spec_start]
    spec_fields, description_lines = parse_spec_fields(spec_lines)
    brand = extract_brand(title)
    spec_fields = derive_structured_fields(product_type, title, spec_fields)
    model = spec_fields.get("model") or spec_fields.get("model_#") or extract_model(title, brand)
    availability = detect_availability(lines)
    rating_count = extract_rating_count(lines)
    short_name = make_short_name(title)
    description = make_description(title, spec_fields)
    if not description and description_lines:
        description = " | ".join(description_lines[:4])
    if not description:
        description = short_name

    return {
        "title": title,
        "short_name": short_name,
        "description": description,
        "product_url": product_url,
        "brand": brand,
        "model": model,
        "price": price,
        "availability": availability,
        "rating_count": rating_count,
        "spec_fields": spec_fields,
        "description_lines": description_lines,
    }


def fetch_page(session, query, page):
    search_url = f"{BASE_SITE}/p/pl?d={quote_plus(query)}&page={page}"
    proxy_url = f"{BASE_PROXY}{search_url}"
    backoff_seconds = 5
    for attempt in range(1, 6):
        response = session.get(proxy_url, timeout=90)
        if response.status_code == 429:
            if attempt == 5:
                response.raise_for_status()
            time.sleep(backoff_seconds)
            backoff_seconds *= 2
            continue
        response.raise_for_status()
        return search_url, response.text

    raise RuntimeError(f"Failed to fetch {search_url}")


def parse_page(text, product_type):
    lines = [normalize_space(line) for line in text.splitlines()]
    lines = [line for line in lines if line]

    blocks = []
    if any(line == "QUICK VIEW" for line in lines):
        current_block = []
        seen_first_card = False

        for line in lines:
            if line == "QUICK VIEW":
                if current_block:
                    blocks.append("\n".join(current_block))
                    current_block = []
                seen_first_card = True
                continue

            if not seen_first_card:
                continue

            current_block.append(line)

        if current_block:
            blocks.append("\n".join(current_block))
    else:
        current_block = []
        seen_first_card = False

        for line in lines:
            if TITLE_LINK_RE.match(line):
                if current_block:
                    blocks.append("\n".join(current_block))
                    current_block = []
                seen_first_card = True

            if not seen_first_card:
                continue

            current_block.append(line)

        if current_block:
            blocks.append("\n".join(current_block))

    products = []
    for block in blocks:
        parsed = parse_chunk(block, product_type)
        if parsed:
            products.append(parsed)

    return products


def connect_db():
    conn = sqlite3.connect(DB_NAME)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.row_factory = sqlite3.Row
    return conn


def upsert_component(conn, item, category_config, page_url):
    product_type = category_config["product_type"]
    category = category_config["category"]
    title = item.get("short_name") or item.get("title")
    source_item_id = build_source_item_id(
        product_type=product_type,
        category=category,
        title=title,
        brand=item.get("brand"),
        model=item.get("model"),
    )

    specs = {
        "source": SOURCE_NAME,
        "search_query": category_config["query"],
        "page_url": page_url,
        "rating_count": item.get("rating_count", 0),
        "availability": item.get("availability"),
        "description": item.get("description"),
        "spec_fields": item.get("spec_fields") or {},
        "scraped_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }

    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO components (
            source_name, product_type, category, name, description, brand, model,
            specs, product_url, image_url, availability, rating_count,
            source_item_id, first_seen_at, last_seen_at, out_of_stock_since,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(source_item_id) DO UPDATE SET
            source_name=excluded.source_name,
            product_type=excluded.product_type,
            category=excluded.category,
            name=excluded.name,
            description=excluded.description,
            brand=excluded.brand,
            model=excluded.model,
            specs=excluded.specs,
            product_url=excluded.product_url,
            image_url=excluded.image_url,
            availability=excluded.availability,
            rating_count=excluded.rating_count,
            last_seen_at=CURRENT_TIMESTAMP,
            out_of_stock_since=CASE
                WHEN excluded.availability IN ('Out of Stock', 'Sold Out', 'Backorder', 'Pre-Order')
                THEN COALESCE(components.out_of_stock_since, CURRENT_TIMESTAMP)
                ELSE NULL
            END,
            updated_at=CURRENT_TIMESTAMP
        """,
        (
            SOURCE_NAME,
            product_type,
            category,
            title,
            item.get("description"),
            item.get("brand"),
            item.get("model"),
            json.dumps(specs, sort_keys=True),
            item.get("product_url") or page_url,
            None,
            item.get("availability"),
            int(item.get("rating_count") or 0),
            source_item_id,
            None if item.get("availability") not in {"Out of Stock", "Sold Out", "Backorder", "Pre-Order"} else datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
        ),
    )

    cursor.execute(
        "SELECT id FROM components WHERE source_item_id = ?",
        (source_item_id,),
    )
    component_row = cursor.fetchone()
    if not component_row:
        return None

    component_id = component_row["id"]
    cursor.execute(
        """
        INSERT INTO retailer_prices (
            component_id, retailer_name, price, url, availability, updated_at
        )
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(component_id, retailer_name, url) DO UPDATE SET
            price=excluded.price,
            availability=excluded.availability,
            updated_at=CURRENT_TIMESTAMP
        """,
        (
            component_id,
            RETAILER_NAME,
            float(item["price"]),
            page_url,
            item.get("availability"),
        ),
    )

    return source_item_id


def cleanup_stale_rows(conn, keep_days=7):
    cutoff = datetime.now(timezone.utc) - timedelta(days=keep_days)
    cutoff_str = cutoff.strftime("%Y-%m-%d %H:%M:%S")
    cursor = conn.cursor()
    cursor.execute(
        """
        DELETE FROM components
        WHERE datetime(last_seen_at) < datetime(?)
           OR (
                availability IN ('Out of Stock', 'Sold Out', 'Backorder', 'Pre-Order')
                AND out_of_stock_since IS NOT NULL
                AND datetime(out_of_stock_since) < datetime(?)
              )
        """,
        (cutoff_str, cutoff_str),
    )
    return cursor.rowcount


def scrape_catalog(max_pages=8, min_items=70, delay=1.0, keep_db=False, category_filter=None):
    init_catalog_db(reset=not keep_db)

    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
        }
    )

    conn = connect_db()
    total_rows = 0
    per_category_stats = []

    try:
        active_categories = CATEGORIES
        if category_filter:
            wanted = {normalize_text(name).lower() for name in category_filter}
            active_categories = [
                category_config
                for category_config in CATEGORIES
                if normalize_text(category_config["product_type"]).lower() in wanted
                or normalize_text(category_config["category"]).lower() in wanted
            ]

        for category_config in active_categories:
            unique_items = {}
            pages_scraped = 0
            query_variants = category_config.get("queries") or [category_config["query"]]
            for search_query in query_variants:
                for page in range(1, max_pages + 1):
                    try:
                        page_url, text = fetch_page(session, search_query, page)
                    except Exception as exc:
                        print(f"[{category_config['product_type']}] {search_query} page {page} failed: {exc}")
                        break

                    products = parse_page(text, category_config["product_type"])
                    pages_scraped += 1

                    new_items = 0
                    for item in products:
                        source_item_id = build_source_item_id(
                            product_type=category_config["product_type"],
                            category=category_config["category"],
                            title=item.get("short_name") or item["title"],
                            brand=item.get("brand"),
                            model=item.get("model"),
                        )
                        if source_item_id not in unique_items:
                            unique_items[source_item_id] = item
                            new_items += 1

                        item["page_url"] = page_url
                        item["search_query"] = search_query

                    if len(unique_items) >= min_items:
                        break
                    if len(products) == 0:
                        break

                    time.sleep(delay)

                if len(unique_items) >= min_items:
                    break

            inserted = 0
            for item in unique_items.values():
                if upsert_component(conn, item, category_config, item.get("page_url") or ""):
                    inserted += 1

            total_rows += inserted
            per_category_stats.append(
                {
                    "product_type": category_config["product_type"],
                    "items": inserted,
                    "pages": pages_scraped,
                }
            )
            print(f"[{category_config['product_type']}] saved {inserted} items across {pages_scraped} pages.")
            conn.commit()

        removed = cleanup_stale_rows(conn, keep_days=7)
        conn.commit()

        print(f"Cleanup removed {removed} stale catalog rows older than 7 days.")
        print(f"Total items saved this run: {total_rows}")
        for stat in per_category_stats:
            print(f"- {stat['product_type']}: {stat['items']} items, {stat['pages']} pages")
    finally:
        conn.close()


def main():
    parser = argparse.ArgumentParser(description="Scrape real Newegg catalog data.")
    parser.add_argument("--max-pages", type=int, default=8, help="Maximum pages to scrape per category.")
    parser.add_argument("--min-items", type=int, default=70, help="Target minimum number of products per category.")
    parser.add_argument("--delay", type=float, default=1.0, help="Delay between page requests in seconds.")
    parser.add_argument("--keep-db", action="store_true", help="Keep the existing database schema and rows.")
    parser.add_argument(
        "--categories",
        nargs="*",
        help="Optional list of product types to scrape, for example: CPU GPU RAM.",
    )
    parser.add_argument(
        "--no-details",
        action="store_true",
        help="Compatibility flag for the existing update task.",
    )
    args = parser.parse_args()

    scrape_catalog(
        max_pages=args.max_pages,
        min_items=args.min_items,
        delay=args.delay,
        keep_db=args.keep_db,
        category_filter=args.categories,
    )


if __name__ == "__main__":
    main()
