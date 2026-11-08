import asyncio,json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();ctx=await b.new_context(viewport={'width':1400,'height':900})
        mock=open('/home/claude/cb8/mock.js').read()
        async def page(who):
            pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
            await pg.route('**/*',lambda r:r.abort() if not r.request.url.startswith('file:') else r.continue_())
            await pg.add_init_script(f"window.__who={json.dumps(who)};"+mock)
            await pg.goto('file:///home/claude/cb8/crewboard9.html');await pg.wait_for_timeout(1200)
            return pg,errs
        await (await ctx.new_page()).goto('file:///home/claude/cb8/crewboard9.html')
        pg,errs=await page({'id':'u_ido','owner':False})
        await pg.evaluate("localStorage.removeItem('__mockdb');localStorage.removeItem('cb-telemetry')")
        await pg.reload();await pg.wait_for_timeout(1200)
        ev=pg.evaluate
        await ev("S.tour.on=false;render()")
        print('banner',await ev("!!document.getElementById('tbanner')"),'save',await ev("SAVE.state"),'writes',await ev("__writes"))
        await pg.screenshot(path='c_banner.png')
        await pg.click('#tbanner [data-v="1"]');await pg.wait_for_timeout(300)
        # navigate and do things
        await pg.click('[data-go=queue]');await pg.wait_for_timeout(1500)
        await pg.click('[data-act=match][data-v=hernandez]');await pg.wait_for_timeout(2500)
        await pg.click('.crew.best [data-act=pick]');await pg.wait_for_timeout(1500)
        print('view',await ev("S.view"),'place',await ev("JSON.stringify(S.place.hernandez||null)"))
        await pg.wait_for_timeout(2000)
        print('state',await ev("SAVE.state"),'writes',await ev("__writes"),'keys',await ev("Object.keys(JSON.parse(localStorage.__mockdb))"))
        # feedback
        await pg.click('#pg-board [data-fb]') if await ev("!!document.querySelector('#pg-board [data-fb]')") else await pg.click('[data-fb]')
        await pg.wait_for_timeout(300);await pg.screenshot(path='c_fb.png')
        await pg.fill('#fb8t','The confirm button is hard to find');await pg.click('[data-act=fb8send]');await pg.wait_for_timeout(400)
        # member switch
        await pg.click('[data-member=m_carla]');await pg.wait_for_timeout(500)
        print('role',await ev("S.role"),await ev("ME()"),'tabs',await ev("[...document.querySelectorAll('#tabs button')].map(b=>b.textContent).join('|')"))
        await pg.screenshot(path='c_carla.png')
        await pg.click('[data-member=m_ido]');await pg.wait_for_timeout(300)
        await ev("T.tick();T.dirty=true;flushT()");await pg.wait_for_timeout(500)
        db=await ev("JSON.parse(localStorage.__mockdb)")
        print('telemetry',json.dumps(db.get('telemetry/u_ido'))[:600])
        print('feedback',json.dumps(db.get('feedback/u_ido'))[:600])
        print('errs',errs)
        # reload as Ido: state persisted?
        pg2,errs2=await page({'id':'u_ido','owner':False})
        await pg2.wait_for_timeout(800)
        print('reload place',await pg2.evaluate("JSON.stringify(S.place.hernandez||null)"),'state',await pg2.evaluate("SAVE.state"),'banner',await pg2.evaluate("!!document.getElementById('tbanner')"))
        # owner view
        pg3,errs3=await page({'id':'u_mel','owner':True})
        await pg3.evaluate("S.tour.on=false;render()");await pg3.wait_for_timeout(300)
        await pg3.click('[data-go=usage]');await pg3.wait_for_timeout(1200)
        await pg3.screenshot(path='c_usage.png',full_page=True)
        await pg3.evaluate("S.view='setup';render()");await pg3.wait_for_timeout(500);await pg3.screenshot(path='c_setup.png')
        print('errs2',errs2,'errs3',errs3)
        await b.close()
asyncio.run(main())
