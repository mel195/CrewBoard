import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();pg=await b.new_page(viewport={'width':1400,'height':900});pg.on('pageerror',lambda e:print('ERR',e))
        await pg.route('**/*',lambda r:r.abort() if not r.request.url.startswith('file:') else r.continue_())
        await pg.add_init_script(open('mock.js').read())
        await pg.goto('file:///home/claude/cb8/crewboard9.html');await pg.wait_for_timeout(1200)
        await pg.evaluate("S.tour.on=false;render()")
        await pg.click('[data-go=queue]');await pg.wait_for_timeout(800)
        print(await pg.evaluate("S.view"), await pg.evaluate("document.querySelectorAll('[data-act=match]').length"))
        await pg.click('[data-act=match][data-v=hernandez]');await pg.wait_for_timeout(1200)
        print(await pg.evaluate("S.view"), await pg.evaluate("[...document.querySelectorAll('[data-act=pick]')].map(x=>x.outerHTML.slice(0,120))"))
        await pg.screenshot(path='dbg.png')
        await b.close()
asyncio.run(main())
