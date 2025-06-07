# Deployment Guide

This guide covers deploying the Beside Rental Platform to various hosting providers.

## 🚀 Quick Deploy to Vercel (Recommended)

### One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/beside-rental-platform)

### Manual Deploy

1. **Fork this repository**
2. **Connect to Vercel**
   ```bash
   npm i -g vercel
   vercel login
   vercel
   ```
3. **Set environment variables** in Vercel dashboard
4. **Deploy**
   ```bash
   vercel --prod
   ```

## 🔧 Environment Variables Setup

### Required Variables

Copy these to your hosting platform's environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Getting Credentials

#### Supabase Setup
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy the URL and keys

#### Cloudinary Setup
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Go to Console → Settings
3. Copy Cloud Name, API Key, and API Secret

## 🌐 Platform-Specific Deployments

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=.next
```

### Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

### Docker Deployment
```bash
# Build image
docker build -t beside-rental-platform .

# Run container
docker run -p 3000:3000 --env-file .env.local beside-rental-platform
```

### Digital Ocean App Platform
1. Connect your GitHub repository
2. Set environment variables
3. Deploy using their web interface

## 🗄 Database Setup

### Supabase Configuration

The app will automatically set up required tables and policies. For manual setup:

1. **Create tables**:
   - `users` - User profiles
   - `items` - Rental listings
   - `bookings` - Booking records
   - `reviews` - User reviews
   - `unavailable_dates` - Availability management

2. **Set up storage buckets**:
   - `avatars` - Profile pictures
   - `item-images` - Item photos

3. **Configure RLS policies** for security

### Database Schema
```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  location TEXT,
  avatar TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Items table  
CREATE TABLE items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  location TEXT NOT NULL,
  owner_email TEXT REFERENCES users(email),
  images TEXT[],
  booked_dates TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Additional tables...
```

## 🔒 Security Checklist

### Pre-Deployment
- [ ] Environment variables are set correctly
- [ ] No secrets in code
- [ ] All test files removed
- [ ] HTTPS configured
- [ ] Security headers enabled

### Post-Deployment
- [ ] Test all major features
- [ ] Verify image uploads work
- [ ] Check booking system
- [ ] Test authentication flow
- [ ] Monitor error logs

## 📊 Performance Optimization

### Build Optimization
```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer
```

### Image Optimization
- Cloudinary handles automatic optimization
- WebP/AVIF formats enabled
- Lazy loading implemented

### Caching Strategy
- Static assets cached at CDN
- API responses cached appropriately
- Database queries optimized

## 🔍 Monitoring & Analytics

### Error Tracking
- Set up error monitoring (Sentry recommended)
- Monitor API endpoints
- Track user actions

### Performance Monitoring
- Core Web Vitals tracking
- Database query performance
- Image loading times

## 🚨 Troubleshooting

### Common Issues

**Build Fails**
- Check environment variables
- Verify all dependencies installed
- Check for TypeScript errors

**Images Not Loading**
- Verify Cloudinary credentials
- Check image URLs
- Confirm storage bucket permissions

**Authentication Issues**
- Check Supabase configuration
- Verify RLS policies
- Test email settings

**Database Errors**
- Check Supabase connection
- Verify table schemas
- Check RLS policies

### Debug Commands
```bash
# Check environment
npm run build 2>&1 | grep -i error

# Test database connection
npm run dev
# Visit /api/test endpoint

# Check image upload
# Test upload functionality in app
```

## 📞 Support

For deployment issues:
1. Check this guide first
2. Review error logs
3. Open an issue on GitHub
4. Contact support team

---

🎉 **Congratulations!** Your Beside Rental Platform is now deployed and ready for users!
