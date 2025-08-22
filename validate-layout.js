// Layout validation script for TimeLab
const puppeteer = require('puppeteer');

async function validateLayout() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🔍 Testing TimeLab Layout Fixes...\n');
  
  try {
    // Test Desktop (1200px)
    console.log('📱 DESKTOP TEST (1200px):');
    await page.setViewport({ width: 1200, height: 800 });
    await page.goto('https://showmetime.com', { waitUntil: 'networkidle0' });
    
    // Check if sidebar is visible
    const sidebar = await page.$('.controls');
    const sidebarVisible = await page.evaluate(el => {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.transform === 'none';
    }, sidebar);
    
    console.log(`  ✓ Sidebar visible: ${sidebarVisible ? '✅ YES' : '❌ NO'}`);
    
    // Check timezone positioning
    const timezone = await page.$('.timezone');
    const timezoneTop = await page.evaluate(el => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return rect.top;
    }, timezone);
    
    console.log(`  ✓ Timezone position: ${timezoneTop > 60 ? '✅ Below header' : '❌ Behind header'} (${timezoneTop}px)`);
    
    // Test Tablet (768px)
    console.log('\n📱 TABLET TEST (768px):');
    await page.setViewport({ width: 768, height: 1024 });
    await page.reload({ waitUntil: 'networkidle0' });
    
    const timezoneTopTablet = await page.evaluate(el => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return rect.top;
    }, timezone);
    
    console.log(`  ✓ Timezone position: ${timezoneTopTablet > 56 ? '✅ Below header' : '❌ Behind header'} (${timezoneTopTablet}px)`);
    
    // Test Mobile (375px)
    console.log('\n📱 MOBILE TEST (375px):');
    await page.setViewport({ width: 375, height: 667 });
    await page.reload({ waitUntil: 'networkidle0' });
    
    const timezoneTopMobile = await page.evaluate(el => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return rect.top;
    }, timezone);
    
    console.log(`  ✓ Timezone position: ${timezoneTopMobile > 56 ? '✅ Below header' : '❌ Behind header'} (${timezoneTopMobile}px)`);
    
    console.log('\n🎉 Layout validation complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  await browser.close();
}

validateLayout();