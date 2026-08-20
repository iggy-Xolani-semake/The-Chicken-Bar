const fixedNow = new Date('2026-08-20T06:00:00.000Z').valueOf(); // 08:00 Africa/Johannesburg, Thursday

const categories = [
  { id: 'burgers', name: 'Burgers', slug: 'burgers', description: null, display_order: 1, is_active: true, menu_type: 'main', created_at: '' },
  { id: 'kota', name: 'The Kota Bar', slug: 'kota', description: null, display_order: 2, is_active: true, menu_type: 'main', created_at: '' },
];

const extras = [
  ['Cheese Slice', 3], ['Special', 5], ['Mangola', 1], ['Liver', 2],
  ['Polony', 2], ['Vienna', 8], ['Egg', 5], ['Russian', 15],
].map(([name, price], index) => ({ id: `${name}-${index}`, menu_item_id: 'shared', name, price, is_available: true, display_order: index + 1 }));

const item = (id, category_id, name, price, image_url = null, menu_item_addons = []) => ({
  id, category_id, name, description: null, price, image_url, item_type: 'simple',
  contents_description: null, contents_confirmed: true, is_available: true, is_featured: false,
  is_todays_special: false, is_popular: false, display_order: price, is_active: true,
  created_at: '', updated_at: '', combo_option_groups: [], menu_item_addons,
});

const menuItems = [
  item('burger', 'burgers', 'Loaded Burger + Chips', 65, '/gallery/loaded-burger-and-fries.jpg'),
  item('kota-small', 'kota', 'Kota - Chips, Atchaar, Polony, Vienna', 20, null, extras),
  item('kota-toasted', 'kota', 'Kota - Toasted', 65, null, extras),
  item('food-large', 'kota', 'Food Spot (Large)', 130, null, extras),
  item('food-small', 'kota', 'Food Spot (Small)', 70, null, extras),
  item('chips-large', 'kota', 'Packet Chips - Large', 30, null, extras),
  item('chips-small', 'kota', 'Packet Chips - Small', 15, null, extras),
  item('fatcake', 'kota', 'Fat Cake (Amagwinya)', 1, null, extras),
];

(async () => {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.addInitScript((time) => {
    const RealDate = Date;
    class FixedDate extends RealDate {
      constructor(...args) {
        super(...(args.length ? args : [time]));
      }
      static now() { return time; }
    }
    window.Date = FixedDate;
  }, fixedNow);

  await page.route('https://placeholder.supabase.co/**', async (route) => {
    const url = route.request().url();
    let body = [];
    if (url.includes('/menu_categories')) body = categories;
    else if (url.includes('/menu_items')) body = menuItems;
    else if (url.includes('/restaurant_settings')) body = {
      order_hours_mon_thu_open: '11:00:00', order_hours_mon_thu_close: '20:00:00',
      order_hours_fri_sun_open: '11:00:00', order_hours_fri_sun_close: '21:00:00',
      kota_bar_address: '3692 Corner Gubhela and Vilakazi', kota_bar_open: '07:00:00',
      kota_bar_close: '19:00:00', kota_order_open: '07:00:00', kota_order_close: '18:00:00',
    };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  try {
    const response = await page.goto('http://127.0.0.1:3000/menu', { waitUntil: 'networkidle' });
    if (!response || response.status() !== 200) throw new Error('Menu did not return HTTP 200');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/home/ubuntu/chicken-bar-notes/menu-ui-debug.png' });
    await page.getByText('3692 Corner Gubhela and Vilakazi').waitFor();
    await page.getByRole('heading', { name: 'Kotas' }).waitFor();
    await page.getByRole('heading', { name: 'Food Spots' }).waitFor();
    await page.getByRole('heading', { name: 'Packet Chips', exact: true }).waitFor();
    await page.getByRole('heading', { name: 'Fat Cakes' }).waitFor();
    await page.locator('[role="status"]').filter({ hasText: 'Main kitchen orders open at 11:00. The Kota Bar is available from 07:00.' }).waitFor();

    const kotaCard = page.getByText('Kota - Chips, Atchaar, Polony, Vienna').locator('..').locator('..').locator('..');
    await kotaCard.getByRole('button', { name: 'Add' }).waitFor();
    await page.getByText('Loaded Burger + Chips').locator('..').getByText('Main kitchen orders open at 11:00. The Kota Bar is available from 07:00.').waitFor();

    const itemTitles = await page.locator('h3').allTextContents();
    const selected = itemTitles.filter((title) => /Food Spot|Packet Chips|Fat Cake/.test(title));
    const expected = ['Food Spot (Small)', 'Food Spot (Large)', 'Packet Chips - Small', 'Packet Chips - Large', 'Fat Cake (Amagwinya)'];
    for (const name of expected) if (!selected.includes(name)) throw new Error(`Missing grouped Kota item: ${name}`);

    const image = page.locator('img[alt="Loaded Burger + Chips"]');
    await image.waitFor();
    const objectFit = await image.evaluate((node) => getComputedStyle(node).objectFit);
    if (objectFit !== 'contain') throw new Error(`Menu photo is still cropped with object-fit: ${objectFit}`);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (overflow) throw new Error('Menu has horizontal overflow at 390px');
    if (errors.length) throw new Error(`Page errors: ${errors.join(' | ')}`);

    await page.getByRole('heading', { name: 'The Kota Bar' }).scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await page.screenshot({ path: '/home/ubuntu/chicken-bar-notes/mobile-kota-menu-update.png' });
    console.log('Menu UI smoke test passed: Kota-only morning ordering, address panel, grouped items, full photo fit, and no mobile overflow.');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(`Menu UI smoke test failed: ${error.message}`);
  process.exit(1);
});
