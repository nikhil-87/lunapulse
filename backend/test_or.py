import asyncio
import os
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

async def main():
    try:
        print("KEY:", os.getenv("OPENROUTER_API_KEY")[:10] + "...")
        client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
        )
        print("Sending request to OpenRouter...")
        response = await client.chat.completions.create(
            model="openrouter/free",
            messages=[{"role": "user", "content": "test"}],
        )
        print("Response:", response.choices[0].message.content)
    except Exception as e:
        print("ERROR:", str(e))
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
