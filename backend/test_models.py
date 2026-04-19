import os
import google.generativeai as genai
import dotenv
import asyncio

dotenv.load_dotenv('.env')
genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))

models = ['gemini-2.0-flash', 'gemini-flash-lite-latest', 'gemma-3-4b-it', 'gemini-2.5-flash-lite']

async def t(): 
    for m in models:
        try:
            r = await genai.GenerativeModel(m).generate_content_async('hi')
            print(m, 'OK')
        except Exception as e:
            print(m, 'FAIL', str(e).split('\n')[0])

asyncio.run(t())
