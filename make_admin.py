import asyncio
from app.database import AsyncSessionLocal
from app.models.user import User
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == 'bjandri.1337@gmail.com'))
        user = result.scalar_one_or_none()
        if not user:
            print('User not found')
            return
        user.role = 'admin'
        await db.commit()
        print(f'Done: {user.email} is now {user.role}')

asyncio.run(main())
