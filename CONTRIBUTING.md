# Contributing to Beside Rental Platform

We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## Pull Requests

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Getting Started

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/beside-rental-platform.git
   cd beside-rental-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Fill in your credentials
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Code Style

* Use TypeScript for all new code
* Follow the existing code style
* Run `npm run lint` before submitting
* Use meaningful commit messages

### Commit Message Convention

We follow the [Conventional Commits](https://conventionalcommits.org/) specification:

- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation only changes
- `style:` Changes that do not affect the meaning of the code
- `refactor:` A code change that neither fixes a bug nor adds a feature
- `test:` Adding missing tests or correcting existing tests
- `chore:` Changes to the build process or auxiliary tools

Example:
```
feat: add user profile image upload
fix: resolve booking calendar date selection bug
docs: update API documentation for booking endpoints
```

## Project Structure

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

## Key Technologies

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Images**: Cloudinary

## Bug Reports

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/yourusername/beside-rental-platform/issues).

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Feature Requests

We use GitHub issues to track feature requests. Request a feature by [opening a new issue](https://github.com/yourusername/beside-rental-platform/issues) and labeling it as "enhancement".

## Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Test on different screen sizes and browsers
- Test with different user roles (owner, renter, admin)

## Documentation

- Update README.md if needed
- Add JSDoc comments for new functions
- Update API documentation for new endpoints
- Include screenshots for UI changes

## Security

If you find a security vulnerability, please **DO NOT** open an issue. Instead, email the maintainers directly.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to open an issue for questions about contributing, or reach out to the maintainers directly.

Thank you for contributing! 🎉
