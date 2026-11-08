import asyncio
from playwright.async_api import async_playwright
SEL='#app > div:nth-of-type(2) > div:nth-of-type(2) > section:nth-of-type(3) > div:nth-of-type(1) > h3:nth-of-type(1)'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();pg=await b.new_page(viewport={'width':1400,'height':900})
        await pg.route('**/*',lambda r:r.abort() if not r.request.url.startswith('file:') else r.continue_())
        await pg.goto('file:///home/claude/cb8/src.html');await pg.wait_for_timeout(600)
        await pg.evaluate("S.tour.on=false;render()")
        for name,js in [('queue',"S.view='queue';render()"),('match',"S.view='match';S.job='hernandez';render()"),('add',"S.view='add';S.add=freshAdd();render();document.querySelector('[data-ax=sample][data-v=morales]').click()"),('crews',"S.view='crews';render()"),('setup',"S.view='setup';render()"),('riley',"S.view='riley';render()"),('board',"placeJob('hernandez','gian');S.view='board';render()")]:
            await pg.evaluate(js);await pg.wait_for_timeout(1500)
            t=await pg.evaluate(f"(()=>{{const e=document.querySelector({SEL!r});return e?e.textContent:null}})()")
            print(name,t)
        await b.close()
asyncio.run(main())
