const categories = [
  { id: "majita-cat", name: "Majita Plates", slug: "majita-plates", description: null, display_order: 1, is_active: true, menu_type: "majita_monday", created_at: "" },
];

const menuItems = [
  {
    id: "majita-item", category_id: "majita-cat", name: "Mogodu and Pork Plate", description: null, price: 95,
    image_url: "/food/majita-mogodu-pork-trotters.jpg", item_type: "simple", contents_description: null,
    contents_confirmed: true, is_available: true, is_featured: false, is_todays_special: false, is_popular: false,
    display_order: 1, is_active: true, created_at: "", updated_at: "", combo_option_groups: [], menu_item_addons: [],
  },
];

(async () => {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium" });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.route("https://csvaqltumrrrmhtsdtxt.supabase.co/**", async (route) => {
    const url = route.request().url();
    let body = [];
    if (url.includes("/menu_categories")) body = categories;
    else if (url.includes("/menu_items")) body = menuItems;
    else if (url.includes("/restaurant_settings")) body = { todays_special_override: "majita_monday" };
    else if (url.includes("/published_customer_reviews")) body = [{
      id: "review-1", customer_name: "Thando", rating: 5, review_text: "The mogodu plate was proper, rich and filling.", published_photo_url: null, approved_at: "2026-08-20T07:00:00Z", created_at: "2026-08-20T07:00:00Z",
    }];
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.route("http://127.0.0.1:3000/api/reviews", async (route) => {
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ success: true }) });
  });

  try {
    await page.goto("http://127.0.0.1:3000/majita-monday", { waitUntil: "networkidle" });
    await page.getByText("Every Monday · Kasi favourites · Shared properly").waitFor();
    await page.getByText("Majita menu available today").waitFor();
    const heroImage = page.locator('img[alt="Majita Monday mogodu, pork and trotters platter"]');
    await heroImage.waitFor();
    const heroFit = await heroImage.evaluate((node) => getComputedStyle(node).objectFit);
    if (heroFit !== "contain") throw new Error(`Majita hero image is cropped with object-fit: ${heroFit}`);
    const mainClass = await page.locator("main").getAttribute("class");
    if (!mainClass?.includes("texture-wood-majita")) throw new Error("Majita background class is missing from page root");
    const majitaOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (majitaOverflow) throw new Error("Majita page has mobile horizontal overflow");
    await page.screenshot({ path: "/home/ubuntu/chicken-bar-notes/mobile-majita-release.png", fullPage: true });

    await page.goto("http://127.0.0.1:3000/reviews", { waitUntil: "networkidle" });
    await page.getByText("The mogodu plate was proper, rich and filling.").waitFor();
    await page.getByLabel("Your first name or preferred name").fill("Nandi");
    const ratingInput = page.getByRole("radio", { name: "5★" });
    await ratingInput.evaluate((element) => element.click());
    await page.getByLabel("Your review").fill("The chicken and sides were fresh, generous and full of flavour.");
    await page.getByRole("button", { name: "Send for approval" }).click({ force: true });
    await page.getByText("Thank you. Your review is now waiting for Chicken Bar approval before it appears publicly.").waitFor();
    const reviewsOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (reviewsOverflow) throw new Error("Reviews page has mobile horizontal overflow");

    await page.goto("http://127.0.0.1:3000/privacy", { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Your information, treated with care." }).waitFor();
    await page.getByRole("link", { name: "Customer Reviews" }).scrollIntoViewIfNeeded();
    if (errors.length) throw new Error(`Page errors: ${errors.join(" | ")}`);
    console.log("Trust-release browser smoke test passed: Majita rules and full-photo display, reviews, privacy page, and mobile layout.");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(`Trust-release browser smoke test failed: ${error.message}`);
  process.exit(1);
});
