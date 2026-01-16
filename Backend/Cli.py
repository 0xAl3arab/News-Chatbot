# -----------------------------
# Main chatbot loop
# -----------------------------
print("📰 News Chatbot with Full Article Analysis started. Type 'exit' to quit.")
print("-" * 60)

while True:
    user_question = input("\nYou: ")
    if user_question.lower() == "exit":
        print("Goodbye!")
        break

    # Classification
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
        # Full content processing pipeline
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