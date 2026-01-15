import requests
import json
import re
from openai import OpenAI
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from datetime import datetime, timezone
from bs4 import BeautifulSoup
import time

# -----------------------------
# Initialize models
# -----------------------------
client = OpenAI(
    api_key="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",
    base_url="https://api.groq.com/openai/v1"
)

embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
NEWS_API_KEY = "2b178fbeb8d9800fa93076f11777b04a"


# -----------------------------
# NEW: Function to fetch full article content
# -----------------------------
def fetch_full_article_content(url, max_length=4000):
    """
    Fetches and cleans full article content from URL.
    Returns cleaned text content.
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')

        # Remove script, style, nav, footer elements
        for element in soup(['script', 'style', 'nav', 'footer', 'header']):
            element.decompose()

        # Get text and clean
        text = soup.get_text()
        # Clean whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split('  '))
        text = ' '.join(chunk for chunk in chunks if chunk)

        # Truncate to max_length to avoid token limits
        return text[:max_length]

    except Exception as e:
        print(f"Error fetching article: {e}")
        return None


# -----------------------------
# NEW: Function to get LLM summary from full article
# -----------------------------
def get_article_summary(question, article):
    """
    Sends full article content + question to LLM for direct answer.
    """
    full_content = fetch_full_article_content(article['url'])

    if not full_content:
        return f"No full content available for: {article['title']}"

    prompt = f"""You are a helpful news assistant. Answer the user's question: "{question}"

Use ONLY the following article content to provide a direct, concise answer:

TITLE: {article.get('title', '')}
DESCRIPTION: {article.get('description', '')}
FULL CONTENT: {full_content}

Provide a clear, direct answer to the question based solely on this article. 
Keep it concise (2-4 sentences). If the article doesn't contain the answer, say so clearly."""

    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
            temperature=0.1
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Error processing article: {str(e)}"


# -----------------------------
# MODIFIED: Enhanced ranking function
# -----------------------------
def rank_articles_hybrid(question, articles, top_k=3):  # Reduced to top 3 for faster processing
    """
    Ranks articles using hybrid relevance scoring.
    Now returns top_k most relevant for LLM summarization.
    """
    if not articles:
        return []

    question_embedding = embedding_model.encode([question])

    for article in articles:
        article['relevance_score'] = calculate_hybrid_relevance(
            question, article, question_embedding
        )

    ranked_articles = sorted(articles, key=lambda x: x['relevance_score'], reverse=True)
    return ranked_articles[:top_k]


# -----------------------------
# Keep original hybrid relevance function (unchanged)
# -----------------------------
def calculate_hybrid_relevance(question, article, question_embedding):
    article_text = f"{article.get('title', '')} {article.get('description', '')}"
    article_embedding = embedding_model.encode([article_text])
    semantic_score = cosine_similarity(question_embedding, article_embedding)[0][0]

    question_words = set(question.lower().split())
    stop_words = {'a', 'an', 'the', 'is', 'are', 'was', 'were', 'what', 'when', 'where', 'who', 'how', 'about'}
    question_words = question_words - stop_words
    article_words = set((article.get('title', '') + ' ' + article.get('description', '')).lower().split())
    keyword_score = len(question_words & article_words) / len(question_words) if len(question_words) > 0 else 0

    try:
        pub_date_str = article.get('publishedAt', '')
        pub_date = datetime.fromisoformat(pub_date_str.replace('Z', '+00:00'))
        now = datetime.now(timezone.utc)
        hours_old = (now - pub_date).total_seconds() / 3600
        recency_score = max(0, 1 - (hours_old / 168))
    except:
        recency_score = 0.5

    title_lower = article.get('title', '').lower()
    title_bonus = 1.0 if any(word in title_lower for word in question_words) else 0.5

    return 0.40 * semantic_score + 0.30 * keyword_score + 0.20 * recency_score + 0.10 * title_bonus


# -----------------------------
# NEW: Main news processing with full content LLM responses
# -----------------------------
def process_news_with_full_content(question, articles):
    """
    Main function: Rank → Fetch full content → LLM summary → Direct response
    """
    if not articles:
        return "No relevant articles found."

    # Step 1: Rank top articles
    print("🤖 Ranking articles by relevance...")
    top_articles = rank_articles_hybrid(question, articles, top_k=3)

    # Step 2: Process each top article with full content
    summaries = []
    for i, article in enumerate(top_articles, 1):
        print(f"📖 Processing article {i}/{len(top_articles)}...")
        summary = get_article_summary(question, article)
        summaries.append({
            'title': article['title'],
            'url': article['url'],
            'summary': summary,
            'relevance': article['relevance_score']
        })
        time.sleep(0.5)  # Rate limiting

    # Step 3: Create final LLM response combining all summaries
    combined_prompt = f"""User question: "{question}"

Here are the top relevant articles with their full content analysis:

"""
    for i, summary_data in enumerate(summaries, 1):
        combined_prompt += f"""
ARTICLE {i}: {summary_data['title']}
URL: {summary_data['url']}
SUMMARY: {summary_data['summary']}
"""

    combined_prompt += """
Using ONLY this information, provide a single, comprehensive, direct answer to the user's question.
Be concise, factual, and cite which article(s) your answer comes from (e.g., "According to Article 1...").
Format naturally for the user."""

    try:
        final_response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": combined_prompt}],
            max_tokens=500,
            temperature=0.2
        )
        return final_response.choices[0].message.content.strip()
    except Exception as e:
        return f"Error generating final response: {str(e)}"


# -----------------------------
# MODIFIED: Main chatbot loop
# -----------------------------
print("📰 News Chatbot with Full Article Analysis started. Type 'exit' to quit.")
print("-" * 60)

while True:
    user_question = input("\nYou: ")
    if user_question.lower() == "exit":
        print("Goodbye!")
        break

    # Classification (unchanged)
    prompt = f"""You are a news classification assistant. Analyze this question: "{user_question}"

If this is a NEWS question, respond with ONLY:
{{
    "is_news": true,
    "q": "search keywords here",
    "category": "general",
    "lang": "en",
    "max": 10,
    "apikey": "{NEWS_API_KEY}"
}}

Categories: general, world, nation, business, technology, entertainment, sports, science, health

If NOT news, respond with ONLY:
{{"is_news": false}}

Output ONLY JSON."""

    try:
        llm_response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": prompt}]
        )
        output = re.sub(r'```json\s*|\s*```', '', llm_response.choices[0].message.content.strip())
        classification = json.loads(output)

    except:
        print("Bot: Processing directly...")
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": user_question}]
        )
        print("Bot:", response.choices[0].message.content)
        continue

    if not classification.get("is_news", False):
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": user_question}]
        )
        print("Bot:", response.choices[0].message.content)
    else:
        # NEW: Full content processing pipeline
        params = {
            "q": classification.get("q", user_question),
            "category": classification.get("category", "general"),
            "lang": classification.get("lang", "en"),
            "max": classification.get("max", 10),
            "apikey": NEWS_API_KEY
        }

        print(f"\n🔍 Searching news about '{params['q']}'...")

        try:
            url = "https://gnews.io/api/v4/search"
            news_response = requests.get(url, params=params, timeout=10)
            data = news_response.json()

            if "articles" in data and len(data["articles"]) > 0:
                final_answer = process_news_with_full_content(user_question, data["articles"])
                print(f"\n🤖 Bot: {final_answer}")
            else:
                print("Bot: No articles found.")

        except Exception as e:
            print(f"Bot: Error: {e}")
