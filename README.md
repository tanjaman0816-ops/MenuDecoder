# Menu Decoder

> Bridge the language-appetite gap for travelers.

## Overview

Menu Decoder is a responsive Progressive Web App (PWA) that instantly translates physical menu photos into visual guides with high-quality food images. It solves "Menu Anxiety" by showing you what dishes actually look like.

## Features

- **Snap & Decode**: Use your phone's camera to scan a menu.
- **AI-Powered**: Uses Google Cloud Vision (OCR) to read text and Custom Search to find images.
- **Instant Visuals**: See a grid of delicious photos corresponding to menu items.
- **Serverless Architecture**: Lightweight and scalable.

## Technical Stack

- **Frontend**: React (Vite), Vanilla CSS (Glassmorphism), Framer Motion, Lucide React.
- **Backend**: Node.js Serverless Functions (compatible with Vercel/Netlify).
- **APIs**: Google Cloud Vision API, Google Custom Search API.

## Getting Started

### Prerequisites

- Node.js 18+
- Google Cloud Vision API credentials (`service-account.json`)
- Google Custom Search API Key & Engine ID

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd MenuDecoder
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    - Place your `service-account.json` in the root directory.
    - Create a `.env` file in the root with:
      ```env
      GOOGLE_API_KEY=your_custom_search_key
      SEARCH_ENGINE_ID=your_search_engine_id
      ```

4.  **Run Locally**
    - Start the frontend and local backend bridge:
      ```bash
      # Terminal 1: Frontend
      npm run dev
      
      # Terminal 2: Backend Bridge
      npm run api
      ```

5.  **Open Browser**
    - Visit `http://localhost:5173`

## Deployment

### Deploy to Netlify

1.  **Connect your repository** to a new site on Netlify.
2.  **Configure Build Settings**:
    - **Build command**: `npm run build`
    - **Publish directory**: `dist`
    - **Functions directory**: `api` (Already configured in `netlify.toml`)
3.  **Environment Variables**:
    - Add `GOOGLE_API_KEY` in Netlify Site Settings.

## Project Structure

- `/src` - React frontend code.
- `/api` - Serverless backend functions.
- `local-api.js` - Express bridge for running serverless functions locally.

## License

MIT
