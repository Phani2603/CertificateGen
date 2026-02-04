# Blog Page Documentation

## Overview
A comprehensive blog landing page built following the design specifications from the JSON documentation files. The blog features a modern, premium design with smooth animations and micro-interactions.

## Font Usage
As specified in the requirements:
- **Headings**: Bespoke Serif (font-bespoke-serif-medium, font-bespoke-serif-bold)
- **Content**: RX100 (font-rx100)
- **Subheadings**: Poppins (font-poppins)

## Components

### 1. FilterTabs (`components/blog/filter-tabs.tsx`)
- **Specification**: `docs/filter-tabs.json`
- **Features**:
  - Pill-style tabs with smooth transitions
  - Active state: filled background with bold text
  - Inactive state: outlined style
  - Smooth content filtering
  - Hover effects with scale animation

### 2. FeaturedVisual (`components/blog/featured-visual.tsx`)
- **Specification**: `docs/featured-visual.json`
- **Features**:
  - 16:9 aspect ratio container with rounded corners (24px)
  - Composite collage with layered elements
  - Floating abstract shapes with animations
  - 3D objects with perspective effects
  - Rotating clock element
  - Portrait cutouts (simulated with gradient circles)
  - Gradient background with depth effects

### 3. ArticleHero (`components/blog/article-hero.tsx`)
- **Specification**: `docs/article-landing.json`
- **Features**:
  - Centered layout with large vertical spacing
  - Primary heading with Bespoke Serif font
  - Pill-shaped CTA button with hover effects
  - Meta row with tags, date, and author information
  - Outlined chip-style tags

### 4. ArticleIntro (`components/blog/article-intro.tsx`)
- **Specification**: `docs/article-intro.json`
- **Features**:
  - Left-aligned text in centered container (max-width: 720px)
  - Structured content sections:
    - Short intro paragraph
    - Long explanatory paragraph
    - Methodology overview in styled box
  - Proper typography hierarchy with RX100 for body text

### 5. RecentPosts (`components/blog/recent-posts.tsx`)
- **Specification**: `docs/recent-post.json`
- **Features**:
  - Header row with title and "See all posts" link
  - Responsive grid layout:
    - Desktop: 3 columns
    - Tablet: 2 columns
    - Mobile: 1 column
  - **Uses ProblemCardImage component** for premium card design with:
    - Real Unsplash images (curated high-quality photos)
    - Three different hover effects (glare, pixelated, marquee)
    - 15:10 aspect ratio with rounded corners
    - Floating and tilting animations on hover
    - Tag pills, titles, and descriptions
  - Staggered fade-in animations
  - Larger fonts for better readability (text-5xl/6xl for headings)

## External Image Sources
The blog uses high-quality images from Unsplash:
- **Configuration**: Added to `next.config.mjs` remote patterns
- **Domains allowed**:
  - `images.unsplash.com`
  - `plus.unsplash.com`
  - `i.pinimg.com` (Pinterest)
- **Image optimization**: Automatic via Next.js Image component
- **Curated images**: Each blog post uses contextually relevant photos

## Micro-Interactions
Based on `docs/micro-interactions.json`:
- **Hover Effects**:
  - Cards: lift + slight scale
  - Buttons: subtle scale
  - Links: underline on hover
- **Scroll Behavior**:
  - Fade-in sections
  - Staggered animations
- **Responsive Behavior**:
  - Stack on mobile
  - Center-aligned hero

## Pages

### Main Blog Page (`app/blog/page.tsx`)
- Combines all components into a cohesive layout
- Implements filtering functionality
- Sample blog posts data included
- Smooth scroll animations

### Individual Blog Post (`app/blog/[id]/page.tsx`)
- Dynamic route for individual posts
- Back navigation to blog listing
- Full article layout with proper typography
- Related articles section
- Proper font usage throughout

## Color Scheme
- Background: White (#FFFFFF)
- Text: Gray-900 for headings, Gray-700 for body
- Accents: Gradient combinations (purple, pink, orange)
- Borders: Gray-300 for outlined elements

## Animations
All animations use the `motion` library (framer-motion) with:
- Smooth transitions (300ms - 600ms)
- Fade-in effects on scroll
- Staggered animations for lists
- Hover scale effects
- Viewport-based triggers (once: true)

## Usage

Navigate to `/blog` to see the main blog landing page with all features.

Click on any blog post card to view the individual post page at `/blog/[id]`.

Use the filter tabs to filter posts by category (All, Insights, News, Best practices).

## Future Enhancements
- Add actual blog post images
- Implement CMS integration for dynamic content
- Add search functionality
- Implement pagination for large post lists
- Add social sharing buttons
- Implement newsletter subscription
