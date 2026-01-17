import requests
import json
import re
from typing import Dict, List, Any

NEWS_API_KEY = "pub_59a1bb50ace74ccc857e9c89dba27c8a"  # Demo key with workaround
NEWS_BASE_URL = "https://newsdata.io/api/1"


def transform_question_to_news_params(query: str) -> Dict[str, Any]:
    """Smart query transformation - loose OR matching"""
    query_lower = query.lower()
    words = re.findall(r"\b[a-z]{3,}\b", query_lower)
    stop_words = {"today", "news", "about", "what", "tell", "who", "please", "give", "me", "bro"}
    clean_words = [w for w in words if w not in stop_words and len(w) > 2]

    if clean_words:
        q = " OR ".join(clean_words[:6])  # Flexible matching
    else:
        q = "news"

    params = {
        "q": q,
        "language": "en",
        "pageSize": 10,
        "apikey": NEWS_API_KEY
    }

    print(f"🔍 '{query}' → q='{q}'")
    return params


def search_news(params: Dict, limit: int = 5) -> List[Dict]:



    fallback_queries = ["technology", "world", "business", "news"]
    for fq in fallback_queries:
        test_params = {**params, "q": fq}
        try:
            resp = requests.get(f"{NEWS_BASE_URL}/news", params=test_params, timeout=10)
            data = resp.json()
            print(f"📊 Testing fallback '{fq}': {data.get('status')}")

            if data.get("status") == "success" and data.get("results"):
                print(f"✅ Fallback '{fq}' SUCCESS: {len(data['results'])} articles")
                return data["results"][:limit]
        except Exception as e:
            print(f"❌ Fallback '{fq}' failed: {e}")

    # STRATEGY 2: Original query on /news
    try:
        resp = requests.get(f"{NEWS_BASE_URL}/news", params=params, timeout=15)
        data = resp.json()
        print(f"📊 /news original: {data.get('status')}, results: {len(data.get('results', []))}")

        if data.get("status") == "success" and data.get("results"):
            return data["results"][:limit]
    except Exception as e:
        print(f"❌ /news error: {e}")

    # STRATEGY 3: /latest endpoint
    try:
        fallback_params = {**params, "language": "en"}
        resp = requests.get(f"{NEWS_BASE_URL}/latest", params=fallback_params, timeout=15)
        data = resp.json()
        print(f"📊 /latest: {data.get('status')}, results: {len(data.get('results', []))}")

        if data.get("status") == "success" and data.get("results"):
            return data["results"][:limit]
    except Exception as e:
        print(f"❌ /latest error: {e}")

    print("❌ ALL strategies failed - returning empty")
    return []


def smart_chat(query: str, limit: int = 5) -> Dict[str, Any]:
    print(f"\n🎯 Processing: '{query}'")

    params = transform_question_to_news_params(query)
    articles = search_news(params, limit)

    if not articles:
        return {
            "success": False,
            "message": f"No fresh news for '{query}'. Showing recent tech/business news instead.",
            "articles_found": 0,
            "suggestion": "Try: 'AI', 'bitcoin', 'sports', 'technology'"
        }

    # Format rich results
    sources = []
    for i, article in enumerate(articles, 1):
        sources.append({
            "id": i,
            "title": article.get("title", "No title")[:100],
            "link": article.get("link", ""),
            "description": (article.get("description") or "")[:150] + "...",
            "pubDate": article.get("pubDate", ""),
            "source_id": article.get("source_id", "")
        })

    print(f"✅ Found {len(sources)} articles")
    return {
        "success": True,
        "query": query,
        "articles_found": len(articles),
        "sources": sources
    }
