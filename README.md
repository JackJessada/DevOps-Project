# Mail Chat & Job Tracker

An AI-powered job application command center that tracks your inbox, summarizes updates, and manages your career search journey automatically.

## Deployment Guide (Vercel + Neon)

### 1. Database Setup (Neon.tech)
1.  Create a free account at [Neon.tech](https://neon.tech/).
2.  Create a new project named `job-tracker`.
3.  Copy the **Connection String** (PostgreSQL URL).

### 2. Google OAuth Setup (GCP)
1.  Go to [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project.
3.  Configure **OAuth Consent Screen**:
    *   User Type: External.
    *   Scopes: `openid`, `email`, `profile`, and `https://www.googleapis.com/auth/gmail.readonly`.
4.  Create **OAuth 2.0 Client IDs**:
    *   Application Type: Web Application.
    *   **Authorized JavaScript origins**: `https://your-app.vercel.app`
    *   **Authorized redirect URIs**: `https://your-app.vercel.app/api/auth/callback/google`
5.  Save your `Client ID` and `Client Secret`.

### 3. Vercel Deployment
1.  Push your code to a private GitHub repository.
2.  Import the repository to [Vercel](https://vercel.com/).
3.  Set the **Root Directory** to `webapp`.
4.  Configure **Environment Variables**:
    *   `DATABASE_URL`: Your Neon connection string.
    *   `NEXTAUTH_SECRET`: A long random string (e.g., generated via `openssl rand -base64 32`).
    *   `GOOGLE_CLIENT_ID`: Your GCP Client ID.
    *   `GOOGLE_CLIENT_SECRET`: Your GCP Client Secret.
    *   `AI_PROVIDER`: `deepseek` (or chose: openai, anthropic, gemini).
    *   `DEEPSEEK_API_KEY`: Your AI API key.
    *   `OPENAI_API_KEY`: Your openAI API key.
    *   `ANTHROPIC_API_KEY`: Your Anthropic API key.
    *   `GEMINI_API_KEY`: Your Gemini API key.
5.  Click **Deploy**.

### 4. Initialize Production DB
Run the following command locally, pointing to your Neon DB URL:
```bash
# In webapp folder
DATABASE_URL="your_neon_url" npx prisma db push
```

---

## 🛠️ How to Use

###  1. Syncing Emails
After logging in, click **"Sync Gmail"** on the sidebar. The app will fetch recent job-related emails and store them securely in your database.

###  2. Daily Report
Click the **"Daily Update"** button. The AI will analyze emails from the **last 2 days** and provide a personalized summary in the chat, highlighting interviews and key next steps.

###  3. Job Tracker
Switch to the **"Job Tracker"** tab to manage your applications:
*   **Manual Add:** Add companies, positions, and interview dates manually.
*   **AI Auto-Track:** Click the AI icon (magnifying glass) to let the AI scan your emails and automatically update your statuses or add new applications.
*   **Calendar:** View all upcoming interviews in the integrated dark-mode calendar.

###  4. Language Toggle
Use the language switcher in the header to toggle between **Thai** and **English**. The AI will automatically respond in your selected language.

---

## 🤖 CI/CD (GitHub Actions)

The project includes a GitHub Action for Continuous Integration. Every time you push to `main` or open a PR, it will:
1.  Install dependencies.
2.  Generate the Prisma client.
3.  Run `npm run lint` to check for code quality.
4.  Run `npm run build` to ensure the project compiles successfully.

*(Configuration file located at `.github/workflows/ci.yml`)*
