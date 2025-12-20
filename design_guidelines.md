# Design Guidelines: Grow4Bot Gaming Marketplace

## Design Approach
**Reference-Based Approach** drawing inspiration from modern gaming marketplaces (Discord Nitro, Steam) combined with clean e-commerce patterns (Shopify, Stripe). This is an experience-focused platform where visual appeal drives trust and conversion in digital goods sales.

## Core Design Principles
1. **Gaming-First Aesthetic**: Modern, sleek interface that appeals to gamers
2. **Trust & Clarity**: Clear pricing, stock levels, and transaction transparency
3. **Efficiency**: Quick access to wallet, purchases, and admin functions
4. **Visual Hierarchy**: Guide users through browse → purchase → manage flow

---

## Typography System

**Primary Font**: Inter (via Google Fonts CDN)
- Headers (H1): 48px / font-bold
- Headers (H2): 36px / font-semibold  
- Headers (H3): 24px / font-semibold
- Body Large: 18px / font-normal
- Body: 16px / font-normal
- Small/Meta: 14px / font-normal
- Tiny/Labels: 12px / font-medium

**Secondary Font** (for brand/logo): Orbitron or Rajdhani (gaming aesthetic)

---

## Layout System

**Spacing Scale**: Tailwind units of 2, 4, 6, 8, 12, 16, 24
- Component padding: p-6 to p-8
- Section spacing: py-12 to py-16
- Card gaps: gap-6 to gap-8
- Tight spacing: space-y-2 to space-y-4

**Container Widths**:
- Max content width: max-w-7xl
- Card grids: 3-column desktop (lg:grid-cols-3), 2-column tablet (md:grid-cols-2), 1-column mobile

---

## Component Library

### 1. Authentication Pages
**Login/Register Screen**:
- Centered card layout (max-w-md)
- Large logo at top with brand typography
- Spacious input fields with icon prefixes
- Primary/Secondary button pairing
- Demo credentials display in muted style
- Subtle animated background pattern

### 2. Header/Navigation
**Sticky Header**:
- Full-width with max-w-7xl container
- Logo left, wallet display center-right, profile right
- Wallet balance with currency icon
- Avatar with dropdown for logout
- Glass morphism effect (backdrop-blur)

### 3. Product Cards
**Grid Layout**:
- Rounded cards (rounded-xl) with image at top
- Product image (16:9 aspect ratio)
- Product name as card header
- Price display with currency icon
- Stock indicator (color-coded: high/low/out)
- "Purchase" button prominent at bottom
- Hover: subtle lift effect (transform scale-105)

### 4. Wallet Section
**Balance Display**:
- Large prominent balance at top
- "Top Up" button clearly visible
- Transaction history list below
- Each transaction: icon, description, amount, timestamp

### 5. Purchase History
**Transaction List**:
- Card-based list items
- Product name, purchase date, price paid
- "View Details" expandable section
- Stock data/credentials revealed in expanded state
- Copy-to-clipboard for credentials

### 6. Admin Dashboard
**Multi-Tab Interface**:
- Tab navigation: Products / Users
- **Products Tab**: Table with add/edit/delete actions, stock management
- **Users Tab**: User cards with balance, ban status, add balance action
- Action buttons with confirmation modals
- Real-time stock updates

### 7. Dialogs/Modals
**Overlay System**:
- Centered modal (max-w-md to max-w-lg)
- Backdrop with blur effect
- Clear title at top
- Content area with appropriate padding
- Action buttons at bottom (Cancel + Confirm pattern)
- Types: Error (red accent), Warning (yellow accent), Info (blue accent)

---

## Visual Enhancements

**Cards**: 
- Subtle shadow (shadow-lg to shadow-xl)
- Border with low opacity
- Glass morphism for elevated elements

**Buttons**:
- Primary: Full background with hover brightness
- Secondary: Outlined style
- Disabled: Reduced opacity
- Icon + Text combinations where appropriate

**Forms**:
- Input fields with icons
- Focus states with ring effect
- Error states with red accents
- Success states with green accents

**Loading States**:
- Full-screen loader with brand logo
- Skeleton screens for content loading
- Spinner animation for actions

---

## Animations

**Minimal Strategic Use**:
- Page transitions: Subtle fade-in
- Card hover: Slight elevation (translate-y)
- Button clicks: Scale feedback
- Modal entry/exit: Fade + slide
- NO scroll animations or excessive motion

---

## Images

### Product Images
- Each product card displays product image at top
- 16:9 aspect ratio, object-fit cover
- Placeholder: Gaming-themed gradient if no image
- Location: Above product title in card

### Hero Section (Optional for Landing)
- If creating landing page: Full-width hero with gaming aesthetic image
- Overlay gradient for text readability
- CTA buttons with backdrop-blur backgrounds

### Icons
- Use Heroicons (via CDN) for UI elements
- Currency icons for balance display
- Action icons (edit, delete, add, etc.)
- Status indicators (check, warning, error)

---

## Key Screens Structure

**Home/Shop**:
- Header with wallet + profile
- Product grid (3-col desktop, responsive)
- Quick stats bar if admin

**Wallet**:
- Large balance card at top
- Top-up button prominent
- Transaction history below

**Purchases**:
- Chronological list of purchases
- Expandable details with credentials
- Empty state with CTA to shop

**Admin**:
- Tab navigation for Products/Users
- Data tables with inline actions
- Add product form in modal
- User management cards

---

## Accessibility
- Consistent focus indicators (ring-2 pattern)
- Proper ARIA labels on interactive elements
- Keyboard navigation support
- Sufficient contrast ratios
- Descriptive button text