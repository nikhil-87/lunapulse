import asyncio
import websockets
import json

async def test():
    try:
        async with websockets.connect('ws://localhost:8000/ws') as ws:
            print('Connected')
            for i in range(5):
                msg = await ws.recv()
                print(msg[:200])
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(test())
