# Backend Setup Guide

## Current Status: ⚠️ DEMO MODE
The project is currently running with placeholder credentials. Follow this guide to connect to real backend services.

## 1. 🗄️ Supabase Setup (Database & Auth)

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Choose organization and name your project
4. Set a secure database password
5. Select region closest to your users
6. Wait for project creation (2-3 minutes)

### Step 2: Get Credentials
1. Go to Settings → API in your Supabase dashboard
2. Copy these values:
   - Project URL
   - Anon (public) key
   - Service role (secret) key

### Step 3: Database Setup
The app will automatically create required tables on first run, including:
- `users` - User profiles
- `items` - Rental listings  
- `bookings` - Booking records
- `reviews` - User reviews
- `unavailable_dates` - Availability management

## 2. 📷 Cloudinary Setup (Image Storage)

### Step 1: Create Account
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Verify your email
3. Complete account setup

### Step 2: Get Credentials
1. Go to Console → Dashboard
2. Copy these values from the "Account Details" section:
   - Cloud Name
   - API Key
   - API Secret

## 3. 🔐 Update Environment Variables

Edit `.env.local` and replace demo values with your real credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key

# Cloudinary Configuration  
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 4. 🧪 Test the Connection

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Test these features:
   - ✅ User signup/login
   - ✅ Create new item listing
   - ✅ Upload images
   - ✅ Browse items
   - ✅ Make bookings

## 5. 🔒 Security Setup (Supabase)

### Row Level Security (RLS)
The app automatically configures security policies, but verify:

1. Go to Database → Tables in Supabase
2. Ensure RLS is enabled on all tables
3. Check that policies exist for each table

### Storage Buckets
Create these storage buckets in Supabase:
1. `avatars` - For user profile pictures
2. `item-images` - For item listing photos

## 6. 📊 Verify Everything Works

### Database Check:
- Tables are created automatically
- Data can be viewed in Supabase Table Editor
- Authentication works through Supabase Auth

### Storage Check:
- Images upload to Cloudinary
- URLs are saved to database
- Images display correctly in app

## 🚨 Security Notes

- Never commit `.env.local` to version control
- Use different credentials for development/production
- Rotate API keys regularly
- Monitor usage in both Supabase and Cloudinary dashboards

## 📞 Support

- Supabase Docs: https://supabase.com/docs
- Cloudinary Docs: https://cloudinary.com/documentation
- Project Issues: Check GitHub repository

---

**Once configured, your project will be fully connected to production-ready backend services!**
