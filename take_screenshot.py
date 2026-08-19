import asyncio
from playwright.async_api import async_playwright
import os

async def take_screenshot():
    async with async_playwright() as p:
        iphone_13 = p.devices['iPhone 13']
        browser = await p.chromium.launch()
        context = await browser.new_context(**iphone_13)
        page = await context.new_page()
        
        file_path = f"file:///{os.path.abspath('index.html').replace(chr(92), '/')}"
        print(f"Loading {file_path}")
        await page.goto(file_path)
        
        # Wait for the splash screen button
        await page.wait_for_selector('#btn-open-hangar')
        # Click the button to open hangar
        await page.click('#btn-open-hangar')
        
        # Wait for hangar overlay to be visible
        await page.wait_for_selector('#overlay-hangar.active', state='visible')
        
        # Give it a second to render fully (fonts, css animations, etc)
        await page.wait_for_timeout(1000)
        
        # Scroll to the bottom of the hangar to show the Apple IAP button
        await page.evaluate("""
            const hangar = document.querySelector('#overlay-hangar .overlay-content');
            if (hangar) hangar.scrollTop = hangar.scrollHeight;
        """)
        
        await page.wait_for_timeout(500)
        
        screenshot_path = 'ios_hangar_review.png'
        await page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")
        
        await browser.close()

asyncio.run(take_screenshot())
