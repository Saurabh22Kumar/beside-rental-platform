# Quick Start Guide

Get your Beside Rental Platform running in 5 minutes!

## 🚀 One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/beside-rental-platform&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,CLOUDINARY_CLOUD_NAME,CLOUDINARY_API_KEY,CLOUDINARY_API_SECRET)

## 🔧 Local Development

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/beside-rental-platform.git
cd beside-rental-platform

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Start development server
npm run dev
```

## 🗄 Quick Database Setup

1. Create a [Supabase](https://supabase.com) account
2. Create a new project
3. The app will automatically set up tables on first run
4. Go to Settings → API to get your credentials

## 📱 Quick Cloudinary Setup

1. Sign up at [Cloudinary](https://cloudinary.com)
2. Go to Console to get your credentials
3. Add them to your .env.local file

## 🎯 First Steps After Setup

1. **Visit the app** at http://localhost:3000
2. **Sign up** for a new account
3. **Complete your profile** with a photo
4. **List your first item** using the "List New Item" button
5. **Test the booking system** by creating a test booking

## 🔗 Useful Links

- [Full Documentation](./README.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Contributing](./CONTRIBUTING.md)
- [Security Policy](./SECURITY.md)

## 🆘 Need Help?

- Check the [troubleshooting section](./DEPLOYMENT.md#troubleshooting)
- Open an issue on GitHub
- Review the documentation

---

Happy renting! 🏠✨
