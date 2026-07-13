# Google Play Store — Organization Developer Account Requirements

> For publishing the **Rutec** system under the company's Play Store account.
> Account type: **Organization** (not Personal).

---

## Summary (the short version)

To open the account you need: **D-U-N-S number** + **company legal details (matching SSM)** + a **government photo ID** + a **company Google account** + **USD $25** one-time fee.

⚠️ The **D-U-N-S number is the slow part (up to 30 days)** — start it first.

---

## 1. D-U-N-S Number — *mandatory for organizations*

- A **9-digit D-U-N-S number** from Dun & Bradstreet is **required** for all Organization accounts.
- Check whether the company already has one before requesting a new one.
- If not, request it **free** from Dun & Bradstreet.
- **Processing can take up to 30 days** — this is the main bottleneck, so **start it first**.
- The business **name and address registered with D&B must exactly match** what you enter in
  Google (and your SSM registration). Mismatches are the #1 cause of rejected verification.

Malaysia **is supported** by Dun & Bradstreet, so a D-U-N-S can be obtained directly — no
Singapore/foreign-incorporation workaround needed. If D&B genuinely cannot issue one, Google
offers an **alternative verification** path (only for orgs that cannot get a D-U-N-S).

---

## 2. Business Information Google Asks For

| Field | Notes |
|---|---|
| **Developer name** | Public name shown on Play (can differ from legal name) |
| **D-U-N-S number** | See section 1 |
| **Organization name + address** | Must match D&B; verified via Google Payments profile |
| **Organization phone number** | OTP verification |
| **Organization website** | Required — must be live before applying |
| **Contact name / email / phone** | For Google to reach you (internal, not public) |
| **Developer email + phone** | **Shown publicly** on your Play profile |

---

## 3. Identity Verification

- **Government-issued photo ID** (IC / passport) of the person creating the account.
- Organization name + address verified through the linked **Google Payments profile**.
- Phone and email confirmed via **one-time passwords (OTP)**.

---

## 4. Registration Fee

- **One-time USD $25**, paid by credit/debit card.

---

## 5. Signup Flow (order of steps)

1. Sign in with the **company Google account** that will own the developer profile.
2. Select **Organization** account type.
3. Enter the **D-U-N-S number** and business details.
4. Complete **identity + phone/email verification** (OTP).
5. Pay the **$25** registration fee.
6. Google reviews and verifies (a few days up to a couple of weeks).

---

## Recommendations for Rutec

1. **Start the D-U-N-S request today** — everything else waits on it.
2. **Use a dedicated company Google account** to own the console (e.g. `dev@yourcompany.com`),
   **not** a personal Gmail. Whoever owns that account owns Rutec's listing — losing it is a
   serious problem later.
3. Keep **legal name + address identical** across **SSM → D&B → Google Payments**.
4. Have the **company website live** before applying (required field; Google checks it).

---

## Later — Publishing-Time Requirements (not needed to open the account)

Before Rutec can actually go live on the store, you will also need:

- **Privacy policy URL**
- App **content rating** + **Data safety** declarations
- A **signed app bundle** (upload/signing key)
- Store listing assets (icon, screenshots, description)

These are publishing-time requirements, handled after the account is verified.

---

## Sources

- [Required information to create a Play Console developer account](https://support.google.com/googleplay/android-developer/answer/13628312?hl=en)
- [Choose a developer account type](https://support.google.com/googleplay/android-developer/answer/13634885?hl=en)
- [Play Console Requirements](https://support.google.com/googleplay/android-developer/answer/10788890?hl=en)
