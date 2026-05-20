# Global Branding & Metadata Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand "Job Tracker" to "Mail Chat" and establish Indigo theme.

**Architecture:** Update Next.js metadata and Tailwind 4 global variables.

**Tech Stack:** Next.js 16, Tailwind 4.

---

### Task 1: Update Metadata

**Files:**
- Modify: `webapp/src/app/layout.tsx`

- [ ] **Step 1: Update metadata object**

```typescript
export const metadata: Metadata = {
  title: "Mail Chat",
  description: "Chat with your Inbox. Master your Career.",
};
```

- [ ] **Step 2: Verify build**
Run: `npm run build` in `webapp`
Expected: Success

### Task 2: Add Indigo Theme

**Files:**
- Modify: `webapp/src/app/globals.css`

- [ ] **Step 1: Define primary color variables**

```css
:root {
  --background: #ffffff;
  --foreground: #171717;
  --primary: #4f46e5;
  --primary-foreground: #ffffff;
}
```

- [ ] **Step 2: Map to Tailwind 4 theme**

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

### Task 3: Commit Changes

- [ ] **Step 1: Commit**

```bash
git add webapp/src/app/layout.tsx webapp/src/app/globals.css docs/superpowers/specs/2026-05-10-mail-chat-branding-design.md
git commit -m "feat(branding): update metadata and add indigo theme"
```
