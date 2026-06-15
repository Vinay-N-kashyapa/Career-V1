# Legacy Features Archive (Reserved for Version 2)

This folder contains features and pages from the previous version of PinIT Career OS that are **not active in the Genesis V1 Product Blueprint**.

Next.js App Router ignores any directory prefixed with an underscore (e.g. `_legacy`). Therefore, these files remain safely preserved in the codebase for development reference but are **completely excluded from active routing, static generation, and production builds**.

---

## Archived Features Directory

| Directory | Original Path | Purpose / Mapping in Genesis V1 |
| :--- | :--- | :--- |
| **`attendance`** | `/attendance` | Student class attendance. Omitted in V1 as Genesis is not structured as a school. |
| **`career-assets`**| `/career-assets` | AI Resume PDF formatting generator. Shifted to V2 planning. |
| **`career-builder`**| `/career-builder`| Manual SDE trajectory roadmap configurator. Replaced by the automated Quest Engine in V1. |
| **`consultant`** | `/consultant` | Consultant client portal. Omitted in V1 PRD. |
| **`exam`** | `/exam` | Timed coding exam environment. Integrated under the Quests/Challenges category in V1. |
| **`interview`** | `/interview` | Standalone technical mock interview simulator. Replaced by onboarding & quest voice assessments in V1. |
| **`leaderboard`** | `/leaderboard` | Public rank and streak leaderboard. Subsumed by the Reputation Profile in V1. |
| **`learn`** | `/learn` | Academic LMS course viewer. Omitted as Genesis is not an LMS/Course platform. |
| **`personality`** | `/personality` | Standalone personality questionnaire. Integrated into Onboarding Discovery (SCREEN_04) in V1. |
| **`pricing`** | `/pricing` | Purchase and pricing tiers page. Shifted to V2 planning. |
| **`qr-confirm`** / **`qr-login`** | `/qr-confirm` / `/qr-login` | Mobile QR-code sync login services. Shifted to V2 planning. |
| **`resume`** | `/resume` | ATS resume builder form. Portfolio Engine and profile uploads handle this in V1. |
| **`sentinel`** | `/sentinel` | Document cryptographic fingerprinting and verification. Verification Engine handles this in V1. |
| **`teacher`** | `/teacher` | Teacher/Instructor portal. Omitted in V1 PRD. |
| **`trust`** | `/trust` | Standalone Trust score dashboard. Reputation profile displays this directly in V1. |

---

## How to Restore a Feature for Version 2

If you decide to re-integrate any of these features in the future, simply move the respective folder back to the root `src/app/` directory:

```bash
# Example: Restoring the Mock Interview simulator
mv src/app/_legacy/interview src/app/interview
```

After moving, restart your Next.js local development server (`npm run dev`) and the route `/interview` will instantly become active again.
