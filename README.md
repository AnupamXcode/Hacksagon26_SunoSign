# 🧠 SunoSign AI  
### Context-Aware AI-Powered Sign Language Communication System  

> An intelligent real-time system that converts hand sign language gestures into meaningful text and speech using multi-hand tracking, motion intelligence, and context-aware AI predictions.

---

## 📋 Quick Navigation
- **[🚀 Quick Start](#-quick-start)** - Get running in 5 minutes
- **[⚙️ Requirements](#-system-requirements)** - What you need
- **[📥 Installation](#-installation-guide)** - Step-by-step setup
- **[🎯 Running](#-running-the-project)** - Start the application
- **[📂 Structure](#-project-structure)** - How it's organized
- **[💻 Usage](#-usage-guide)** - How to use it
- **[🔧 Troubleshooting](#-troubleshooting-guide)** - Fix issues

---

## 🚀 Quick Start (5 Minutes)

### For the Impatient 😎

```bash
# 1. Clone the project
git clone https://github.com/AnupamXcode/Hacksagon26_SunoSign.git
cd Hacksagon26_SunoSign

# 2. Install dependencies (takes 2-3 minutes)
npm install

# 3. Start everything
npm run dev

# 4. Open browser
# Go to: http://localhost:8084

# 5. Grant camera permission and start detecting!
```

**That's it! You're now running SunoSign AI locally.** 🎉

---

## 🏆 About SunoSign AI

### The Problem

Communication for speech-impaired individuals remains inefficient because:
- Most systems only detect **alphabets or static gestures**
- Lack of **context awareness** 
- Not suitable for **real-time conversations**
- Require trained interpreters or prior knowledge

### Our Solution

SunoSign AI transforms gesture recognition into **intelligent communication**:
- ✅ Detects **both hands simultaneously**
- ✅ Understands **gesture sequences**
- ✅ Adapts using **context-aware AI**
- ✅ Provides **real-time suggestions + speech output**

### Core Innovation: Context-Aware AI

Same gesture → Different meanings based on context:

| Context | Example | Same Gesture |
|---------|---------|--------------|
| Medical | Aspirin | Pointing motion |
| Grocery | Apple | Circular motion |
| Bank | Account | Hand movements |
| Transport | Bus | Specific gesture |

---

## 🎯 Key Features

### ✋ Multi-Hand Real-Time Detection
- Simultaneous detection of both hands
- 42 landmarks tracking (21 per hand)
- 30 FPS real-time processing

### 🔤 Sign Language Recognition
**45+ Gestures Supported**:
- **26 Alphabets** (A-Z)
- **9 Numbers** (1-9)
- **10 Common Phrases** (Hello, I Love You, Help, etc.)
- **16 SunoSign Specific Gestures** (Context-aware)

### 🧠 Motion Intelligence
- Tracks direction, speed, and repetition
- Improves gesture differentiation
- Real-time confidence scoring (0-100%)

### 💬 Real-Time Features
- Live gesture-to-text conversion
- Voice output (Text-to-Speech)
- Word builder with smart suggestions
- Message history tracking
- Detection confidence visualization

### 🎨 Beautiful UI/UX
- Glassmorphism design
- Fully responsive (mobile, tablet, desktop)
- Smooth animations and transitions
- Dark/Light mode support
- Professional styling with Tailwind CSS

---

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Premium component library
- **Lucide Icons** - Beautiful icon set

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **SQLite** - Lightweight database
- **better-sqlite3** - Database driver

### AI/ML
- **MediaPipe** - Hand pose estimation
- **Motion Analysis** - Gesture tracking
- **Web Speech API** - Text-to-speech

### DevOps
- **Concurrently** - Run frontend + backend simultaneously
- **ESLint** - Code quality
- **Vitest** - Testing framework

---

## ⚙️ System Requirements

### Hardware
- **OS**: Windows 10+, macOS 10.14+, or Linux
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 500MB free space
- **Processor**: Intel i5 or equivalent
- **Webcam**: Required for gesture detection

### Software
- **Node.js**: v16.0.0 or higher
- **npm**: v7.0.0 or higher
- **Git**: For cloning repository

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 📥 Installation Guide

### Step 1: Install Node.js

#### Windows
1. Download from https://nodejs.org (LTS version)
2. Run installer and follow wizard
3. Restart computer

#### macOS
```bash
brew install node
```

#### Linux
```bash
sudo apt update
sudo apt install nodejs npm
```

**Verify:**
```bash
node --version
npm --version
```

### Step 2: Clone Repository

```bash
git clone https://github.com/AnupamXcode/Hacksagon26_SunoSign.git
cd Hacksagon26_SunoSign
```

### Step 3: Install Dependencies

```bash
npm install
# Takes 2-3 minutes
```

### Step 4: Verify Installation

```bash
npm list
# Should show no errors
```

---

## 🚀 Running the Project

### Recommended: Run Everything at Once

```bash
npm run dev
```

**Output will show:**
```
➜  Local:   http://localhost:8084/
◇ Server is running on port 3001
```

### Alternative: Run Separately

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Other Options

```bash
npm run dev          # Start both frontend and backend
npm run server       # Start backend only
npm run build        # Create production build
npm run lint         # Check code quality
npm run test         # Run tests
```

---

## 📂 Project Structure

```
Hacksagon26_SunoSign/
├── src/                       # Frontend source
│   ├── components/            # React components
│   │   ├── SunoSignApp.jsx    # Main A-Z mode
│   │   ├── NumberDetection.jsx
│   │   ├── PhraseDetection.jsx
│   │   ├── ChatPanel.jsx
│   │   └── ...
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Gesture engines & utilities
│   ├── pages/
│   ├── App.jsx
│   └── main.jsx
│
├── server/                     # Backend source
│   ├── index.js               # Express server
│   ├── database.sqlite        # SQLite database
│   └── package.json
│
├── public/                     # Static assets
├── dist/                       # Production build
├── package.json               # Project config
├── vite.config.js
├── tailwind.config.js
├── README.md                  # This file
└── ...
```

---

## 💻 Usage Guide

### First Time Setup

1. **Open Application**
   - Go to http://localhost:8084
   - Grant camera permission

2. **Create Account**
   - Click "Sign Up"
   - Enter email, password, name
   - Click "Register"

### Using A-Z Mode

```
1. Click "A-Z" button
2. Make letter gesture
3. See detected letter
4. Click "Add" to add to word
5. Complete word appears in history
6. Click "Speak" to hear it
```

### Using Numbers Mode

```
1. Click "1-9" button
2. Show number (fingers up)
3. Number detected instantly
4. Confidence score displays
5. History accumulates numbers
```

### Using Phrases Mode

```
1. Click "Phrases" button
2. Use both hands
3. Phrase recognized in real-time
4. Voice output plays
5. Message appears in history
```

---

## 📍 Access Points

| Service | URL | Port |
|---------|-----|------|
| Frontend | http://localhost:8084 | 8084 |
| Backend API | http://localhost:3001 | 3001 |
| Database | ./server/database.sqlite | (local) |

---

## 📦 Available Commands

```bash
# Development
npm run dev              # Start everything
npm run server          # Backend only
npm run dev:frontend    # Frontend only

# Production
npm run build           # Create production build
npm run preview         # Preview production build

# Quality
npm run lint            # Check code quality
npm test               # Run tests
npm run test:watch    # Tests in watch mode
```

---

## 🧠 Gesture Reference

### Alphabet (A-Z)
Hold each letter shape for 1 second

### Numbers (1-9)
Show fingers to represent number (1 = index only, 2 = index+middle, etc.)

### Phrases
- HELLO: Wave motion
- I LOVE YOU: Heart shape
- HELP: Both hands up
- YES/NO: Nodding/shaking motion

---

## 🔧 Troubleshooting

### Camera Not Working
- Check browser permissions: Settings → Camera → Allow
- Try different browser (Chrome recommended)
- Verify webcam works in other apps

### Port in Use
```bash
# Windows
netstat -ano | findstr :8084
taskkill /PID [PID] /F

# macOS/Linux
lsof -i :8084
kill -9 [PID]
```

### Blank Screen
```bash
# Hard refresh
Ctrl+Shift+R (Windows)
Cmd+Shift+R (Mac)

# Clear cache
npm cache clean --force

# Reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Gestures Not Detecting
1. Improve lighting (bright, natural light)
2. Position hand in center of frame
3. Make gesture slowly and deliberately
4. Hold for full second
5. Check confidence score (should be >70%)

### Database Errors
```bash
# Delete old database
rm server/database.sqlite*

# Restart
npm run dev
# New database creates automatically
```

---

## 🌍 Use Cases

- 🏥 **Hospitals** - Patient-Doctor communication
- 🛒 **Retail** - Customer service
- 🏦 **Banking** - Transaction requests
- 🏫 **Education** - Classroom communication
- 🚌 **Transport** - Booking inquiries
- 👨‍👩‍👦 **Daily Life** - Family communication

---

## 🧠 Innovation Highlights

- Multi-hand + motion-aware recognition  
- Context-driven AI predictions (major differentiator)  
- Sequence → sentence transformation  
- Human-in-the-loop correction system  
- Real-time assistive communication  

---

## 🎨 UI Features

### Responsive Design
- Mobile (<640px): Single column
- Tablet (640-1024px): Optimized layout
- Desktop (1024px+): Multi-column with chat

### Animations
- Smooth fade-in/out effects
- Slide transitions
- Glow effects on active elements
- Scale animations on hover

### Accessibility
- Keyboard navigation
- Focus indicators
- High contrast text
- ARIA labels

---

## 📊 Performance

| Metric | Value |
|--------|-------|
| Detection Speed | 30 FPS |
| CSS Bundle | 62 KB (gzipped: 10.7 KB) |
| JS Bundle | 444 KB (gzipped: 138.75 KB) |
| Confidence Range | 0-100% |
| Supported Gestures | 45+ |

---

## 🔮 Future Enhancements

- 🤖 LSTM/Transformer-based modeling
- 🌐 Full sign language grammar
- 📱 Mobile app (iOS/Android)
- 🗣️ Multilingual support
- 🎮 Offline wearable devices
- ↔️ Two-way communication

---

## 🤝 Contributing

```bash
# Fork → Branch → Commit → Push → PR
git checkout -b feature/amazing-feature
git commit -m 'Add amazing feature'
git push origin feature/amazing-feature
```

---

## 📝 License

Part of Hacksagon26 Hackathon submission

---

## 👥 Team

- **Anupam Shrivastava** - Lead Developer
- **Snehal Sathawane** - UI/UX
- **Sarthaki Fuley** - AI/ML
- **Shubh Rai** - Backend

---


