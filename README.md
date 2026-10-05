# Store Builder (working name)

A hosted store platform: businesses sign up, build an online store, and pay a
monthly subscription. It runs on the same Django backend as Alfudi
(`../estore-backend`) with its own frontends.

## Layout

```
apps/admin        Merchant admin — sign in, products, orders, settings (port 5173)
apps/storefront   Customer-facing store, one per business (port 5174)
packages/shared   API client + JWT refresh, types, Dalasi formatting, store-from-hostname
packages/ui       Shared Tailwind preset, theme tokens and UI primitives
```

## Run locally

```bash
npm install
npm run dev:admin        # http://localhost:5173
npm run dev:storefront   # http://<store-username>.localhost:5174
```

In development each app proxies `/api` to the backend set by `API_PROXY_TARGET`
(defaults to the production backend), so no CORS changes are needed. Copy
`apps/*/.env.example` to `.env` to override.

A storefront is picked from the URL: `/@mystore` (canonical; `/mystore` redirects
there), `mystore.<VITE_PLATFORM_DOMAIN>` once a wildcard domain is set up, or
`mystore.localhost:5174` in dev. `?store=mystore` is used by the editor preview.

## Deploy (Vercel)

Create **two Vercel projects** from this repo — one per app:

| Project | Root Directory | Environment variables |
|---|---|---|
| admin | `apps/admin` | `VITE_STOREFRONT_ORIGIN=https://<storefront domain>`, `VITE_PLATFORM_DOMAIN=<root domain>` (once you have one), `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET`, `VITE_CLOUDINARY_API_KEY` |
| storefront | `apps/storefront` | `VITE_ADMIN_ORIGIN=https://<admin domain>`, `VITE_PLATFORM_DOMAIN=<root domain>` (once you have one) |

In production the apps call the Render backend directly (override with
`VITE_API_URL`). The backend allows them via CORS: `PLATFORM_FRONTEND_ORIGINS`
in `estore-backend/estore/settings.py` (defaults to the two Vercel URLs) and
`CORS_ALLOWED_ORIGIN_REGEXES` for store subdomains later. `VITE_STOREFRONT_ORIGIN`
/ `VITE_ADMIN_ORIGIN` default to the current Vercel URLs too.

Store subdomains (`mystore.<root domain>`) need a custom domain on the
storefront project with a wildcard `*.<root domain>` entry (Vercel requires its
nameservers for wildcard domains). Until then, stores open at
`https://<storefront>.vercel.app/@<slug>` — and the short form
`https://<storefront>.vercel.app/<slug>` redirects there.

## Store wizard & designer

- `/start` — 4-step wizard (name + address, industry, template + colour,
  account). `generateTheme()` in `packages/shared/src/theme.ts` builds a full
  starter design from the answers; the store is created via
  `POST /api/platform/stores/` (backend app `platform_stores`).
- `/design` — visual editor: section list (drag/reorder, hide, duplicate,
  delete, add from the library), per-section settings, brand settings (logo,
  colour, fonts, corners, background), undo/redo, live preview.
- The preview is the real storefront in an iframe (`?store=<slug>&preview=1`);
  the editor streams the unsaved draft to it with `postMessage`, and clicking a
  section in the preview selects it. Allowed origins: `VITE_STOREFRONT_ORIGIN`
  (admin) and `VITE_ADMIN_ORIGIN` (storefront).
- To add a new UI element: add its type, fields and defaults to
  `SECTION_DEFINITIONS` in `theme.ts`, then a renderer in
  `apps/storefront/src/sections/Sections.tsx`. The editor form is generated
  from the fields automatically.

## Decisions so far

- Stores are independent; a business can optionally also list on Alfudi.
- Customer payments go to the merchant's own Wave/ModemPay account; the
  platform only charges the monthly subscription.
- Subdomains at launch; custom domains later.

## Roadmap

1. **Backend foundation** — `Store` (tenant) model separate from `User`;
   products/orders/staff point at a store; orders get a real `store` FK and an
   `OrderItem` table (today seller orders are found by scanning every order's
   JSON items); one shared helper scopes every query to the current store;
   migrate existing sellers into stores.
2. **Merchant sign-up + full admin** — create a store, product editor,
   order management (reuse the Alfudi seller dashboard pieces).
3. **Storefront v1** — theme settings (logo, brand colour, sections), real
   checkout through the orders API with payment to the merchant.
4. **Billing** — plans, monthly invoices paid via Wave/ModemPay, grace period,
   suspension of unpaid stores.
5. **Custom domains**, more themes, optional Alfudi marketplace listing.

Production also needs the backend's `CORS_ALLOWED_ORIGIN_REGEXES` to allow
`https://*.<platform-domain>` once the domain is chosen.
