# Deployment Guide - Vercel

## 🚀 Quick Deploy

### Option 1: Vercel CLI (Command Line)

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Login to Vercel:**
```bash
vercel login
```

3. **Deploy:**
```bash
vercel
```

4. **Deploy to Production:**
```bash
vercel --prod
```

---

### Option 2: Vercel Web Interface (Easier)

1. **Push your code to GitHub:**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Go to [vercel.com](https://vercel.com)**

3. **Click "Add New Project"**

4. **Import your GitHub repository**

5. **Vercel auto-detects Vite config - just click "Deploy"**

6. **Done!** Your app will be live at `your-project.vercel.app`

---

## ⚙️ Configuration

Your project is already configured with `vercel.json`:

- ✅ Build command: `npm run build`
- ✅ Output directory: `dist`
- ✅ Service Worker headers configured
- ✅ Security headers enabled
- ✅ SPA routing handled

---

## 🔧 Environment Variables (Optional)

If you add any API keys or secrets later:

1. Go to your project on Vercel
2. Settings → Environment Variables
3. Add your variables
4. Redeploy

---

## 📱 Custom Domain (Optional)

1. Go to your project on Vercel
2. Settings → Domains
3. Add your custom domain
4. Follow DNS setup instructions

---

## 🔄 Automatic Deployments

Once connected to GitHub:
- ✅ Every push to `main` = automatic production deployment
- ✅ Every pull request = automatic preview deployment
- ✅ Instant rollback if needed

---

## 🎯 First Time Setup

**If this is your first Vercel deployment:**

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login (opens browser)
vercel login

# 3. Deploy (follow prompts)
vercel

# Prompts will ask:
# - Set up and deploy? → Yes
# - Which scope? → Your account
# - Link to existing project? → No
# - What's your project name? → audio-visual-effects (or your choice)
# - In which directory is your code? → ./
# - Override settings? → No

# 4. Visit the URL it gives you!
```

---

## ✅ Post-Deployment Checklist

- [ ] Test all 20 visual modes
- [ ] Test PWA installation
- [ ] Test audio file upload
- [ ] Test video recording
- [ ] Test performance overlay (Shift+P)
- [ ] Test on mobile device
- [ ] Test offline mode (disable network)

---

## 🐛 Troubleshooting

**Service Worker not working?**
- Clear browser cache
- Check HTTPS (required for service workers)
- Check browser console for errors

**Audio not working?**
- Check microphone permissions
- Try audio file upload instead
- Ensure HTTPS (required for getUserMedia)

**Build failing?**
- Run `npm run build` locally first
- Check for TypeScript errors
- Ensure all dependencies installed

---

## 📊 Vercel Features You Get

- ✅ **Global CDN** - Fast worldwide
- ✅ **Automatic HTTPS** - Free SSL certificate
- ✅ **Instant Rollbacks** - One-click undo
- ✅ **Preview Deployments** - Test before production
- ✅ **Analytics** - Built-in (optional upgrade)
- ✅ **99.99% Uptime** - Reliable hosting

---

## 💰 Pricing

**Hobby Plan (Free):**
- Unlimited projects
- 100GB bandwidth/month
- Automatic HTTPS
- Custom domains
- **Perfect for this project!**

---

## 🎉 Next Steps After Deployment

1. Share your live URL!
2. Test PWA installation on mobile
3. Add custom domain (optional)
4. Monitor performance with Vercel analytics
5. Set up GitHub integration for auto-deploys

---

**Your app will be live at:** `https://your-project-name.vercel.app`

**Deployment typically takes:** 1-2 minutes ⚡

