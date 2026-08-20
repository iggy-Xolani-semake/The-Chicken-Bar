# Chicken Bar Admin PWA and Order Notifications

The admin area can now be installed on an Android phone and can receive a notification when a new order is created. The code is ready, but the private keys and the database webhook must be configured once after deployment.

## 1. Add the private settings in Netlify

Open the Chicken Bar site in Netlify. Go to **Site configuration**, then **Environment variables**. Add the following values for the production site.

| Variable | What it is | Safe to expose? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | The existing Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The existing Supabase publishable/anon key | Yes |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | The generated VAPID public key | Yes |
| `VAPID_PRIVATE_KEY` | The generated VAPID private key | No — server only |
| `VAPID_SUBJECT` | `mailto:info.thechickenbar@gmail.com` | No need to expose |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Project Settings → API → service role key | No — server only |
| `ORDER_PUSH_WEBHOOK_SECRET` | The generated webhook secret | No — server only |

The generated VAPID keys and webhook secret are provided separately in a private setup file. Do not commit that file to GitHub or send its private key publicly.

After saving the variables, trigger a new Netlify deploy so the server-side notification endpoint can read them.

## 2. Create the Supabase order webhook

In Supabase, open **Database**, then **Webhooks**, then choose **Create a new webhook**. Use these values:

| Field | Value |
|---|---|
| Name | `send_order_push_notification` |
| Table | `orders` |
| Event | `INSERT` only |
| Method | `POST` |
| URL | `https://YOUR-NETLIFY-DOMAIN/api/admin/order-push` |
| Header name | `x-order-webhook-secret` |
| Header value | The same value used for `ORDER_PUSH_WEBHOOK_SECRET` in Netlify |

Replace `YOUR-NETLIFY-DOMAIN` with the live site domain. Supabase sends the new order row in the webhook payload. The endpoint sends a notification to every valid subscribed admin device and removes subscriptions that have expired.

## 3. Install the admin app on Android

1. Open the live site in **Chrome on Android** and sign in at `/admin/login`.
2. Open the Chrome three-dot menu in the upper-right corner.
3. Choose **Install app** or **Add to Home screen**.
4. Confirm the name **Chicken Bar Admin**.
5. Open the new **CB Admin** icon from the phone’s home screen. It should open without the normal browser address bar.

HTTPS is already provided by Netlify, which is required for installation, service workers, and push notifications.

## 4. Enable order notifications

1. Open the installed admin app and sign in.
2. On the Dashboard, tap **Enable Order Notifications**.
3. When Android asks for permission, choose **Allow**.
4. The dashboard should change to **Notifications Enabled**.
5. In Supabase, open **Table Editor** → `push_subscriptions`. A new row should appear for that device.

The button does not ask automatically; this avoids unwanted browser prompts and lets the owner opt in deliberately.

## 5. Test a new-order alert

1. Place a small test order through the customer checkout, or insert a test row in the `orders` table.
2. The Android device should receive a **New Order!** notification.
3. Tap the notification. It should open or focus the admin app at **Orders**.

## If the phone does not buzz

Check these items in order:

1. On Android, open Chrome’s site settings and make sure notifications are allowed for the Chicken Bar domain.
2. In Supabase Table Editor, confirm the phone has a row in `push_subscriptions`.
3. In Supabase Database → Webhooks, open the webhook history. The latest call should have a successful response.
4. In Netlify, open Functions/Logs and look for `/api/admin/order-push`. A `401` means the webhook header secret does not match. A `500` usually means one of the private environment variables is missing.
5. Confirm the VAPID public key in Netlify exactly matches the public key in the private setup file, and that the private key was entered only as `VAPID_PRIVATE_KEY`.
6. If the same device was reinstalled or browser data was cleared, return to the Dashboard and tap **Enable Order Notifications** again.
