# Vercel Deployment Guide with Real Backend

## 🚀 **Deployment Process**

### **Phase 1: Prepare Real Credentials** 

#### 1. Create Supabase Project
```bash
# Go to https://supabase.com
# 1. Click "New Project"
# 2. Choose organization 
# 3. Name: "beside-rental-platform"
# 4. Set strong database password
# 5. Select region closest to users
# 6. Wait 2-3 minutes for setup
```

#### 2. Get Supabase Credentials
```bash
# In Supabase Dashboard:
# Go to Settings → API
# Copy these 3 values:
# - Project URL (starts with https://xxx.supabase.co)
# - anon/public key (long string starting with eyJ...)
# - service_role key (longer string starting with eyJ...)
```

#### 3. Create Cloudinary Account
```bash
# Go to https://cloudinary.com
# 1. Sign up for free account
# 2. Verify email
# 3. Go to Console → Dashboard
# 4. Copy from "Account Details":
#    - Cloud Name
#    - API Key  
#    - API Secret
```

### **Phase 2: Deploy to Vercel**

#### 1. Push Code to GitHub
```bash
# Your current setup is PERFECT - keep demo values in code
git add .
git commit -m "Ready for deployment with demo env values"
git push origin main
```

#### 2. Connect to Vercel
```bash
# Option A: Vercel CLI
npm i -g vercel
vercel

# Option B: Vercel Dashboard
# 1. Go to vercel.com
# 2. "Import Git Repository"
# 3. Select your GitHub repo
# 4. Click "Deploy"
```

#### 3. **CRITICAL: Set Environment Variables in Vercel**

In Vercel Dashboard → Your Project → Settings → Environment Variables:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project-id.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ0eXAiOiJKV1QiLCJhb...` (your real key) | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ0eXAiOiJKV1QiLCJhb...` (your real service key) | Production |
| `CLOUDINARY_CLOUD_NAME` | `your_actual_cloud_name` | Production |
| `CLOUDINARY_API_KEY` | `123456789012345` (your real key) | Production |
| `CLOUDINARY_API_SECRET` | `your_actual_secret` | Production |

#### 4. Trigger Redeploy
```bash
# After adding environment variables, trigger new deployment:
# Vercel Dashboard → Deployments → "Redeploy"
# Or push any small change to trigger auto-deploy
```

### **Phase 3: Database Setup**

#### 1. Database Tables Auto-Creation
```bash
# Your app will automatically create tables on first run:
# - users
# - items  
# - bookings
# - reviews
# - unavailable_dates
```

#### 2. Storage Buckets (Manual Setup)
```bash
# In Supabase Dashboard → Storage:
# 1. Create bucket: "avatars" (public)
# 2. Create bucket: "item-images" (public)
# 3. Set appropriate policies for both
```

### **Phase 4: Verification**

#### Test Your Deployed App:
1. ✅ **Sign Up**: Create new account
2. ✅ **Profile**: Upload profile picture
3. ✅ **List Item**: Create item with photos
4. ✅ **Browse**: View items from database
5. ✅ **Booking**: Test booking system

## 🔒 **Security Best Practices**

### Environment Variables Strategy:
```bash
# ✅ GOOD: Demo values in code (safe to commit)
NEXT_PUBLIC_SUPABASE_URL=https://demo.supabase.co

# ❌ BAD: Real values in code (never commit)
NEXT_PUBLIC_SUPABASE_URL=https://real-project.supabase.co
```

### Production Environment Variables:
- ✅ Set in Vercel Dashboard only
- ✅ Never in your code files
- ✅ Different for dev/staging/prod
- ✅ Rotate keys regularly

## 🚨 **Common Deployment Issues**

### Issue 1: "Failed to fetch" errors
**Cause**: Wrong Supabase URL/keys in Vercel
**Fix**: Double-check environment variables in Vercel Dashboard

### Issue 2: Images not uploading
**Cause**: Wrong Cloudinary credentials
**Fix**: Verify API keys in Vercel settings

### Issue 3: Database connection fails
**Cause**: RLS policies not set up
**Fix**: Check Supabase → Authentication → RLS settings

### Issue 4: Build fails
**Cause**: Missing environment variables during build
**Fix**: Ensure all NEXT_PUBLIC_ vars are set in Vercel

## 📱 **Local Development vs Production**

### Local Development:
```bash
# .env.local (your current setup - PERFECT!)
NEXT_PUBLIC_SUPABASE_URL=https://demo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=demo_anon_key_placeholder
# ... other demo values
```

### Production (Vercel):
```bash
# Set via Vercel Dashboard only:
NEXT_PUBLIC_SUPABASE_URL=https://real-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1Qi...
# ... real values
```

## 🎯 **Quick Deployment Checklist**

- [ ] Code pushed to GitHub with demo values ✅
- [ ] Supabase project created
- [ ] Cloudinary account set up  
- [ ] Vercel project connected to GitHub
- [ ] Environment variables set in Vercel Dashboard
- [ ] App redeployed after env vars added
- [ ] Database tables auto-created on first run
- [ ] Storage buckets created manually
- [ ] Full functionality tested on live URL

## 🔗 **Useful Links**

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Cloudinary Console](https://cloudinary.com/console)

---

**Result**: Your app will be fully functional on Vercel with real backend services while keeping your code secure! 🚀
