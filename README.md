# bedlisting — MVP

Rental marketplace connecting tenants and landlords directly, with mandatory
landlord ID verification and per-listing ownership checks before anything
goes public.

## What's built

- Auth: email/password via NextAuth. Tenants/landlords sign in at `/login`; admins sign in
  at `admin.<your-domain>/admin/login` (separate login, separate subdomain)
- Property CRUD with filters (state, city, price, bedrooms, furnished)
- Landlord verification gate: no listing can be created until an admin
  approves the landlord's submitted ID
- Privacy-masked messaging: landlord sees "First L." until either party
  explicitly shares contact details on that thread
- Reporting: any listing or landlord can be reported; admin queue sorts by
  repeat-report count
- Admin panel: user suspend/reinstate, verification review, listing
  approve/reject, report resolution, basic analytics

## What's stubbed or missing (be aware before treating this as production-ready)

- No email verification on signup, no password reset flow
- No rate limiting on any API route
- Image uploads go straight to Cloudinary client-side base64, fine for MVP
  volume, not efficient at scale
- No automated tests
- ID document viewing in the admin listings page currently uses the direct
  Cloudinary URL. The `getSignedIdDocumentUrl` helper in `lib/cloudinary.ts`
  is written but not wired into the admin UI yet, wire it in before handling
  real ID documents so links expire after 10 minutes instead of staying
  permanently accessible
- No pagination anywhere (admin lists, property browse) — fine at low
  volume, will need it before this scales past a few hundred listings

## How the two logins work

| | Users (tenants, landlords) | Admins |
|---|---|---|
| URL | `bedlisting.com/login` | `admin.bedlisting.com` |
| Sign-up | Public form | None. Created with `npm run db:seed-admin` |
| Provider | `credentials` (rejects admin accounts) | `admin-credentials` (accepts only admin accounts) |
| Admin pages | Do not exist here (`/admin` returns 404) | Everything lives here |

Sessions are cookies tied to the host, so signing in on one domain never signs you in on the other.
Admin links are not shown anywhere on the public site.

## Bedcoins, unlocks and the 60/40 split

All the numbers live in `lib/pricing.ts`. Change them there.

**What users pay for**

| Action | Cost |
|---|---|
| Browse, search, see the cover photo | Free |
| Unlock a property (all photos, exact address, map pin, directions, message the lister) | 500 bedcoins (rent or sale) |
| Ask an agent to take you to the property | 2,000 bedcoins (placeholder; escorts are off while there are no agents) |
| Lister features a listing | 3 days 1,000, 7 days 2,000, 14 days 4,000 bedcoins |

New seekers get 500 free bedcoins (one free unlock). Free bedcoins never earn a lister money,
so fake sign-ups cannot be used to farm payouts.

**Who gets what.** When someone spends *paid* bedcoins to unlock a listing, the landlord or agent
earns **40%** and bedlisting keeps **60%**. The 40% is worked out from what that buyer actually
paid per bedcoin (a ₦100 pack and a ₦40 pack are handled correctly). Boosts are paid from the
lister's own bedcoins and bedlisting keeps 100%.

**Earnings lifecycle.** An earning is held 7 days, then becomes available. A verified lister
requests a withdrawal of everything available (minimum ₦2,000). An admin pays it by bank
transfer, then marks it paid with the transfer reference in the admin site (Payouts).
Withdrawals are manual on purpose for now: automatic transfers need Paystack Transfers enabled
and an OTP setting, and money going out should be checked by a person first.

**Scam protection.** In the admin site, "Remove and refund" on a live listing takes it down,
refunds everyone who unlocked it, and cancels the lister's un-withdrawn earnings from it.

**Payments.** Prices are decided on the server. Paystack payments are confirmed twice (webhook and
the page the buyer returns to), the amount is checked against what we stored, and credits are
added exactly once.

## Local setup

```bash
npm install
cp .env.example .env
# fill in DATABASE_URL, NEXTAUTH_SECRET, CLOUDINARY_* in .env
npx prisma db push
npm run dev
```

- Main site: `http://localhost:3000`
- Admin: `http://admin.localhost:3000` (works in Chrome, Edge and Firefox with no setup)

Create your admin account:

```bash
ADMIN_EMAIL="you@bedlisting.com" ADMIN_PASSWORD="a-long-password-12+" npm run db:seed-admin
```

Running it again with the same email resets that admin's password. It refuses to touch an
email that belongs to a tenant or landlord.

## Deploy: Neon (database) + Vercel (app)

1. **Database.** In the Vercel dashboard, add a Neon (or Supabase) Postgres integration, or create
   one yourself and copy the connection string.
2. **Push code to GitHub**, then **New Project** on Vercel and import the repo.
3. **Environment variables** (Project Settings, Environment Variables):
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
   - `NEXTAUTH_URL` = your main site, e.g. `https://bedlisting.com`
   - `PAYSTACK_SECRET_KEY`
   - `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFY_EMAIL` (see Email notifications below)
   - `CRON_SECRET` (any long random string; protects the daily cleanup job in `vercel.json`)
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
4. **Domains** (Project Settings, Domains). Add both to the same project:
   - `bedlisting.com`
   - `admin.bedlisting.com`

   At your domain registrar, add the DNS records Vercel shows for each.
5. **Create the tables** once, from your machine:
   ```bash
   DATABASE_URL="<your-production-url>" npx prisma db push
   ```
6. **Create your admin** against the production database:
   ```bash
   DATABASE_URL="<your-production-url>" ADMIN_EMAIL="you@bedlisting.com" \
   ADMIN_PASSWORD="a-long-password-12+" npm run db:seed-admin
   ```
7. **Paystack webhook.** In the Paystack dashboard, Settings, API Keys & Webhooks, set the webhook URL to
   `https://bedlisting.com/api/webhooks/paystack`. Use your test keys first.
8. Open `https://admin.bedlisting.com` and sign in.

Note: Vercel preview URLs (`*.vercel.app`) are not admin hosts, so admin pages are only reachable
on the `admin.` domain.

## After deploying, test this exact path before calling it live

Use Paystack TEST keys and a Paystack test card for steps 6 to 8.

1. On the main site, try `/admin/dashboard`. It must show a 404.
2. On the main site's `/login`, try your admin email. It must say no account found.
3. On `admin.` sign in with the admin account. Then try a tenant email there. It must say invalid credentials.
4. Register an agent and a landlord. Submit ID for both. In admin, open "View ID document", approve.
5. As the agent, list a property with 3 photos and a map pin. As the landlord, list one with no pin. Approve both in admin (tick "Verified property" on one with a document).
6. Register a seeker. Browse: you must see only the cover photo, "No map pin" on the landlord one, and no address.
7. Unlock the agent's listing with the free bedcoins. All photos and the Google Maps button must appear. Messaging must now work.
8. Buy a pack on `/credits`. The balance must rise exactly once, even if you refresh the page.
9. As the agent, open Earnings. After an unlock using PAID bedcoins you must see a pending earning of 40% of what the seeker paid for them.
10. Request an escort as the seeker. Decline it as the agent: bedcoins return. Request again, accept, mark complete.
11. In admin, "Remove and refund" a live listing. The seeker's bedcoins must come back.
12. To test cash-out quickly, temporarily set `EARNING_HOLD_DAYS` and `MIN_PAYOUT_NAIRA` low in `lib/pricing.ts`, request a withdrawal, and mark it paid in admin.

## Email notifications

Sent through Resend (free plan: 3,000 emails a month). Setup: create a Resend account, add and verify your domain (`bedlisting.com`), create an API key, and set `RESEND_API_KEY`, `EMAIL_FROM` and `ADMIN_NOTIFY_EMAIL`. Without a key nothing breaks: emails are just printed to the server log. A failed email can never fail the action behind it.

| Email | Goes to | Can be switched off? |
|---|---|---|
| ID submitted, new or resubmitted listing, withdrawal requested, new report | Admin team | No |
| Listing approved / not approved, listing removed, bedcoins refunded | Lister, or the seeker | No |
| ID approved / not approved | Lister | No |
| Bedcoin purchase receipt, withdrawal paid / not approved | The user | No |
| Password changed | The user | No |
| New message (never contains the message text; at most one per person per 15 minutes) | Recipient | Yes |
| Escort requested / accepted / declined / completed / expired | Agent or seeker | Yes |
| "You earned ₦X" after an unlock | Lister | Yes |

Users switch the optional ones off on their profile page. The wording is in `lib/notify.ts`.


## Photos and what stays hidden until someone pays

- **One free photo, and it must be of the inside.** Listers upload inside photos and (optionally) outside photos separately. Everyone sees only the first inside photo. The outside of the building, every other photo, the exact address, the video and the **lister's name, agency and licence number** unlock after payment. Before that, people only see "a verified landlord/agent". This is so nobody can find the house from a picture of the building and skip the platform.
- Photos are stripped of GPS and other embedded data at upload time, so the free photo cannot reveal where the house is.
- The listing form warns listers not to put street or estate names in the title or description, and the admin review card reminds admins to reject listings whose free photo shows the outside or whose text names the street.
- Only landlords, agents and admins can upload files at all (before, any signed-in user could).

## Roommate matching

- **Free:** create a profile and see matches. **Paid:** sending a request costs `ROOMMATE_CONNECT_COST` bedcoins (placeholder: 300, in `lib/pricing.ts`). It is returned if declined, cancelled, or unanswered for 72 hours (handled by the daily job). Chat opens only after the other person accepts. bedlisting keeps 100% of accepted requests.
- **Matching** (`lib/roommates.ts`, scores 0 to 100): area 30, budget overlap 25, move-in date 15, sleep 10, tidiness 10, visitors 10. Two hard rules: a "same gender only" preference is respected in both directions, and a smoker is only matched with someone who is fine with smoking. The same rules are enforced again on the server when a request is sent.
- **Privacy:** profiles show first name plus last initial, gender, area, budget, move-in date and lifestyle. No photos and no contact details. People must confirm they are 18 or over.
- **Safety:** safety tips on every roommate page, a "Report this person" button on cards and chats, and a limit of 10 requests a day.
- Pages: `/roommates` (matches), `/roommates/profile`, `/roommates/connections`, `/roommates/connections/<id>` (chat).

## Email confirmation

New accounts get a "Confirm your email address" link (valid 24 hours, works once, only a hash is stored). People can browse straight away, but must confirm before they can **unlock a listing, message someone, buy bedcoins, list a property, submit an ID, request an escort or withdraw**. A banner with a Resend button shows until they do. Resend is limited to one a minute and five an hour. Admins are exempt (the seed script marks them confirmed).

**Set up Resend before launch.** Without `RESEND_API_KEY` no confirmation email is delivered, so nobody could unlock anything. Locally, with no key, the link is printed in the server log instead so you can still click it.

Accounts created before this update count as unconfirmed. They see the banner and can resend.

## Admins can list properties too

On the admin site (`admin.<your-domain>`), an admin has everything a landlord or agent has for properties:

- **My listings** (`/admin/properties`): post, edit, feature and remove listings. Official listings go live at once and carry the "Official bedlisting" tag. They show "bedlisting", never the admin's personal name.
- **Edit any listing**, including landlords' (button on each card in Listings), and mark a property "Verified" after checking its ownership documents.
- **Feature a listing for free** (3, 7 or 14 days).
- **Messages** (`/admin/messages`): people who unlock an official listing message the bedlisting team, and admins reply here. Contact sharing uses the support email, not the admin's own.
- **No lister share on official listings.** When someone unlocks one, bedlisting keeps 100% and no earning is created.
- Video and photo upload work in the admin form too.

Also fixed: a listing with several interested people now has one separate conversation per person. Before, only the first person's thread could be opened.

## Video tours

Landlords and agents can add up to 2 videos (MP4, MOV or WebM, up to 80 MB each) when adding or editing a listing. Videos upload straight from the browser to Cloudinary (our own server can't take big files) and are stored privately. The page only gets playable links for people who unlocked the listing, so the video is part of what they pay for. Admins can watch videos while reviewing a listing. Adding or changing a video sends the listing back for review.

Your Cloudinary plan sets its own video size and storage limits. Check them before launch. Phone videos are big, so tell listers to keep clips under a minute.

## Safety fixes in this version

- **Suspended or deleted users are signed out immediately** instead of staying signed in for up to 30 days.
- **Login rate limiting:** 5 wrong passwords per email, or 30 per network address, then a 15-minute lock. This covers both the user and admin logins.
- **Change password** for everyone: `/profile` for users, `/admin/account` for admins (12+ characters).
- **Escort requests an agent never answers** are cancelled after 72 hours and the bedcoins return to the seeker (daily job, see `vercel.json`).
- **Saved properties** no longer list removed listings.
- **Privacy Policy** at `/privacy`, linked from the footer and sign-up.

## Terms, FAQ and editing listings

- `/terms` and `/faq` render `content/terms.ts` and `content/faq.ts`. The numbers in them (40% share, 7-day hold, prices, minimum withdrawal) are read from `lib/pricing.ts`, so they cannot drift from what the app does. Edit the wording in those two files.
- Before launch, fill in `lib/site.ts` (effective date, business address, support email) and **have a Nigerian lawyer review the Terms**. They were drafted from your text and the app's actual behaviour, not by a lawyer. Section 15 (bedcoins) and sections 16 to 18 (unlocking, earnings, refunds) are the new parts to check.
- Landlords and agents edit listings from the dashboard (`/landlord/properties/<id>/edit`). Changing the title, photos, price, place or ownership document sends it back for review. Other edits (amenities, description, rooms) go live straight away. A removed listing cannot be edited back to life.
- Amenities are the lister's own statement. The property page says so, admins see them labelled as unchecked, and "Report" has a "Misleading details" reason.

## Lodge types and amenities

Rentals have a lodge type (one room, self-con, boys’ quarters, hostel, 2/3/4-bedroom flat) and amenities (running water, water heater, overhead tank, constant light). Both are free to see, filterable on Browse, and edited in `lib/lodge.ts` plus the matching enums in `prisma/schema.prisma`. After pulling this update, run `npx prisma db push` again.

## Frontend

The public site follows the "My BedSpace" landing design: `app/page.tsx` (homepage sections), `components/TopBar.tsx`, `components/Navbar.tsx` (header), `components/Footer.tsx`, wrapped by `components/SiteShell.tsx`. Contact details in the top bar and footer are placeholders. Search the three files for `support@bedlisting.com` and `+234 000 000 0000` and replace them with real ones.

## More checks for this version

13. Add a short MP4 to a listing. Approve it in admin (you should be able to play it there). As a seeker, before unlocking you must see only "video tour unlocks with the full view". After unlocking, it plays.
14. Suspend a signed-in test user in admin, then refresh their tab. They must be signed out.
15. Enter a wrong password 5 times for one email. The 6th try must say "Too many failed attempts", even with the right password.
16. Change your password on `/profile` and sign in again with the new one.
17. Edit a listing's amenities. It should stay live. Change its price. It should go back to pending.

18. In admin, open My listings and post an official listing with a video. It should be live immediately, tagged Official, and show "bedlisting" as the lister.
19. As a seeker, unlock it and send a message. The 5 bedcoins must NOT create an earning anywhere. In admin, open Messages and reply.
20. With two different seekers messaging one listing, the lister's inbox must show two separate conversations.

21. Set a Resend key, then submit a listing as a landlord. The admin address must get an email. Approve it, and the landlord must get one.
22. Send a seeker's message to a lister. The lister gets one email without the message text. Send two more within 15 minutes: no extra email.
23. Untick "Email me about new messages..." on a profile. No more message emails to that user, but a bedcoin receipt still arrives.
24. Buy bedcoins with a Paystack test card. One receipt email, not two, even though the webhook and the return page both confirm the payment.

25. Register a new seeker. You must get a confirm email (or see the link in the server log with no key). Before clicking it, try Unlock: it must refuse and mention confirming your email. Browsing must still work.
26. Click the link. The page must say "Email confirmed", the banner must disappear on the next page, and Unlock must now work.
27. Click the same link again. It must say the link did not work (single use). Request a new link with Resend twice within a minute: the second must be refused.
28. Register as a landlord, confirm the email, and check you can submit an ID. Before confirming, ID submission and listing must be refused.

29. As a landlord, add a listing with 2 inside photos and 1 outside photo, approve it, then open it as a seeker before unlocking. You must see exactly ONE inside photo, a locked tile mentioning the outside, and "Listed by a verified landlord" with no name. After unlocking, all photos, the outside section and the name appear.
30. Upload a phone photo that has GPS data in it, then download the stored image and check its metadata. It should be gone.
31. Create two roommate profiles of different genders, both set to "same gender only". Neither should see the other. Switch one to "Anyone": the other should still not see them until both allow it.
32. Create two compatible profiles. Send a request: 3 bedcoins leave the sender. Decline it: they come back. Send again, accept it, chat both ways, and confirm the bedcoins were NOT returned.
33. Create a smoker and a non-smoker who is not fine with smoking. They must never match.

## Not built yet

- Subscriptions (Landlord Pro, Agent Pro), free-listing limits, priority inquiry and tenant profile boost
- Admin form to post "Official bedlisting" listings (the tag and badge exist)
- Automatic payouts through Paystack Transfers (withdrawals are paid by an admin for now)
- A featured-listings strip on the homepage (the design has none; boosted listings still show first on Browse)
- Changing your email address (it is fixed at sign-up for now)
