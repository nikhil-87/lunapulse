import asyncio
import os
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

async def test():
    client = AsyncOpenAI(base_url='https://openrouter.ai/api/v1', api_key=os.getenv('OPENROUTER_API_KEY'))
    models = ['google/gemini-2.0-pro-exp-02-05:free', 'mistralai/mistral-7b-instruct:free', 'qwen/qwen-2-7b-instruct:free', 'google/gemma-2-9b-it:free']
    for m in models:
        try:
            print('Testing', m)
            res = await client.chat.completions.create(model=m, messages=[{'role': 'user', 'content': 'test'}])
            print('Success', m)
            return
        except Exception as e:
            print('Fail', m, str(e))

if __name__ == "__main__":
    asyncio.run(test())
