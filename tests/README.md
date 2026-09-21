# Mini App regression checks

From this directory: `npm install`, `npx playwright install chromium`, then `npm test`.
Optionally set `PLAYWRIGHT_CHANNEL=msedge` to use an installed Edge browser.

The test page uses the real HTML/functions with startup and external scripts removed. All requests are intercepted; API replies use synthetic fixtures. Tests do not access Telegram, real driver cards, GPS, or Cloudinary.

Twelve checks cover GPS/tariff retention, explicit GPS clearing, upload failures and limits, stale monthly/service responses, service mileage display, zero-mileage reports, login guidance, date validation, note privacy controls, literal rendering of user text, completion, drafts, retry IDs and changed assignments. Screenshots and JSON results are local outputs, not committed.

The matching server change must deploy first. Notes persist server-side only after a successful save; unsaved drafts remain in memory for the current page session. Vehicle-note identity is the normalized plate; plate replacement requires an explicit server-side migration. Owner notes are internal unless explicitly shared. Previous tenants' notes are available only to administrators and their original author while authorized for that car.
