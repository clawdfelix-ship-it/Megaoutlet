#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import json, re, time
import os
from pathlib import Path

DEFAULT_DATA_FILE = Path(__file__).resolve().parents[1] / "data" / "megaoutlet_all_products.json"
INPUT_FILE = Path(os.getenv("SCRAPE_INPUT_PATH") or DEFAULT_DATA_FILE)
OUTPUT_FILE = Path(os.getenv("SCRAPE_OUTPUT_PATH") or INPUT_FILE)


def parse_detail(text: str):
    r = {"price": "", "origin": "", "sold_count": "", "expiry": "", "packing_spec": "", "shipping": "", "detail_text": text}
    if m := re.search(r"\$\s*([0-9,]+\.?\d*)", text):
        r["price"] = "$" + m.group(1)
    if m := re.search(r"產地\s*[\|\t]*\s*(\S+)", text):
        r["origin"] = m.group(1)
    if m := re.search(r"已售出\s*([0-9,]+)", text):
        r["sold_count"] = m.group(1)
    if m := re.search(r"嘗味期限\s*([0-9年日月]+)", text):
        r["expiry"] = m.group(1)
    if m := re.search(r"包裝規格\s*[\|\t]*\s*(\S+)", text):
        r["packing_spec"] = m.group(1)
    if "2日送達" in text:
        r["shipping"] = "2日送達"
    elif "5日送達" in text:
        r["shipping"] = "5日送達"
    return r


def main():
    if not INPUT_FILE.exists():
        raise SystemExit(f"Missing data file: {INPUT_FILE}")

    raw = json.loads(INPUT_FILE.read_text(encoding="utf-8"))
    products = raw if isinstance(raw, list) else raw.get("products", [])
    if not isinstance(products, list) or len(products) == 0:
        raise SystemExit("No products found in data file")

    skus = []
    seen = set()
    for p in products:
        sku = str(p.get("sku") or "").strip()
        if sku and sku not in seen:
            seen.add(sku)
            skus.append(sku)

    out_by_sku = {}
    limit_env = os.getenv("SCRAPE_LIMIT", "").strip()
    limit = int(limit_env) if limit_env.isdigit() else 0
    if limit > 0:
        skus = skus[:limit]

    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        context.set_default_timeout(15000)

        def should_replace(existing: dict, incoming: dict):
            try:
                ex_imgs = existing.get("images") or []
                in_imgs = incoming.get("images") or []
                ex_len = len(ex_imgs) if isinstance(ex_imgs, list) else 0
                in_len = len(in_imgs) if isinstance(in_imgs, list) else 0
                if in_len != ex_len:
                    return in_len > ex_len
                return len((incoming.get("name") or "").strip()) >= len((existing.get("name") or "").strip())
            except Exception:
                return True

        for i, sku in enumerate(skus, start=1):
            url = f"https://www.hktvmall.com/hktv/zh/main/MEGA-OUTLET/s/H9456001/p/{sku}"
            page = context.new_page()
            try:
                page.goto(url, timeout=30000, wait_until="load")
                page.wait_for_selector(".product-title-name", timeout=15000)
                page.wait_for_selector('meta[property="og:image"]', timeout=15000)
                page.wait_for_timeout(400)
                final_url = page.url
                final_sku = final_url.rsplit("/p/", 1)[-1].strip() if "/p/" in final_url else sku
                page.wait_for_function(
                    """(s) => {
                      const u = document.querySelector('meta[property="og:url"]')?.getAttribute('content') || '';
                      return u.includes(s);
                    }""",
                    final_sku,
                    timeout=10000,
                )
                d = page.evaluate(
                    """
                    () => ({
                        name: document.querySelector('.product-title-name')?.innerText.trim() || '',
                        price: document.querySelector('.product-price')?.innerText.trim() || '',
                        desc: document.querySelector('.product-description')?.innerText.trim() || '',
                        detail: document.querySelector('.product-detail')?.innerText.trim() || '',
                        ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '',
                        images: Array.from(document.querySelectorAll('.product-image img'))
                            .map(img => img.currentSrc || img.src || img.getAttribute('data-src'))
                            .filter(s => s && s.startsWith('http'))
                    })
                    """
                )
                p2 = parse_detail(d.get("detail") or "")
                imgs = d.get("images") or []
                if isinstance(imgs, list):
                    s = []
                    seen_img = set()
                    og = (d.get("ogImage") or "").strip()
                    if og and og.startswith("http"):
                        s.append(og)
                        seen_img.add(og)
                    for u in imgs:
                        if not isinstance(u, str):
                            continue
                        u = u.strip()
                        if not u or u in seen_img:
                            continue
                        seen_img.add(u)
                        s.append(u)
                    imgs = sorted(
                        s,
                        key=lambda u: (
                            0 if "_1200" in u or u.endswith("1200.jpg") or u.endswith("1200.png") else 1,
                            u,
                        ),
                    )
                else:
                    imgs = []

                prod = {
                    "sku": final_sku,
                    "name": d.get("name") or "",
                    "price": p2["price"] or (d.get("price") or ""),
                    "origin": p2["origin"],
                    "sold_count": p2["sold_count"],
                    "expiry": p2["expiry"],
                    "packing_spec": p2["packing_spec"],
                    "shipping": p2["shipping"],
                    "short_desc": d.get("desc") or "",
                    "detail": d.get("detail") or "",
                    "images": imgs,
                    "url": final_url,
                }
                existing = out_by_sku.get(final_sku)
                if existing is None or should_replace(existing, prod):
                    out_by_sku[final_sku] = prod
                print(f"{i}/{len(skus)} {final_sku} images={len(imgs)}")
                if i % 10 == 0:
                    out_list = sorted(out_by_sku.values(), key=lambda x: x.get("sku") or "")
                    OUTPUT_FILE.write_text(json.dumps(out_list, ensure_ascii=False, indent=2), encoding="utf-8")
                time.sleep(0.3)
            except Exception:
                continue
            finally:
                try:
                    page.close()
                except Exception:
                    pass
        browser.close()

    out_list = sorted(out_by_sku.values(), key=lambda x: x.get("sku") or "")
    OUTPUT_FILE.write_text(json.dumps(out_list, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
