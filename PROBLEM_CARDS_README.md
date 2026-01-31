# Problem Card Components

This project now has **two versions** of the Problem Card component, giving you flexibility in how you use them:

## 1. ProblemCard (Component-Based) ✨

**File:** `components/problem-card.tsx`

**Purpose:** Accepts React components/elements as children instead of images.

**Usage:**
```tsx
import ProblemCard from '@/components/problem-card'

<ProblemCard
    tag="Problem"
    title="Your Title"
    description="Your description"
    variant="glare" // or "pixelated" or "marquee"
>
    {/* Any React component or JSX */}
    <div className="w-32 h-32 bg-gradient-to-br from-red-400 to-purple-500" />
</ProblemCard>
```

**Benefits:**
- Render any React component in the visual area
- Great for custom animations, SVGs, charts, or interactive elements
- More flexible and creative freedom

## 2. ProblemCardImage (Image-Based) 🖼️

**File:** `components/problem-card-image.tsx`

**Purpose:** Traditional card that displays images using Next.js Image component.

**Usage:**
```tsx
import ProblemCardImage from '@/components/problem-card-image'

<ProblemCardImage
    imageSrc="/your-image.svg"
    imageAlt="Description"
    tag="Problem"
    title="Your Title"
    description="Your description"
    variant="glare" // or "pixelated" or "marquee"
/>
```

**Benefits:**
- Simple and straightforward for image-based content
- Optimized with Next.js Image component
- Perfect for traditional card layouts

## Visual Effects (Both Components)

Both components support three hover effect variants:

### 1. `variant="glare"` (Default)
- Cinematic sheen/glint that sweeps across on hover
- Smooth diagonal light effect
- Best for: Professional, polished look

### 2. `variant="pixelated"`
- Mosaic grid overlay appears on hover
- Retro, digital aesthetic
- Best for: Tech-focused, creative designs

### 3. `variant="marquee"`
- Scrolling shine bars animate continuously on hover
- Dynamic, attention-grabbing
- Best for: Action-oriented, energetic content

## Examples

See `/dev-dev` page for live examples of both component types with all three variants!

## Which One Should You Use?

- **Use ProblemCard** when you want to render custom components, animations, or interactive elements
- **Use ProblemCardImage** when you just need to display static images

Both maintain the same visual design and card structure!
