import asyncio,json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();pg=await b.new_page()
        await pg.route('**/*',lambda r:r.abort() if not r.request.url.startswith('file:') else r.continue_())
        await pg.goto('file:///home/claude/cb8/crewboard.html');await pg.wait_for_timeout(800)
        r=await pg.evaluate("""(()=>{const o={};for(const k of Object.keys(S)){let v=S[k];let s;try{s=JSON.stringify(v)}catch(e){s='ERR'}o[k]=[typeof v,s?s.length:0,(s||'').slice(0,80)]}return o})()""")
        for k,v in r.items():print(k,v)
        g=await pg.evaluate("""(()=>{const o={};for(const k of ['CREWS','JOBS','QORDER','BOOKS','CLIENTS','TEMPLATES','RECOMMENDED','LABELS','PMS','PEOPLE','DIMS','REQUIRED','IMPT','MEMBERS','CONTACTS','REVIEWS','REGIONS']){try{const v=eval(k);let s;try{s=JSON.stringify(v)}catch(e){s='ERR'}o[k]=[typeof v,s?s.length:0,(s||'').slice(0,100)]}catch(e){o[k]='undef'}}return o})()""")
        for k,v in g.items():print('G',k,v)
        print(await pg.evaluate("[...new Set(S.riley.trainLog.map(x=>x.who))].join(',')"))
        print(await pg.evaluate("ME.toString().slice(0,200)"), await pg.evaluate("isAdmin.toString()"))
        await b.close()
asyncio.run(main())
