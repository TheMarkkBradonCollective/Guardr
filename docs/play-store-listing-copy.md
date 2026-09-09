# Play Store listing copy (Guardr)

Copy-paste into Google Play Console → **Main store listing**. Adjust support email before publishing.

---

## App name

Use a separate Play listing per role (max 30 characters):

```
Guardr Client
Guardr Guard
Guardr Staff
```

The previous combined name:

```
Guardr
```

(Max 30 characters — already fits.)

---

## Short description (max 80 characters)

```
Connect with licensed security pros. Jobs, credentials, messaging, and shifts.
```

Alternate (79 chars):

```
Marketplace for security guards and clients. Jobs, check-ins, credentials, chat.
```

---

## Full description (max 4000 characters)

```
Guardr is the technology platform from Signature Security Specialist, LLC — connecting clients who need security services with independent licensed security professionals.

Anytime. Anywhere. Security, When You Need It.

FOR GUARDS
• Browse open job offers and accept work that fits your schedule and qualifications
• Check in on site with GPS validation and complete self-audits with photos
• Manage credentials, certifications, and compliance documents
• Message clients and coordinate shift details in real time
• Track performance, standing crew assignments, and earnings through Stripe Connect

FOR CLIENTS
• Post security requests with site details, schedules, and requirements
• Review guard qualifications and credentials before you hire
• Coordinate jobs and messaging through one platform
• Pay through secure Stripe processing

FOR STAFF & OPERATIONS
• Approval workflows for guards, clients, and job postings
• Operational tools for Signature Security network staff

IMPORTANT
Guardr is a technology marketplace only. Signature Security Specialist, LLC is not a private patrol operator, security guard employer, or staffing agency. Guards and clients contract directly for each job.

REQUIREMENTS
• Android device with location, camera, and notification permissions for full field features
• Internet connection
• Valid Guardr account (guard, client, or staff role)

LEGAL
Terms: https://guardr.co/legal/terms
Privacy: https://guardr.co/legal/privacy

Support: support@guardr.co
Website: https://guardr.co
```

---

## Developer contact (Console → Store settings)

| Field | Suggested value |
|-------|-----------------|
| Email | support@guardr.co |
| Phone | (optional — your business line) |
| Website | https://guardr.co |

---

## Release notes template (Internal testing)

```
Guardr Android — initial Play Store test build

• Native app for guards and clients on the Guardr marketplace
• Job browse, check-in, credentials, messaging, and push notifications
• Same platform as guardr.co — optimized for field use on Android

Report issues to support@guardr.co
```

---

## Data safety — short answers (reference)

Use the full table in [GOOGLE-PLAY.md](./GOOGLE-PLAY.md). Summary for the form:

- **Collects personal info:** Yes (account, profile, licensing)
- **Collects location:** Yes (precise — job check-in and map)
- **Collects photos:** Yes (audits, credentials)
- **Collects messages:** Yes (in-app chat)
- **Financial info:** Yes — payments via Stripe (third-party processor)
- **Encrypted in transit:** Yes
- **Account deletion:** Available per privacy policy
- **Ads:** No
- **Play Billing:** Not used

---

## App access — instructions for reviewers

```
1. Install the app from the internal testing link provided.
2. Sign in with the test guard credentials supplied in this form.
3. Confirm the home screen loads and navigation works (Jobs, Map, Messages, Settings).
4. Optional: sign out and sign in with the client test account to view client job posting flow.

The app requires network access to https://guardr.co API endpoints.
Location and camera permissions are requested on first use of map/check-in and photo features.
```

Replace test credentials in Play Console — do not publish real user passwords in this file.
