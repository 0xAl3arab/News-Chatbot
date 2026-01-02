import requests


NEWS_API_KEY = "2b178fbeb8d9800fa93076f11777b04a"


url = "https://gnews.io/api/v4/top-headlines"

category = input("Write the category : ")
query = input("Write the query : ")
params = {
    "q" : query,
    "category": category,   # categories: general, world, nation, business, technology, entertainment, sports, science, health
    "lang": "en",             # language code (2 letters)
    "country": "us",          # country code (2 letters)
    "max": 10,                # number of articles to fetch (1-10 for free plan)
    "apikey": NEWS_API_KEY    # your API key
}


response = requests.get(url, params=params)

# Converting the raw API response (JSON) into a Python dictionary
data = response.json()

# Check if the key "articles" exists in the JSON response
# "articles" is where the list of news articles is stored
if "articles" in data:
    for article in data["articles"]:
        print(article.get("title", "N/A"))
        print(article.get("content", "N/A"))
        print(article.get("description", "N/A"))
        print(article.get("url", "N/A"))
        print("-----------")
else:
    # If "articles" key is missing, print the error response for debugging
    print("No articles found", data)

"""
Example structure of a single article returned by GNews API:
{
    "title": "Tech stocks soar as AI boom continues",
    "description": "The technology sector continues to grow...",
    "content": "Detailed content of the news article...",
    "url": "https://example.com/article1"
}
"""
