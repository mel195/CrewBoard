import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();pg=await b.new_page()
        await pg.route('**/*',lambda r:r.abort() if not r.request.url.startswith('file:') else r.continue_())
        await pg.goto('file:///home/claude/cb8/crewboard.html');await pg.wait_for_timeout(800)
        print(await pg.evaluate("""(()=>{const out=[];const walk=(o,p,d)=>{if(d>6||!o||typeof o!=='object')return;for(const k in o){const v=o[k];if(typeof v==='function')out.push(p+'.'+k);else walk(v,p+'.'+k,d+1)}};
        walk(S,'S',0);for(const g of ['CREWS','JOBS','BOOKS','CLIENTS','TEMPLATES','LABELS','DIMS','PMS','MEMBERS','CONTACTS','REVIEWS'])walk(eval(g),g,0);return out.slice(0,40)})()"""))
        await b.close()
asyncio.run(main())
