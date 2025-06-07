# 🚀 Deployment Environment Setup Guide

## 📋 Current Status
❌ **Project has DEMO credentials** - Won't work when deployed to Vercel
✅ **Solution**: Set up real backend services and configure environment variables

---

## 🗄️ Step 1: Set Up Supabase (Database & Auth)

### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/login with GitHub account
3. Click **"New Project"**
4. Fill in:
   - **Name**: `beside-rental-platform`
   - **Organization**: Your account
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users (e.g., `ap-south-1` for India)
5. Click **"Create new project"** (takes 2-3 minutes)

### Get Supabase Credentials
1. Once project is ready, go to **Settings → API**
2. Copy these values:
   ```
   Project URL: https://[your-project-id].supabase.co
   Anon key: eyJ... (public key, safe to expose)
   Service role key: eyJ... (secret key, never expose publicly)
   ```

### Database Setup
The app will automatically create these tables on first run:
- ✅ `users` - User profiles
- ✅ `items` - Rental listings
- ✅ `bookings` - Booking records
- ✅ `reviews` - User reviews
- ✅ `unavailable_dates` - Availability management

---

## 📷 Step 2: Set Up Cloudinary (Image Storage)

### Create Cloudinary Account
1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up with email or GitHub
3. Verify email and complete setup

### Get Cloudinary Credentials
1. Go to **Console → Dashboard**
2. In the **Account Details** section, copy:
   ```
   Cloud Name: your_cloud_name
   API Key: 123456789012345
   API Secret: your_secret_key_here
   ```

---

## 🌐 Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click **"New Project"**
4. Import your GitHub repository
5. In **Environment Variables** section, add:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

6. Click **"Deploy"**

### Option B: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy project
vercel

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add CLOUDINARY_CLOUD_NAME
vercel env add CLOUDINARY_API_KEY
vercel env add CLOUDINARY_API_SECRET

# Redeploy with new environment variables
vercel --prod
```

---

## 🔒 Step 4: Security Best Practices

### Environment Variable Safety
- ✅ **NEXT_PUBLIC_*** variables are safe (exposed to browser)
- ❌ **SERVICE_ROLE_KEY** and **API_SECRET** must stay secret
- ✅ Vercel automatically encrypts environment variables

### Local Development
Keep your `.env.local` for local development:
```bash
# For local development only
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

### Git Safety
- ✅ `.env.local` is already in `.gitignore`
- ✅ Never commit real credentials to GitHub
- ✅ Use different credentials for dev/production if needed

---

## 🧪 Step 5: Test Your Deployment

### After Deployment, Test These Features:
1. **User Authentication**
   - Sign up with new account
   - Login/logout functionality
   - Profile creation

2. **Item Management**
   - Create new item listing
   - Upload images (should go to Cloudinary)
   - Browse items

3. **Booking System**
   - Make a test booking
   - Check booking calendar
   - View booking history

4. **Database Verification**
   - Check Supabase dashboard for data
   - Verify tables are created
   - Check if images are uploaded to Cloudinary

---

## 🚨 Troubleshooting

### Common Issues:

**❌ "Failed to fetch" errors**
- Check if SUPABASE_URL is correct
- Verify anon key is properly set

**❌ Image upload fails**
- Verify Cloudinary credentials
- Check API key permissions

**❌ Database connection issues**
- Ensure service role key is set correctly
- Check Supabase project is active

**❌ Build fails on Vercel**
- Check all environment variables are set
- Verify no TypeScript errors

---

## 📞 Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Cloudinary Docs**: https://cloudinary.com/documentation
- **Vercel Docs**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment

---

## ✅ Deployment Checklist

- [ ] Created Supabase project
- [ ] Got Supabase credentials
- [ ] Created Cloudinary account
- [ ] Got Cloudinary credentials
- [ ] Updated environment variables in Vercel
- [ ] Deployed to Vercel
- [ ] Tested user authentication
- [ ] Tested item creation
- [ ] Tested image upload
- [ ] Verified database tables created
- [ ] Checked all features work

**Once completed, your rental platform will be fully functional with real backend services!**
