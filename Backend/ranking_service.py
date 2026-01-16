# ranking_service.py
# Handles article ranking using semantic and keyword matching

import numpy as np
from datetime import datetime, timezone
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from config import EMBEDDING_MODEL, TOP_ARTICLES_COUNT


class RankingService:
    def __init__(self):
        """Initialize embedding model"""
        print("Loading embedding model...")
        self.embedding_model = SentenceTransformer(EMBEDDING_MODEL)
        print("Embedding model loaded!")

    def rank_articles_hybrid(self, question, articles, top_k=TOP_ARTICLES_COUNT):
        """
        Ranks articles using hybrid relevance scoring.
        Returns top_k most relevant articles.
        """
        if not articles:
            return []

        question_embedding = self.embedding_model.encode([question])

        for article in articles:
            article['relevance_score'] = self.calculate_hybrid_relevance(
                question, article, question_embedding
            )

        ranked_articles = sorted(articles, key=lambda x: x['relevance_score'], reverse=True)
        return ranked_articles[:top_k]

    def calculate_hybrid_relevance(self, question, article, question_embedding):
        """
        Calculates relevance score combining:
        - Semantic similarity (40%)
        - Keyword matching (30%)
        - Recency (20%)
        - Title bonus (10%)
        """
        # Semantic similarity
        article_text = f"{article.get('title', '')} {article.get('description', '')}"
        article_embedding = self.embedding_model.encode([article_text])
        semantic_score = cosine_similarity(question_embedding, article_embedding)[0][0]

        # Keyword matching
        question_words = set(question.lower().split())
        stop_words = {'a', 'an', 'the', 'is', 'are', 'was', 'were', 'what', 'when', 'where', 'who', 'how', 'about'}
        question_words = question_words - stop_words
        article_words = set((article.get('title', '') + ' ' + article.get('description', '')).lower().split())
        keyword_score = len(question_words & article_words) / len(question_words) if len(question_words) > 0 else 0

        # Recency score
        try:
            pub_date_str = article.get('publishedAt', '')
            pub_date = datetime.fromisoformat(pub_date_str.replace('Z', '+00:00'))
            now = datetime.now(timezone.utc)
            hours_old = (now - pub_date).total_seconds() / 3600
            recency_score = max(0, 1 - (hours_old / 168))  # 1 week = 168 hours
        except:
            recency_score = 0.5

        # Title bonus
        title_lower = article.get('title', '').lower()
        title_bonus = 1.0 if any(word in title_lower for word in question_words) else 0.5

        # Weighted combination
        return 0.40 * semanic_score + 0.30 * keyword_score + 0.20 * recency_score + 0.10 * title_bonus