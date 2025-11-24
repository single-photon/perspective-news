# Deployment Instructions - Automated News Updates

Your app is now configured to automatically update news content 4 times per day using GitHub Actions.

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it something like `perspective-news`
3. **Do NOT** initialize with README, .gitignore, or license (we already have these)
4. Copy the repository URL (e.g., `https://github.com/yourusername/perspective-news.git`)

## Step 2: Push Code to GitHub

Run these commands in your terminal:

```bash
git remote add origin YOUR_REPO_URL_HERE
git branch -M main
git push -u origin main
```

Replace `YOUR_REPO_URL_HERE` with your actual repository URL.

## Step 3: Add GitHub Secret for API Key

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `GEMINI_API_KEY`
5. Value: Paste your Gemini API key
6. Click **Add secret**

## Step 4: Deploy to Vercel

### Option A: Via Vercel Dashboard (Easiest)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Vercel will auto-detect it's a Vite project
5. Click **Deploy**

### Option B: Via Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

Follow the prompts to deploy.

## Step 5: Enable Auto-Deploy on GitHub Push

In Vercel:
1. Go to your project settings
2. Under **Git** → **Deploy Hooks**, verify auto-deploy is enabled
3. Now whenever GitHub Actions pushes updates, Vercel will automatically redeploy

## Step 6: Verify Automation

### Test the GitHub Action Manually

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Click **Update News Content** workflow
4. Click **Run workflow** → **Run workflow**
5. Wait for it to complete (should take ~1-2 minutes)
6. Check that `public/news-data.json` was updated in your repo
7. Verify Vercel auto-deployed the changes

### Schedule

The workflow will automatically run at:
- **12:00 AM UTC** (7:00 PM EST / 4:00 PM PST)
- **6:00 AM UTC** (1:00 AM EST / 10:00 PM PST)
- **12:00 PM UTC** (7:00 AM EST / 4:00 AM PST)
- **6:00 PM UTC** (1:00 PM EST / 10:00 AM PST)

## Monitoring

- **GitHub Actions**: Check the Actions tab to see workflow runs and logs
- **Vercel**: Check the Deployments tab to see auto-deployments
- **Live Site**: Visit your site and check the "Last Updated" timestamp

## Troubleshooting

### Workflow Fails
- Check GitHub Actions logs for errors
- Verify `GEMINI_API_KEY` secret is set correctly
- Ensure API key has sufficient quota

### Vercel Doesn't Auto-Deploy
- Check Vercel project settings → Git integration
- Verify the repository is connected
- Check Vercel deployment logs

## Cost Estimate

- **GitHub Actions**: Free (2,000 minutes/month, you'll use ~8 minutes/day)
- **Vercel**: Free tier (100GB bandwidth, unlimited deployments)
- **Gemini API**: ~24 API calls/day (6 stories × 6 styles × 4 updates = 144 calls/day)

You're well within free tier limits! 🎉
