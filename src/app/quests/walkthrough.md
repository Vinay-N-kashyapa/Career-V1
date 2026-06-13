# Walkthrough: Dynamic Quest Roadmap Builder & Real-time Portfolio Sync

This walkthrough documents the dynamic stages/modules quest tree, category prompt instructions, real-time portfolio achievements sync, and build validation implemented to complete the Career Roadmap experience.

## Changes Completed

### 1. Mock API Category Prompt & Normalizer
* **LLM Prompts Updated**: Modified [client.ts](file:///C:/Users/vinay/Desktop/project/verify-pinit/firebase-deploy/src/lib/api/client.ts) inside `/api/career-builder/generate` to instruct the LLM to explicitly include a `category: 'learning' | 'exam' | 'assignment'` property on every generated quest.
* **Quest Interface**: Declared the `category` field in the Quest TypeScript interface sent inside the system instructions.
* **Context Normalization Layer**: Updated `generateFusedRoadmap` inside [CareerOSContext.tsx](file:///C:/Users/vinay/Desktop/project/verify-pinit/firebase-deploy/src/lib/context/CareerOSContext.tsx) to automatically map and enforce valid quest categories based on characteristics (`type`, `requiresAvatar`, or name patterns) to prevent raw API responses from missing category fields.
* **Career Builder Fallbacks**: Updated `handleGenerateRoadmap` inside [CareerBuilderClient.tsx](file:///C:/Users/vinay/Desktop/project/verify-pinit/firebase-deploy/src/app/career-builder/CareerBuilderClient.tsx) with the same normalization guarantees.

### 2. Quests Page Modules & Stage Progress
* **Dynamic Modules Render**: Replaced the static flat registry mapping in [page.tsx](file:///C:/Users/vinay/Desktop/project/verify-pinit/firebase-deploy/src/app/quests/page.tsx) with a nested stages/modules roadmap rendered from `localStorage` under `pinit_${userId}_roadmap_modules` (fused via onboarding goals and resume details).
* **Logical Fallback Grouping**: Added fallback modules rendering (grouped logically into Beginner, Intermediate, and Advanced stages) if local storage modules are not yet generated.
* **Quest Category Badges**: Styled quest links with correct badges matching their design language:
  * `🎓 Learning Class` for proctored socratic lectures.
  * `📝 Coding Exam` for timed coding assessments.
  * `💻 Assignment` for coding sandboxes.
* **Stage Progress Bars**: Rendered completion progress metrics (e.g. `1 / 2 Quests Completed`) alongside dynamic week estimations and difficulty levels for each stage container.

### 3. Dashboard Portfolio Sync
* **Real-time Achievements Integration**: Updated [page.tsx](file:///C:/Users/vinay/Desktop/project/verify-pinit/firebase-deploy/src/app/dashboard/page.tsx) to listen to `completedQuests` and query active modules/registries.
* **Portfolio Feed Sync**: Merged completed quests into the `verifiedAchievements` array dynamically, rendering them instantly in the dashboard portfolio widget with correct category icons (`🎓`, `📝`, or `💻`) and colors.

### 4. Build Validation
* **Successful Compilation**: Cleaned NextJS cache directory (`.next`) and executed custom production build pipeline. Confirmed zero TypeScript compiling, Webpack, or routing export failures.

---

## Verification Plan

### Automated Verification
* Run the custom clean build command:
  ```powershell
  npm run build
  ```
  * **Result**: `--- Build completed successfully! ---` (Zero webpack errors / exit code 0).

### Manual Verification Instructions
1. **Onboarding & Resume Sync**:
   * Complete onboarding questionnaire, leaving the roadmap blank (Quests and Career Builder tabs locked).
   * Upload or build a resume in **Resume Builder** to unlock the Career Builder tab.
2. **Roadmap Generation**:
   * Navigate to **Career Builder**, click **Generate Custom Learning Path**.
   * Note the background generation. When complete, the roadmap is active (Quests tab unlocks).
3. **Quests Stages View**:
   * Open the **Quests** tab. Note that the quests are beautifully grouped by **Stage 1**, **Stage 2**, and **Stage 3** container modules.
   * Verify that each quest card renders a category badge (e.g., `🎓 Learning Class` or `💻 Assignment`).
4. **Quest Sandbox & Completion**:
   * Click a quest card to complete the exercises.
   * Assert all unit tests pass, click complete, and return to the dashboard.
5. **Dashboard Portfolio Verification**:
   * Look at the **Verified Credentials / Achievements** panel on the **Dashboard**.
   * Verify that the completed quest is listed as verified evidence with its correct title, stage type, and icon.
