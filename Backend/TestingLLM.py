import requests
import json
import re
from openai import OpenAI
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from datetime import datetime, timezone

# -----------------------------
# Initialize models
# -----------------------------
client = OpenAI(
    api_key="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",
    base_url="https://api.groq.com/openai/v1"
)

# Load embedding model (downloads ~90MB on first run)
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

NEWS_API_KEY = "2b178fbeb8d9800fa93076f11777b04a"


# -----------------------------
# Function to calculate hybrid relevance
# -----------------------------
def calculate_hybrid_relevance(question, article, question_embedding):
    """
    Combines multiple relevance signals with weights:
    - Semantic similarity (40%)
    - Keyword overlap (30%)
    - Recency (20%)
    - Title match bonus (10%)
    """
    # 1. Semantic similarity (40%)
    article_text = f"{article.get('title', '')} {article.get('description', '')}"
    article_embedding = embedding_model.encode([article_text])
    semantic_score = cosine_similarity(question_embedding, article_embedding)[0][0]

    # 2. Keyword overlap (30%)
    question_words = set(question.lower().split())
    # Remove common stop words for better matching
    stop_words = {'a', 'an', 'the', 'is', 'are', 'was', 'were', 'what', 'when', 'where', 'who', 'how', 'about'}
    question_words = question_words - stop_words

    article_words = set((article.get('title', '') + ' ' +
                         article.get('description', '')).lower().split())

    if len(question_words) > 0:
        keyword_score = len(question_words & article_words) / len(question_words)
    else:
        keyword_score = 0

    # 3. Recency (20%) - newer articles get higher scores
    try:
        pub_date_str = article.get('publishedAt', '')
        pub_date = datetime.fromisoformat(pub_date_str.replace('Z', '+00:00'))
        now = datetime.now(timezone.utc)
        hours_old = (now - pub_date).total_seconds() / 3600
        # Decay over 1 week (168 hours)
        recency_score = max(0, 1 - (hours_old / 168))
    except:
        recency_score = 0.5  # Default if date parsing fails

    # 4. Title match bonus (10%)
    title_lower = article.get('title', '').lower()
    title_bonus = 1.0 if any(word in title_lower for word in question_words) else 0.5

    # Weighted combination
    final_score = (
            0.40 * semantic_score +
            0.30 * keyword_score +
            0.20 * recency_score +
            0.10 * title_bonus
    )

    return final_score


# -----------------------------
# Function to rank articles with hybrid approach
# -----------------------------
def rank_articles_hybrid(question, articles, top_k=5):
    """
    Ranks articles using hybrid relevance scoring.
    Returns top_k most relevant articles.
    """
    if not articles:
        return []

    # Get embedding for the question (computed once)
    question_embedding = embedding_model.encode([question])

    # Calculate hybrid relevance for each article
    for article in articles:
        article['relevance_score'] = calculate_hybrid_relevance(
            question, article, question_embedding
        )

        # Also add individual score components for debugging (optional)
        article_text = f"{article.get('title', '')} {article.get('description', '')}"
        article_embedding = embedding_model.encode([article_text])
        article['semantic_score'] = float(cosine_similarity(question_embedding, article_embedding)[0][0])

    # Sort by hybrid relevance score
    ranked_articles = sorted(articles, key=lambda x: x['relevance_score'], reverse=True)

    return ranked_articles[:top_k]


# -----------------------------
# Chatbot loop
# -----------------------------
print("News Chatbot with Hybrid Ranking started. Type 'exit' to quit.")
print("-" * 50)

while True:
    user_question = input("\nYou: ")
    if user_question.lower() == "exit":
        print("Goodbye!")
        break

    # -----------------------------
    # Ask LLM to classify & generate params
    # -----------------------------
    prompt = f"""You are a news classification assistant. Analyze this question: "{user_question}"

If this is a NEWS question (about current events, recent happenings, today's info, etc.), respond with ONLY a valid JSON object in this exact format:
{{
    "is_news": true,
    "q": "search keywords here",
    "category": "general",
    "lang": "en",
    "max": 10,
    "apikey": "{NEWS_API_KEY}"
}}

Categories: general, world, nation, business, technology, entertainment, sports, science, health

If this is NOT a news question, respond with ONLY:
{{"is_news": false}}

Output ONLY the JSON object, nothing else."""

    try:
        llm_response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": prompt}]
        )

        output = llm_response.choices[0].message.content.strip()
        output = re.sub(r'```json\s*|\s*```', '', output)
        output = output.strip()
        classification = json.loads(output)

    except json.JSONDecodeError as e:
        print(f"Bot: Sorry, I couldn't process that. Let me try to answer directly.")
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": user_question}]
        )
        print("Bot:", response.choices[0].message.content)
        continue
    except Exception as e:
        print(f"Bot: An error occurred: {e}")
        continue

    # -----------------------------
    # Check if it's news
    # -----------------------------
    if not classification.get("is_news", False):
        try:
            response = client.chat.completions.create(
                model="openai/gpt-oss-120b",
                messages=[{"role": "user", "content": user_question}]
            )
            print("Bot:", response.choices[0].message.content)
        except Exception as e:
            print(f"Bot: Error getting response: {e}")
    else:
        # -----------------------------
        # Prepare params for news API
        # -----------------------------
        params = {
            "q": classification.get("q", user_question),
            "category": classification.get("category", "general"),
            "lang": classification.get("lang", "en"),
            "max": classification.get("max", 10),
            "apikey": NEWS_API_KEY
        }

        print(f"\nBot: Searching for news about '{params['q']}'...\n")

        # -----------------------------
        # Call GNews API
        # -----------------------------
        try:
            url = "https://gnews.io/api/v4/search"
            news_response = requests.get(url, params=params, timeout=10)
            data = news_response.json()

            # -----------------------------
            # Rank and display articles with hybrid scoring
            # -----------------------------
            if "articles" in data and len(data["articles"]) > 0:
                # Rank articles using hybrid approach
                ranked_articles = rank_articles_hybrid(
                    user_question,
                    data["articles"],
                    top_k=5
                )

                print(f"Top {len(ranked_articles)} most relevant articles:\n")
                for i, article in enumerate(ranked_articles, 1):
                    relevance_percentage = article['relevance_score'] * 100
                    print(f"{i}. 📰 {article.get('title', 'N/A')}")
                    print(f"   🎯 Relevance: {relevance_percentage:.1f}%")
                    print(f"   📝 {article.get('description', 'N/A')}")
                    print(f"   🔗 {article.get('url', 'N/A')}")
                    print(f"   📅 {article.get('publishedAt', 'N/A')}")
                    # Optional: show semantic score for comparison
                    # print(f"   🔍 Semantic: {article.get('semantic_score', 0)*100:.1f}%")
                    print("-" * 70)
            else:
                error_msg = data.get('errors', ['No articles found'])
                print(f"Bot: No articles found. {error_msg}")

        except requests.exceptions.RequestException as e:
            print(f"Bot: Error fetching news: {e}")
        except Exception as e:
            print(f"Bot: An error occurred: {e}")