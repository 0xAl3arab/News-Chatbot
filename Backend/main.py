# main.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import re
from Chatbot import client, NEWS_API_KEY, process_news_with_full_content, rank_articles_hybrid

app = Flask(__name__)
CORS(app)


@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_question = data['question']
    print(f"📥 {user_question}")

    # Classify
    prompt = f"""Analyze: "{user_question}"
If NEWS: {{"is_news": true, "q": "keywords", "category": "general"}}
If NOT: {{"is_news": false}}"""

    try:
        llm_response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": prompt}]
        )
        classification = json.loads(re.sub(r'```json|```', '', llm_response.choices[0].message.content))
    except:
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": user_question}]
        )
        return jsonify({"response": response.choices[0].message.content, "articles": []})

    if not classification.get("is_news"):
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": user_question}]
        )
        return jsonify({"response": response.choices[0].message.content, "articles": []})

    # Search news
    params = {
        "q": classification.get("q", user_question),
        "category": classification.get("category", "general"),
        "lang": "en",
        "max": 10,
        "apikey": NEWS_API_KEY
    }

    news_response = requests.get("https://gnews.io/api/v4/search", params=params)
    articles = news_response.json().get("articles", [])

    if not articles:
        return jsonify({"response": "No articles found.", "articles": []})

    # Process
    final_answer = process_news_with_full_content(user_question, articles)
    top_articles = rank_articles_hybrid(user_question, articles, top_k=3)

    formatted_articles = [{"title": a["title"], "url": a["url"], "description": a.get("description", "")} for a in
                          top_articles]

    return jsonify({"response": final_answer, "articles": formatted_articles})


if __name__ == '__main__':
    print("🚀 http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)