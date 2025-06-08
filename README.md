# Beside - Rental Platform

A modern, feature-rich rental platform built with Next.js, Supabase, and Cloudinary. Users can list items for rent, browse available items, manage bookings, and handle transactions seamlessly.

## 🌐 Live Demo

**🚀 [View Live Application](https://beside-rental-platform-mxcqgwul3.vercel.app)**

Experience the platform in action! The live demo showcases all features including user authentication, item listings, booking system, and more.

## 🚀 Features

### Core Functionality
- **User Authentication**: Secure signup/login with email verification
- **Item Listings**: Create, edit, and manage rental item listings
- **Advanced Search**: Filter by category, location, price range, and availability
- **Booking System**: Real-time booking calendar with availability management
- **Image Management**: Cloudinary-powered image upload with compression
- **User Profiles**: Complete profile management with avatar uploads
- **Responsive Design**: Mobile-first design with modern UI components

### Advanced Features
- **Real-time Calendar**: Interactive booking calendar with date selection
- **Review System**: Rate and review rental experiences
- **Notification System**: Email notifications for bookings and updates
- **Privacy Controls**: Manage booking visibility and personal information
- **Dashboard Analytics**: Track views, earnings, and rental statistics

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Image Storage**: Cloudinary
- **Deployment**: Vercel (recommended)

## 📋 Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm
- Supabase account
- Cloudinary account

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd beside-rental-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env.local` and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```

4. **Configure Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Settings > API to get your credentials
   - Set up the database schema (see Database Setup section)

5. **Configure Cloudinary**
   - Sign up at [cloudinary.com](https://cloudinary.com)
   - Get your cloud name, API key, and API secret from the console

6. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄 Database Setup

The application requires the following Supabase tables and configurations:

### Required Tables
- `users` - User profiles and authentication data
- `items` - Rental item listings
- `bookings` - Booking records and requests
- `reviews` - User reviews and ratings
- `unavailable_dates` - Item availability management

### Storage Buckets
- `avatars` - User profile pictures
- `item-images` - Item listing photos

### Row Level Security (RLS)
All tables have RLS enabled with appropriate policies for data security.

> **Note**: Database schema and policies are automatically configured when you run the application for the first time.

## 🔐 Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Connect to Vercel**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Set environment variables**
   Add all environment variables in the Vercel dashboard

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Deploy to Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify
- Google Cloud Run

## 📱 Features Overview

### For Renters
- Browse available items with advanced filtering
- View detailed item information and photos
- Check real-time availability
- Book items with secure payment
- Manage booking requests
- Leave reviews and ratings

### For Owners
- List items with detailed descriptions
- Upload and manage item photos
- Set pricing and availability
- Manage booking requests
- Track earnings and analytics
- Respond to reviews

### Admin Features
- User management
- Content moderation
- Analytics dashboard
- System monitoring

## 🔧 Development

### Project Structure
```
├── app/                    # Next.js 13+ app directory
│   ├── (auth)/            # Authentication pages
│   ├── api/               # API routes
│   ├── items/             # Item-related pages
│   └── ...                # Other pages
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and configurations
├── public/               # Static assets
└── styles/               # Global styles
```

### Key Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Contact the development team

## 🔄 Version History

- **v1.0.0** - Initial release with core rental functionality
- Enhanced booking system and user experience
- Advanced search and filtering capabilities
- Real-time notifications and updates

---

Built with ❤️ using Next.js and Supabase
