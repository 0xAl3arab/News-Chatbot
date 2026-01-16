# main.py
# Flask API for the chatbot

import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from llm_service import LLMService
from news_service import search_news
from article_processor import fetch_full_article_content
from ranking_service import RankingService
from query_handler import route_query
from config import RATE_LIMIT_DELAY

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Allow cross-origin requests

# Initialize services (load once when server starts)
print("🚀 Initializing services...")
llm_service = LLMService()
ranking_service = RankingService()
print("✅ Services ready!")


def process_news_with_full_content(question, articles):
    """
    Main function: Rank → Fetch full content → LLM summary → Direct response
    """
    if not articles:
        return "No relevant articles found."

    # Step 1: Rank top articles
    print("🤖 Ranking articles by relevance...")
    top_articles = ranking_service.rank_articles_hybrid(question, articles)

    # Step 2: Process each top article with full content
    summaries = []
    for i, article in enumerate(top_articles, 1):
        print(f"📖 Processing article {i}/{len(top_articles)}...")

        # Fetch full content
        full_content = fetch_full_article_content(article['url'])

        # Get summary from LLM
        summary = llm_service.get_article_summary(question, article, full_content)

        summaries.append({
            'title': article['title'],
            'url': article['url'],
            'summary': summary,
            'relevance': article['relevance_score']
        })

        time.sleep(RATE_LIMIT_DELAY)  # Rate limiting

    # Step 3: Generate final response
    final_answer = llm_service.generate_final_response(question, summaries)
    return final_answer, top_articles


@app.route('/chat', methods=['POST'])
def chat():
    """
    Main chat endpoint
    Expects JSON: { "question": "your question here" }
    Returns JSON: { "response": "bot response", "method": "pattern" or "llm" }
    """
    try:
        # Get question from request
        data = request.json

        if not data or 'question' not in data:
            return jsonify({
                'error': 'Missing question in request body',
                'example': {'question': 'latest tech news'}
            }), 400

        user_question = data['question']
        print(f"\n📥 Received: {user_question}")

        # Route query using hybrid method
        params, method = route_query(user_question, llm_service)

        # If not a news query
        if params is None:
            response = llm_service.generate_general_response(user_question)
            return jsonify({
                'response': response,
                'method': method,
                'is_news': False
            })

        # Search for news
        articles = search_news(params)

        if articles:
            final_answer, used_articles = process_news_with_full_content(user_question, articles)
            return jsonify({
                'response': final_answer,
                'method': method,
                'is_news': True,
                'articles_found': len(articles),
                'articles': used_articles
            })
        else:
            return jsonify({
                'response': 'No articles found for your query.',
                'method': method,
                'is_news': True,
                'articles_found': 0,
                'articles': []
            })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({
            'error': str(e)
        }), 500


@app.route('/health', methods=['GET'])
def health():
    """
    Health check endpoint
    """
    return jsonify({
        'status': 'healthy',
        'message': 'News Chatbot API is running',
        'services': {
            'llm': 'ready',
            'ranking': 'ready',
            'news_api': 'ready'
        }
    })


@app.route('/', methods=['GET'])
def home():
    """
    Home endpoint with API documentation
    """
    return jsonify({
        'message': 'Welcome to News Chatbot API',
        'endpoints': {
            '/chat': {
                'method': 'POST',
                'description': 'Send a question to the chatbot',
                'body': {
                    'question': 'your question here'
                },
                'example': {
                    'question': 'latest tech news'
                }
            },
            '/health': {
                'method': 'GET',
                'description': 'Check API health status'
            }
        },
        'usage': {
            'pattern_matching': 'Simple queries like "bitcoin news", "tech news today"',
            'llm_classification': 'Complex queries like "What\'s the difference between...?"'
        }
    })


if __name__ == '__main__':
    print("📰 News Chatbot API Starting...")
    print("-" * 60)
    print("🌐 Server running on http://localhost:5000")
    print("📍 Endpoints:")
    print("   - POST /chat       - Send questions")
    print("   - GET  /health     - Health check")
    print("   - GET  /           - API documentation")
    print("-" * 60)
    app.run(debug=True, host='0.0.0.0', port=5000)
