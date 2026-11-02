# Cookie policy — Hub Studenti

> **Draft technical guide — not legal advice.** Have it reviewed by a qualified lawyer or your DPO before you open the service to the public.
> References: Directive 2002/58/EC (ePrivacy) art. 5(3) · art. 122 of the Italian Privacy Code (D.Lgs. 196/2003) · the Italian Garante's *Guidelines on cookies and other tracking tools* (10 June 2021). Verify the current text of each before relying on it.

## In short

Hub Studenti sets **one cookie only, a strictly necessary first-party session cookie (`hub_sid`)**. It does **not** use analytics, advertising, profiling or social-media cookies, makes **no requests to third parties**, serves its fonts from its own server, and does **not** use `localStorage` / `sessionStorage` for tracking.

Because the only cookie is a technical one that is strictly necessary to provide the service the user asked for (staying logged in), it falls under the exemption in ePrivacy art. 5(3) and, in Italy, the Garante's 2021 guidelines on technical cookies. **No consent banner is needed.** Information alone is required, and it is given in the privacy notice (see `PRIVACY-POLICY.md` and `src/frontend/privacy.html`).

This conclusion is valid only while the facts below stay true. See "What changes if you add something".

## Cookie inventory

| Name | Type | Purpose | Lifetime | Content | Third party |
|---|---|---|---|---|---|
| `hub_sid` | Strictly necessary, session / authentication | Recognise the logged-in user between requests | 14 days by default (`SESSIONE_GIORNI`); deleted on logout | A random token; the server stores only its SHA-256 hash | No (first party only) |

Attributes, as implemented in `src/backend/security.js`: `Path=/`, `HttpOnly` (not readable by JavaScript), `SameSite=Lax` (not sent by other sites on requests that change data), `Max-Age` equal to the session length, and `Secure` whenever `BASE_URL` starts with `https://`. In production the site must run on HTTPS on the operator's own domain, so the cookie is always `Secure`. On logout the cookie is cleared with `Max-Age=0`.

The cookie is not used to recognise returning visitors who are not logged in, and nothing is set before login.

## Other tools that could be seen as "tracking"

| Item | Situation |
|---|---|
| Fonts | Self-hosted on the same server (`src/frontend/fonts`, SIL OFL licence). No request to Google Fonts or any CDN, so visitors' IP addresses are not sent to third parties |
| Scripts, images, CSS | All served locally. The Content-Security-Policy (`default-src 'self'; font-src 'self'; connect-src 'self'`) prevents loading external resources |
| Analytics / statistics | None |
| Advertising, pixels, social widgets | None. Sponsorship, if any, must be shown as a plain image or text served locally, with no third-party tags |
| `localStorage` / `sessionStorage` | Not used for tracking or profiling. If a future UI preference is stored there (for example theme), it must be purely functional, set at the user's request, and listed here |
| Referrer | `Referrer-Policy: no-referrer`, so outbound links do not leak the page address |
| Web server / reverse-proxy logs | May record IP address and time for security; retention at most 14 days (see privacy notice). Logs are not cookies, but they are personal data and are covered in the privacy notice |

## What changes if you add something

Re-check this document, the privacy notice and the processing register **before** shipping any of the following.

- **Third-party analytics or any non-technical cookie or identifier** (advertising, profiling, social plug-ins, A/B testing tools that identify users). Prior, informed, granular consent is required before anything is set or read on the device. Refusing must be as easy as accepting, there must be no cookie wall and no "scroll equals consent", and the choice must be recorded and revocable. The privacy notice and register must be updated, and the DPIA revisited. For a service used by teenagers this is strongly discouraged.
- **First-party aggregate statistics.** The Garante's 2021 guidelines allow analytics cookies to be treated as technical only under strict conditions (aggregated data, limited to the site's own optimisation, IP masking, no cross-referencing with other data, no third party able to enrich the data, and similar). Check the exact conditions in the current guidelines with your DPO. Cookie-less, server-side aggregate counts without identifiers are the safest option.
- **Online payments (hosted subscriptions, book commission).** Most payment providers set their own cookies and scripts or load a hosted checkout. Strictly necessary fraud-prevention and checkout cookies may be exempt, but the provider's tools often go beyond that. Review the provider's documentation, update the CSP, add the provider as a processor or controller as appropriate, and update the notice. A redirect to a provider's own hosted page is usually cleaner than embedding its scripts.
- **Embedded video, maps, chat or support widgets.** These load third-party resources and often cookies; the CSP would block them until changed. Prefer a plain link.
- **Remember-me / "stay logged in" beyond 14 days, or a separate preference cookie.** A functional preference chosen by the user is normally technical but must be listed here; a persistent identifier with other uses is not.

## Periodic check

Open the site with the browser developer tools (F12 → Network / Application → Cookies). You must see only requests to your own domain and only the `hub_sid` cookie, and only after login. Repeat after every front-end change and before each release.
