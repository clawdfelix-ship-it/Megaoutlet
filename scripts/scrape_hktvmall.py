#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import json, re, time
import os
from pathlib import Path

DEFAULT_DATA_FILE = Path(__file__).resolve().parents[1] / "data" / "megaoutlet_all_products.json"
INPUT_FILE = Path(os.getenv("SCRAPE_INPUT_PATH") or DEFAULT_DATA_FILE)
OUTPUT_FILE = Path(os.getenv("SCRAPE_OUTPUT_PATH") or INPUT_FILE)
STORE_URL = os.getenv("SCRAPE_STORE_URL") or "https://www.hktvmall.com/hktv/zh/main/MEGA-OUTLET/s/H9456001"
REVIEWS_PAGE_SIZE = 10
REVIEWS_PAGES = int(os.getenv("SCRAPE_REVIEWS_PAGES") or "1")


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


def discover_skus(page):
    page.goto(STORE_URL, timeout=60000, wait_until="domcontentloaded")
    try:
        page.wait_for_selector('a[href*="/p/"]', timeout=15000)
    except Exception:
        pass
    page.wait_for_timeout(800)

    try:
        html = page.content()
        m = set(re.findall(r"/p/(H9456001_S_[A-Za-z0-9_]+)", html))
        if len(m) > 0:
            return sorted(m)
    except Exception:
        pass

    skus = set()
    prev_count = 0
    stable = 0

    for _ in range(40):
        hrefs = page.evaluate(
            """
            () => Array.from(document.querySelectorAll('a[href*="/p/"]'))
              .map(a => a.href || a.getAttribute('href') || '')
              .filter(Boolean)
            """
        )
        if isinstance(hrefs, list):
            for h in hrefs:
                if not isinstance(h, str):
                    continue
                if "/s/H9456001/p/" not in h:
                    continue
                sku = h.split("/p/", 1)[-1]
                sku = sku.split("?", 1)[0].split("#", 1)[0].strip()
                if sku:
                    skus.add(sku)

        if prev_count > 0 and len(skus) == prev_count:
            stable += 1
        else:
            stable = 0
            prev_count = len(skus)

        if stable >= 3 and prev_count > 0:
            break

        page.mouse.wheel(0, 2400)
        page.wait_for_timeout(800)

    return sorted(skus)


def safe_response_json(resp):
    try:
        return resp.json()
    except Exception:
        try:
            return json.loads(resp.text())
        except Exception:
            return None


def normalize_reviews(pages):
    if not isinstance(pages, list):
        return []
    items = []
    for payload in pages:
        if isinstance(payload, list):
            items.extend(payload)
            continue
        if not isinstance(payload, dict):
            continue
        v = payload.get("reviews") or payload.get("data") or payload.get("items") or payload.get("results")
        if isinstance(v, list):
            items.extend(v)
    out = []
    for it in items:
        if not isinstance(it, dict):
            continue
        rating = it.get("rating") or it.get("stars") or it.get("rating_value")
        try:
            rating = int(rating) if rating is not None else None
        except Exception:
            rating = None
        comment = it.get("comment") or it.get("content") or it.get("text") or it.get("review")
        title = it.get("title") or it.get("subject") or ""
        created_at = it.get("created_at") or it.get("createdAt") or it.get("date") or it.get("created")
        user = it.get("user") or it.get("username") or it.get("reviewer") or it.get("customer_name")
        images = it.get("images") or it.get("image_urls") or []
        if isinstance(images, str):
            images = [images]
        if not isinstance(images, list):
            images = []
        out.append(
            {
                "rating": rating,
                "title": str(title).strip(),
                "comment": str(comment).strip() if comment is not None else "",
                "created_at": str(created_at).strip() if created_at is not None else "",
                "user": str(user).strip() if user is not None else "",
                "images": [str(x).strip() for x in images if isinstance(x, str) and x.strip().startswith("http")],
            }
        )
    return out


def main():
    skus = []
    seen = set()
    only_sku = os.getenv("SCRAPE_ONLY_SKU", "").strip()
    if INPUT_FILE.exists():
        raw = json.loads(INPUT_FILE.read_text(encoding="utf-8"))
        products = raw if isinstance(raw, list) else raw.get("products", [])
        if isinstance(products, list):
            for p in products:
                sku = str(p.get("sku") or "").strip()
                if sku and sku not in seen:
                    seen.add(sku)
                    skus.append(sku)

    out_by_sku = {}
    limit_env = os.getenv("SCRAPE_LIMIT", "").strip()
    limit = int(limit_env) if limit_env.isdigit() else 0

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

        if len(skus) == 0:
            seed_page = context.new_page()
            try:
                skus = discover_skus(seed_page)
                if limit > 0:
                    skus = skus[:limit]
                print(f"discovered skus={len(skus)}")
            finally:
                try:
                    seed_page.close()
                except Exception:
                    pass
        else:
            if limit > 0:
                skus = skus[:limit]

        if only_sku:
            skus = [only_sku]

        for i, sku in enumerate(skus, start=1):
            url = f"https://www.hktvmall.com/hktv/zh/main/MEGA-OUTLET/s/H9456001/p/{sku}"
            page = context.new_page()
            review_capture = {"stat": None, "pages": []}
            auth_capture = {"token": ""}

            def on_request(req):
                try:
                    tok = req.headers.get("authorization") or ""
                    if isinstance(tok, str) and tok.startswith("Bearer "):
                        auth_capture["token"] = tok
                except Exception:
                    return

            def on_response(resp):
                try:
                    u = resp.url
                    if "ucapi.comms.hktvmall.com" not in u or "/hktvmall/products/" not in u:
                        return
                    if "/reviews/stat" in u:
                        j = safe_response_json(resp)
                        if isinstance(j, (dict, list)):
                            review_capture["stat"] = j
                        return
                    if "/reviews/" in u and "/reviews/stat" not in u:
                        j = safe_response_json(resp)
                        if isinstance(j, (dict, list)):
                            review_capture["pages"].append(j)
                except Exception:
                    return

            page.on("request", on_request)
            page.on("response", on_response)
            try:
                page.goto(url, timeout=30000, wait_until="load")
                page.wait_for_selector('meta[property="og:title"]', timeout=15000, state="attached")
                page.wait_for_selector('meta[property="og:image"]', timeout=15000, state="attached")
                page.wait_for_timeout(800)
                final_url = page.url
                final_sku = final_url.rsplit("/p/", 1)[-1].strip() if "/p/" in final_url else sku
                pid = None
                if m := re.match(r"^H9456001_S_(\d+)$", final_sku):
                    pid = "H9456001" + m.group(1)
                if len(review_capture["pages"]) < max(1, REVIEWS_PAGES):
                    try:
                        page.locator("text=詳細介紹").first.scroll_into_view_if_needed(timeout=2000)
                        page.wait_for_timeout(400)
                        page.locator("text=評論").first.click(timeout=2000)
                        page.wait_for_timeout(1200)
                    except Exception:
                        pass
                review_dom = {}
                try:
                    review_dom = page.evaluate(
                        """
                        () => {
                          const el = document.querySelector('#reviews') || document.querySelector('.reviews');
                          const no = document.querySelector('.noReviews');
                          const txt = (el?.innerText || el?.textContent || '').trim();
                          const noTxt = (no?.innerText || no?.textContent || '').trim();
                          return { text: txt, no_text: noTxt };
                        }
                        """
                    )
                except Exception:
                    review_dom = {}
                if pid and (review_capture["stat"] is None or len(review_capture["pages"]) < max(1, REVIEWS_PAGES)):
                    tok = auth_capture.get("token") or ""
                    try:
                        stat_url = (
                            f"https://ucapi.comms.hktvmall.com/hktvmall/products/{pid}/reviews/stat"
                            f"?count_has_images=true&count_has_replies=true&count_by_ratings=true"
                        )
                        res = page.evaluate(
                            """
                            async ({ url, token }) => {
                              try {
                                const headers = { accept: 'application/json, text/plain, */*' };
                                if (token) headers.authorization = token;
                                const r = await fetch(url, { headers, credentials: 'include' });
                                return { status: r.status, text: await r.text() };
                              } catch (e) {
                                return { status: 0, text: '' };
                              }
                            }
                            """,
                            {"url": stat_url, "token": tok},
                        )
                        if isinstance(res, dict) and res.get("status") == 200 and isinstance(res.get("text"), str):
                            try:
                                review_capture["stat"] = json.loads(res["text"])
                            except Exception:
                                pass
                    except Exception:
                        pass
                    try:
                        for page_idx in range(max(1, REVIEWS_PAGES)):
                            if len(review_capture["pages"]) >= max(1, REVIEWS_PAGES):
                                break
                            list_url = (
                                f"https://ucapi.comms.hktvmall.com/hktvmall/products/{pid}/reviews/"
                                f"?lang=zh&current_page={page_idx}&has_image=false&has_reply=false"
                                f"&page_size={REVIEWS_PAGE_SIZE}"
                            )
                            res = page.evaluate(
                                """
                                async ({ url, token }) => {
                                  try {
                                    const headers = { accept: 'application/json, text/plain, */*' };
                                    if (token) headers.authorization = token;
                                    const r = await fetch(url, { headers, credentials: 'include' });
                                    return { status: r.status, text: await r.text() };
                                  } catch (e) {
                                    return { status: 0, text: '' };
                                  }
                                }
                                """,
                                {"url": list_url, "token": tok},
                            )
                            if isinstance(res, dict) and res.get("status") == 200 and isinstance(res.get("text"), str):
                                try:
                                    review_capture["pages"].append(json.loads(res["text"]))
                                except Exception:
                                    pass
                    except Exception:
                        pass
                d = page.evaluate(
                    """
                    () => ({
                        ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '',
                        name: document.querySelector('.product-title-name')?.innerText.trim()
                          || document.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim()
                          || '',
                        price: document.querySelector('.product-price')?.innerText.trim() || '',
                        desc: document.querySelector('.product-description')?.innerText.trim()
                          || document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim()
                          || '',
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

                reviews = normalize_reviews(review_capture.get("pages"))
                if len(reviews) > REVIEWS_PAGE_SIZE * max(1, REVIEWS_PAGES):
                    reviews = reviews[: (REVIEWS_PAGE_SIZE * max(1, REVIEWS_PAGES))]

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
                    "review_stats": review_capture.get("stat"),
                    "reviews": reviews,
                    "review_dom_text": (review_dom.get("text") or "") if isinstance(review_dom, dict) else "",
                    "review_no_text": (review_dom.get("no_text") or "") if isinstance(review_dom, dict) else "",
                }
                existing = out_by_sku.get(final_sku)
                if existing is None or should_replace(existing, prod):
                    out_by_sku[final_sku] = prod
                print(f"{i}/{len(skus)} {final_sku} images={len(imgs)}")
                if i % 10 == 0:
                    out_list = sorted(out_by_sku.values(), key=lambda x: x.get("sku") or "")
                    OUTPUT_FILE.write_text(json.dumps(out_list, ensure_ascii=False, indent=2), encoding="utf-8")
                time.sleep(0.3)
            except Exception as e:
                try:
                    print(f"skip {sku}: {type(e).__name__}: {e}")
                except Exception:
                    pass
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
