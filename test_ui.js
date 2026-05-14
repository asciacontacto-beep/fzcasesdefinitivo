const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: 'new'});
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  // mock localstorage
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('admin_logged', 'true');
  });

  await page.goto('http://localhost:8000/admin/dashboard.html');
  await new Promise(r => setTimeout(r, 1000));
  
  console.log('Clicking add product btn...');
  try {
    await page.evaluate(() => {
        document.getElementById('view-productos').style.display = 'block';
        document.getElementById('btn-add-product').click();
    });
    console.log('Clicked successfully');
  } catch(e) {
    console.log('Failed to click btn-add-product:', e.message);
  }
  
  await new Promise(r => setTimeout(r, 1000));
  await browser.close();
})();
