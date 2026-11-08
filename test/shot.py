import asyncio,sys
from playwright.async_api import async_playwright
async def main(f,views,tag,w=1400):
    async with async_playwright() as p:
        b=await p.chromium.launch();pg=await b.new_page(viewport={'width':w,'height':900})
        errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.route('**/*',lambda r:r.abort() if not r.request.url.startswith('file:') else r.continue_())
        await pg.goto('file:///home/claude/cb8/'+f);await pg.wait_for_timeout(600)
        await pg.evaluate("S.tour&&(S.tour.on=false);setTheme('THEME');render()".replace('THEME',sys.argv[4] if len(sys.argv)>4 else 'light'))
        for v in views:
            await pg.evaluate(v[1]);await pg.wait_for_timeout(600)
            await pg.screenshot(path=f'{tag}_{v[0]}.png',full_page=True)
            sw=await pg.evaluate('document.documentElement.scrollWidth')
            if sw>w+1:print(v[0],'HSCROLL',sw)
        print('errs',errs);await b.close()
V=[('onboard',"S.view='onboard';render()"),('queue',"S.view='queue';render()"),('match',"S.view='match';S.job='hernandez';render()"),('board',"placeJob('hernandez','gian');S.view='board';render()"),('add',"S.view='add';S.add=freshAdd();render();document.querySelector('[data-ax=sample][data-v=morales]').click()"),('add2',"0")]
f=sys.argv[1];tag=sys.argv[2];w=int(sys.argv[3]) if len(sys.argv)>3 else 1400
asyncio.run(main(f,V,tag,w))
