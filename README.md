# 🧵 ThreadNet - AI Industrial Resource Allocation

**AI-powered supply chain optimization platform connecting India's factory clusters in real-time**

## 🚀 Overview

ThreadNet is an intelligent industrial resource allocation system designed to optimize supply chains across India's distributed manufacturing clusters. The platform connects factory owners, logistics providers, and administrators in a unified ecosystem that maximizes resource utilization, minimizes waste, and enables transparent transactions powered by AI-driven recommendations.

### Key Capabilities

- **Interactive Atlas Map**: MapLibre GL + OpenStreetMap integration for real-time cluster visualization
- **AI Recommendations**: Gemini-powered deal matching and route optimization
- **Live Dashboard**: Real-time metrics, audit trails, and predictive analytics
- **Cluster Heatmaps**: Progress tracking with animated visualization of factory network health
- **Role-Based Access**: Dedicated interfaces for factory owners, logistics providers, and administrators
- **Audit Trail**: Immutable action logging for compliance and transparency
- **Predictive Alerts**: ML-driven surplus detection and opportunity forecasting

## 📊 Platform Features

### Dashboard Intelligence
- **Live Metrics**: Fabric saved, active factories, CO₂ reduction, money saved (updated in real-time via Firebase)
- **AI Recommendations**: Confidence-scored deal suggestions with route risk analysis
- **Predictive Surplus Alerts**: Machine learning identifies upcoming opportunities across clusters
- **Decision Signals**: Transparency into why the AI recommends specific actions
- **Deal Lifecycle Tracking**: Visual progress from listing to closed deal with animated bars

### Map Integration
- **Multi-Cluster Views**: Zoom from all-India to single-city networks
- **City Focus System**: Click markers to center map and filter dashboard metrics
- **Factory Markers**: Color-coded by status (verified/review) with hover tooltips
- **Performance Heatmap**: Track relative factory density across 6 major clusters
- **Accessibility**: Full keyboard navigation and ARIA labels for screen readers

### Factory Network Clusters
- **Tiruppur**: Knitwear hub (214+ factories, 97% trust score)
- **Surat**: Dyeing and textiles (192+ factories, 95% trust score)
- **Ludhiana**: Transport and apparel (156+ factories, 92% trust score)
- **Coimbatore**: Recycling and machinery (143+ factories, 93% trust score)
- **Panipat**: Chemicals and consolidation (121+ factories, 89% trust score)
- **All Clusters**: India-wide network (850+ factories, 91% avg trust)

## 🛠 Tech Stack

### Frontend
- **React 18** - UI framework with hooks and functional components
- **Framer Motion** - Smooth animations and transitions
- **Tailwind CSS** - Utility-first responsive styling
- **MapLibre GL** - Open-source vector/raster mapping
- **Lucide Icons** - Modern icon library (18px–24px sizes)
- **React Hot Toast** - Non-blocking notifications

### Backend & Services
- **Firebase Firestore** - Real-time NoSQL database
- **Firebase Authentication** - Multi-role auth system
- **Firebase Admin SDK** - Server-side operations
- **Google Gemini API** - AI recommendations and NLP
- **React Router v6** - Client-side routing with protected pages

### Build & Development
- **Vite 5.4** - Next-generation build tool (~9s prod builds)
- **npm** - Dependency management
- **ESLint** - Code quality
- **Node.js 18+** - Runtime environment

## 📋 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm 8 or higher
- Firebase project (threadnet-22ab4)
- Google Gemini API key (for AI recommendations)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ThreadNet

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Add Firebase credentials
# Place threadnet-22ab4-firebase-adminsdk-fbsvc-bf8daa44a4.json in project root
# Add to .env.local: VITE_FIREBASE_CONFIG_PATH=./threadnet-22ab4-firebase-adminsdk-fbsvc-bf8daa44a4.json
```

### Configuration

Create `.env.local` with:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=threadnet-22ab4.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=threadnet-22ab4
VITE_FIREBASE_STORAGE_BUCKET=threadnet-22ab4.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_key
```

### Running Locally

```bash
# Development server (Vite hot reload)
npm run dev
# → http://localhost:5173/

# Production build
npm run build

# Preview production build
npm run preview
```

## 🔐 Security

**IMPORTANT**: The Firebase service account file (`threadnet-22ab4-firebase-adminsdk-fbsvc-bf8daa44a4.json`) contains sensitive credentials and is **excluded from version control** via `.gitignore`. 

### Best Practices
- ✅ Never commit `.json` service account files
- ✅ Use environment variables for all API keys
- ✅ Rotate credentials if exposed
- ✅ Use Firebase Security Rules for data access control
- ✅ Implement role-based access control (RBAC) for all endpoints

## 📁 Project Structure

```
ThreadNet/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── AtlasMap.jsx     # MapLibre map wrapper
│   │   ├── CustomCursor.jsx # Theme-aware cursor
│   │   └── Footer.jsx       # Site footer
│   ├── pages/               # Route pages
│   │   ├── Dashboard.jsx    # Main analytics dashboard
│   │   ├── Login.jsx        # Auth page
│   │   └── ...
│   ├── contexts/            # React context providers
│   │   ├── ThemeContext.jsx # Dark/light mode
│   │   ├── AuthContext.jsx  # User authentication
│   │   └── I18nContext.jsx  # Multi-language support
│   ├── services/            # API and data services
│   │   ├── dashboardService.js   # Firebase Firestore queries
│   │   ├── geminiService.js      # Google Gemini AI integration
│   │   └── predictiveAlertsService.js
│   ├── App.jsx              # Root component with routing
│   ├── main.jsx             # React DOM entry
│   └── index.css            # Global styles
├── index.html               # HTML entry point
├── vite.config.js           # Vite configuration
├── package.json             # Dependencies
├── .gitignore               # Git exclusions
├── .env.example             # Environment template
└── README.md                # This file
```

## 🚦 Development Workflow

### Running Tests
```bash
# Future: Component tests with Vitest
npm run test
```

### Building for Production
```bash
# Build optimized bundle
npm run build
# Output: dist/

# Check bundle size
npm run build -- --report
```

### Demo Mode
- Public test route available at `/demo` (bypass auth)
- Fallback data loads when Firebase is unavailable
- Useful for UI testing and demos

## 🌍 Internationalization

Supported languages:
- English (en)
- తెలుగు (te)
- தமிழ் (ta)
- हिन्दी (hi)
- ಕನ್ನಡ (kn)
- मराठी (mr)

Language selector in navbar; preferences stored in localStorage.

## 📝 License

Proprietary - ThreadNet is owned and operated by ThreadNet Inc.

## 👥 Contributors

- **Development Team**: AI Industrial Resource Allocation
- **Design**: UX/UI optimized for manufacturing professionals
- **Data**: Real cluster profiles from India's textile/apparel industry

## 📧 Support & Contact

- **Email**: hello@threadnet.io
- **Location**: Industrial Park, Tiruppur, TN 641602, India
- **Phone**: +91 9876 543 210

---

**Last Updated**: April 28, 2026 | **Version**: 1.0.0
