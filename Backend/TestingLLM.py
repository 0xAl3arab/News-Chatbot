from openai import OpenAI

client = OpenAI(
    api_key="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", #lets create a connectiiion
    base_url="https://api.groq.com/openai/v1"
)

while True:
    user_message = input("You: ") #nice idea looks like You : and you type
    if user_message == "exit": #exit if you write it in the input
        break
    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": user_message}]) #one message dict stored in a list

    print("Bot:"+ response.choices[0].message.content) #becuase AI can generate multiple responses the API is designed to support many.