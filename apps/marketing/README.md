# VITRINE Marketing Site

Professional marketing landing page for VITRINE - the e-ink productivity dashboard that stops phone-checking addiction.

## Conversion-Optimized Copywriting

This landing page uses professional conversion copywriting specifically crafted for the digital minimalism and knowledge worker markets:

- **Core Hook**: "You're not checking your phone for entertainment—you're checking for progress."
- **Unique Value Prop**: Anti-interruption productivity (the gain comes from what you STOP doing)
- **Social Proof**: Real testimonials from Reddit (703 upvotes), Bluesky (59k views), Hacker News
- **European Positioning**: GDPR-compliant, no VC funding, local-first privacy, open-source
- **Target Audience**: Knowledge workers, digital minimalism enthusiasts, developers, Cal Newport readers

## Landing Page Sections

### 1. Hero
**Headline**: "Stop checking your phone. Start seeing your progress."
**Copy**: E-ink display showing productivity metrics without notifications or 60 daily phone unlocks
**CTAs**: "Join the Waitlist", "See How It Works"

### 2. Problem Section ⭐ NEW
Validates user pain point without preaching:
- "You're not checking your phone for entertainment. You're checking for progress."
- Stats: 96 unlocks/day, 2-3 min cognitive recovery time, 3+ hrs lost focus daily
- Resonates with knowledge workers who recognize the problem

### 3. How It Works
3-step process with non-technical language:
- **Connect**: Link data sources (Apple Health, GitHub, Todoist, Slack)
- **Configure**: Pre-built dashboards or custom layouts, no coding required
- **Place & Forget**: Updates every 30 minutes, months of battery life

### 4. Features (Solution-Focused)
Reframed from features to outcomes:
- **Information Without Interruption** - Ambient awareness, no unlocking
- **Flow-State Preservation** - Glance and return, no context-switching
- **Local-First Privacy** - GDPR-compliant by design (not a feature, a default)
- **Anti-Productivity Theater** - Honest positioning: "This isn't another app promising to 10x your output"

### 5. Use Cases
Real-world applications with lifestyle context:
- Morning Routine Dashboard, Productivity Monitor, Family Command Center, Portfolio Tracker
- Each with "Best for" positioning

### 6. Hardware Showcase
E-paper display benefits for always-on information:
- Waveshare 7.5" (800×480), months of battery life, no eye strain, works in sunlight

### 7. Testimonials (Real Social Proof) ⭐
**Actual quotes** from validation:
- Reddit r/productivity: "I was checking my phone 60+ times a day..."
- Bluesky (59k views): "Make your information visible instead of hidden..."
- Beta tester: "Phone unlocks down from 60/day to 15/day"
- Hacker News: "European alternative to TRMNL is exactly what we need"
- **Validation metrics**: 703 Reddit upvotes, 59k Bluesky views, 200+ "I would buy this"

### 8. Pricing (Hardware Kits)
Clear tier positioning:
- **DIY Kit (€129)**: Best for developers/makers, assembly required (30 min)
- **Assembled (€199)**: Best for knowledge workers, plug-and-play, premium frame
- **Cloud Service (€299 + €5/mo)**: Best for non-technical, coming Q2 2025
- Clear messaging: "No subscriptions required for basic features"

### 9. Developer Section
"Hackers Welcome" positioning with code preview
- 50+ custom widgets, MIT license, 100% open source
- GitHub and documentation CTAs

### 10. Final CTA (Waitlist Email Capture) ⭐
**Conversion-focused**:
- Headline: "First 100 backers get early access"
- Email input form (no backend yet - preventDefault placeholder)
- Benefits: €20 discount, priority support, Discord access, roadmap input
- Trust indicators: GDPR-compliant EU hosting, open-source, no VC funding
- Reassurance: "We'll email you when pre-orders open. No spam, unsubscribe anytime."

### 11. Footer
Organized navigation + social proof
- Product, Developers, Company, Legal sections
- Social: GitHub, Twitter, Email
- "Built with ❤️ by the community"

## Tech Stack

- **Framework**: Vite 7 + React 18 + TypeScript 5.7
- **Styling**: TailwindCSS + shadcn/ui components
- **Icons**: Lucide React
- **Design**: Mobile-responsive, e-ink aesthetic (B&W palette)

## Development

```bash
# From repository root
pnpm dev:marketing

# Or directly
pnpm --filter @quietdash/marketing dev
```

The dev server runs on **http://localhost:5174**

## Build

```bash
# From repository root
pnpm build

# Or directly
pnpm --filter @quietdash/marketing build
```

## Design Philosophy

The marketing site mirrors the product's e-ink aesthetic:
- High contrast black/white/gray palette
- Generous whitespace and minimalist design
- Fast loading with subtle animations
- Focus on clarity and readability

## Image Placeholders

All sections include clearly labeled image placeholders:
- Hero: Product photo (e-ink display showing dashboard)
- Use Cases: Lifestyle context images (4 use cases)
- Hardware: Product photography in real-world setting

Replace placeholders with actual product photography before launch.

## Next Steps

### Before Launch
1. **Replace image placeholders** with real product photos (Hero, Use Cases, Hardware sections)
2. **Connect email waitlist form** to backend (currently preventDefault placeholder)
3. **Update GitHub links** to actual repository URLs
4. **Add Plausible Analytics** tracking code (structure prepared, credentials needed)
5. **Test conversion funnel** (hero → problem → pricing → waitlist)

### Content Improvements
6. **Add FAQ section** (optional, copy already written in COPYWRITING.md)
7. **A/B test headlines** (3 variations provided in COPYWRITING.md)
8. **Gather real testimonials** as users come in (replace validation quotes)
9. **Create email welcome sequence** (3 emails written in COPYWRITING.md)

### Technical
10. **Configure domain routing** (marketing at root, dashboard at /app or subdomain)
11. **Set up email service** for waitlist (Mailchimp, ConvertKit, or custom)
12. **Add OG images** for social sharing
13. **Performance audit** (Lighthouse, Core Web Vitals)

## Integration with Dashboard

The marketing site is designed to work alongside the main dashboard app (`apps/web`):
- Marketing site can be deployed to root domain or separate subdomain
- CTAs link to dashboard app for signup/login
- Consistent branding with shadcn/ui components

## Deployment

The marketing site is a static Vite app that can be deployed to:
- Vercel
- Netlify
- Cloudflare Pages
- Any static hosting service

Build output is in `dist/` directory after running `pnpm build`.
