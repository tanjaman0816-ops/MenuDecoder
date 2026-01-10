# Menu Decoder

> Bridge the language-appetite gap for travelers and modernize menu management for restaurant owners.

## Overview

Menu Decoder is a responsive web application that instantly translates physical menu photos into visual guides with high-quality food images. Unlike native mobile apps requiring downloads, Menu Decoder is accessible via any browser URL.

**Key Innovation:** One codebase serving two distinct user contexts:
- 📱 **Mobile Context**: Quick on-the-go decoding for travelers
- 💻 **Desktop Context**: Professional menu digitization tool for restaurant managers

## Problem Statement

### For Travelers (B2C)
Dining abroad often involves "Menu Anxiety"—uncertainty when ordering due to language barriers. Existing solutions like Google Lens provide literal translations (e.g., "Pollo" → "Chicken") but fail to show what the food actually looks like.

### For Restaurant Owners (B2B)
Local restaurants lose revenue when tourists walk away from text-only menus. Staff waste peak hours explaining dishes to foreign customers. Owners need a way to visually digitize menus without expensive photography or reprinting costs.

## User Personas

### Persona A: The Traveler (Mobile User)
- **Device**: Smartphone (iPhone/Android)
- **Environment**: Low-light restaurants, spotty connectivity, high urgency
- **Behavior**: Wants results in under 10 seconds without app downloads
- **Key Interaction**: Tap → Upload → Camera → Scroll vertical feed

### Persona B: The Restaurant Manager (Desktop User)
- **Device**: Laptop or desktop
- **Environment**: Back office, stable Wi-Fi
- **Behavior**: Has high-resolution menu files (PDF/JPG) ready to digitize
- **Key Interaction**: Drag & drop → Review side-by-side → Generate QR code

## Features

### Input Module
- **FR-01: Responsive Drop Zone**
  - Desktop: HTML5 drag-and-drop with visual hover indicators
  - Mobile: Native file picker with "Take Photo" or "Choose from Library" options

- **FR-02: Smart File Handling**
  - 4MB size limit for rapid mobile processing
  - Client-side compression for oversized images

### Processing Logic
- **FR-03: OCR Processing**
  - Google Cloud Vision API integration
  - DOCUMENT_TEXT_DETECTION feature
  - Intelligent text block parsing

- **FR-04: Noise Filtering**
  - Excludes phone numbers, addresses, metadata
  - Filters pricing-only lines and non-food text
  - Optimizes API credit usage

- **FR-05: Visual Retrieval**
  - Google Custom Search API in Image Mode
  - Parallel query execution (Promise.all)
  - Optimized for low latency

### Output Interface
- **FR-06: Mobile Layout**
  - Single-column vertical stack
  - Optimized card design for thumb scrolling
  - Viewport width < 768px

- **FR-07: Desktop Layout**
  - Split-screen design
  - Left pane: Original uploaded image
  - Right pane: Multi-column result grid
  - Viewport width ≥ 768px

- **FR-08: Correction Mechanism**
  - "Search Again" button on each result card
  - Manual re-query for inaccurate results

## Technical Stack

### Frontend
- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS
- **Responsive Design**: Mobile-first approach

### Backend
- **API Layer**: Next.js API Routes (Serverless)
- **OCR**: Google Cloud Vision API
- **Image Search**: Google Custom Search API

### Deployment
- **Hosting**: Vercel or Netlify
- **CDN**: Global distribution included

## Data Flow

```
1. User visits menudecoder.com
2. User uploads image (Drag-and-drop or Camera)
3. Frontend converts to Base64/FormData → POST to /api/analyze
4. Backend sends to Google Cloud Vision API → Receives text annotations
5. Backend applies filter logic → Cleans text
6. Backend queries Google Custom Search API (parallel execution)
7. Backend returns JSON: [{ text: "Pizza Margherita", img: "url..." }]
8. Frontend renders responsive Mobile or Desktop layout
```

## UI Design

### Desktop View (The "Pro" Experience)
```
┌─────────────────────┬─────────────────────┐
│                     │                     │
│  Original Menu      │   Decoded Results   │
│  Image (Reference)  │   (Scrollable Grid) │
│                     │                     │
└─────────────────────┴─────────────────────┘
```

### Mobile View (The "Traveler" Experience)
```
┌─────────────────────┐
│  Menu Detected      │
├─────────────────────┤
│ [Image] | Dish Name │
├─────────────────────┤
│ [Image] | Dish Name │
├─────────────────────┤
│ [Image] | Dish Name │
└─────────────────────┘
```

## Getting Started

### Prerequisites
- Node.js 16.x or higher
- Google Cloud Vision API credentials
- Google Custom Search API key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/menu-decoder.git

# Navigate to project directory
cd menu-decoder

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Google API credentials to .env.local

# Run development server
npm run dev
```

### Environment Variables

```env
GOOGLE_CLOUD_VISION_API_KEY=your_vision_api_key
GOOGLE_CUSTOM_SEARCH_API_KEY=your_search_api_key
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_search_engine_id
```

## Usage

### For Travelers
1. Open menudecoder.com on your smartphone
2. Tap the upload zone
3. Take a photo of the menu
4. Scroll through visual results

### For Restaurant Managers
1. Visit menudecoder.com on your desktop
2. Drag and drop your menu PDF/JPG
3. Review the split-screen results
4. Generate a QR code for customer access

## Roadmap

- [ ] Multi-language support
- [ ] Dietary restriction filtering
- [ ] Save favorite restaurants
- [ ] QR code generation for restaurants
- [ ] Offline mode for travelers

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## License

[Your License Here]

## Contact

For questions or support, please open an issue or contact [your-email@example.com]

---

Built with ❤️ for travelers and restaurateurs worldwide
