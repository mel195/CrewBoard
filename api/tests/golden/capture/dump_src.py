"""Dump the final (post-layer) source of the prototype's engine functions, for porting reference."""
import asyncio, sys, json
from playwright.async_api import async_playwright
NAMES = ("crewById parseSize planSize rain dimsOf dimL activeCrews ready missing _missing leadTracked langTracked "
 "crewOfBooking bookings occ freeHalf busy painterDays crewsOf comboSize need span setPlace pS halfTaken placeConf placeDays "
 "hard util hist r20 factors score rank weights labelFor imp impWhy rileyPick rileyLearn _rileyLearn crewPay margin mgScore optAllOk openDays "
 "optimize _optimize applyMoves _applyMoves planAll placeJob earliestSlot dayCap capAll tH kpiSched kpiWaiting driveMin whyLines segCap "
 "nextWork rebalance splitVisits capW autoReason snap owin sdate dlabel idxOfDate").split()
async def main(path, out):
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page()
        await pg.goto('file://' + path); await pg.wait_for_timeout(1500)
        src = await pg.evaluate("names=>names.map(n=>{try{const f=eval(n);return '/* '+n+' */\\n'+(typeof f==='function'?f.toString():JSON.stringify(f))}catch(e){return '/* '+n+' missing */'}}).join('\\n\\n')", NAMES)
        consts = await pg.evaluate("()=>({IMPT:IMPT.map(x=>[x[0],x[1],x[2].toString()]),STAGES,AVG_COST,LANGS})")
        open(out, 'w').write(src + '\n\n/* consts */\n' + json.dumps(consts, indent=1))
        await b.close()
asyncio.run(main(sys.argv[1], sys.argv[2]))
