import asyncio
from database import engine, Base
import models

async def reset():
    print("Dropping tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    print("Creating tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Reset DB success!")

if __name__ == "__main__":
    asyncio.run(reset())
