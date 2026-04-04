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

### Using Phrases Mode (10 Trained Gestures)

**Step-by-Step:**
```
1. Click "Phrases" button in header
2. Make trained hand gesture (see table below)
3. Gesture detected in real-time with confidence score
4. Suggestions appear based on phrase context
5. Click "Speak" to hear the phrase
6. Message appears in chat history
7. Can capture custom gestures for custom phrases
```

**Trained Phrase Gestures Reference:**

| # | Gesture | Hand Type | Confidence | Min Hold |
|---|---------|-----------|------------|----------|
| 1 | "MY NAME IS" | 2 Hands | 88% | 3 sec |
| 2 | "ARE" | 2 Hands | 85% | 3 sec |
| 3 | "YOU" | 1 Hand | 82% | 2-3 sec |
| 4 | "CHOCOLATE" | 2 Hands | 86% | 3 sec |
| 5 | "COFFEE" | 2 Hands | 84% | 3 sec |
| 6 | "HOW MUCH" | 1 Hand | 83% | 2-3 sec |
| 7 | "I LOVE YOU" | 1 Hand | 87% | 3 sec |
| 8 | "WASHROOM" | 1 Hand | 81% | 2-3 sec |
| 9 | "PAIN" | 2 Hands | 85% | 3 sec |
| 10 | "WHERE" | 1 Hand | 80% | 2-3 sec |

**Detection Tips:**
- ✅ Hold gesture stable for 2-3 seconds
- ✅ Make clear, deliberate hand shapes
- ✅ Keep hands in center of frame
- ✅ Good lighting improves accuracy by 15-20%
- ✅ Hands should be at waist to shoulder height
- ❌ Avoid blurry or jerky movements
- ❌ Don't overlap hands unnecessarily

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

## 📖 Documentation

### Core Documentation
- **[README.md](README.md)** - You are here! Project overview and setup guide
- **[GESTURE_GUIDE.md](GESTURE_GUIDE.md)** - Complete gesture reference with all 45+ gestures
- **[CAMERA_STABILITY.md](CAMERA_STABILITY.md)** - Camera feed stability implementation (NEW!)

### Camera Stability (Zero-Slide Guarantee)

The application implements **10 core stability rules** to ensure the camera feed NEVER shifts, slides, or re-renders:

✅ **Fixed Container Dimensions** - Locked aspect ratio (16:9)
✅ **Persistent Video Stream** - No re-mounting during detection
✅ **Overlay-Only Outputs** - All gestures use absolute positioning
✅ **Landmark Smoothing** - 5-frame moving average for jitter reduction
✅ **Prevented Re-renders** - Gate updates at >5% confidence threshold
✅ **Separate State Management** - Camera and gesture states independent
✅ **No Dynamic Resizing** - Fixed dimensions across all breakpoints
✅ **CSS Lock** - `!important` rules prevent Tailwind overrides
✅ **Stable Scrollbar** - `scrollbar-gutter: stable` applied
✅ **Memoization** - useStableCamera hook centralizes control

**Result:** 60fps stable camera + smooth gesture detection with zero layout shifts

See [CAMERA_STABILITY.md](CAMERA_STABILITY.md) for implementation details.

**📖 For Complete Gesture Details:** See [GESTURE_GUIDE.md](GESTURE_GUIDE.md) for comprehensive specifications including alphabets, numbers, and all trained phrases with detection rules.

### Quick Gesture Overview

#### Alphabet Gestures (A-Z)
Hold each letter shape for 1+ second in camera frame. Each letter has a distinct hand configuration.

### Number Gestures (1-9)

| Number | Hand Configuration | Detection |
|--------|-------------------|-----------|
| 1 | Index finger only extended | Index tip farthest from palm |
| 2 | Index + Middle extended | Two fingers aligned upward |
| 3 | Index + Middle + Ring extended | Three fingers in line |
| 4 | All except thumb extended | Four fingers up together |
| 5 | All fingers extended (open hand) | Fingertips spread, palm open |
| 6-9 | Specific combinations | Varies per configuration |

**Rule**: Hold stable for 2-3 frames for recognition

---

### Phrase Gestures (Trained Phrases)

#### 1️⃣ "MY NAME IS"
**Hand Configuration:**
- **Right Hand**: Index & middle extended horizontally (pointing left), ring/pinky folded
- **Left Hand**: Index & middle extended vertically (pointing up), others folded
- **Spatial**: Right hand crosses over left hand (intersection point)
- **Detection**: Hands close/touching, fingers aligned perpendicular
- **Stability**: ≥3 frames
- **Confidence**: >75%

---

#### 2️⃣ "ARE"
**Hand Configuration:**
- **Both Hands**: Thumbs extended upward, all other fingers folded
- **Spatial**: Thumbs close to each other, hands vertical
- **Detection**: Both thumbs at similar height, symmetrical
- **Stability**: ≥3 frames
- **Confidence**: >80%

---

#### 3️⃣ "YOU"
**Hand Configuration:**
- **Right Hand Only**: Index finger extended forward (pointing outward)
- **Other Fingers**: Thumb slightly bent, ring/pinky folded
- **Palm**: Facing sideways
- **Detection**: Index tip farthest point from palm center
- **Stability**: ≥2-3 frames
- **Confidence**: >70%

---

#### 4️⃣ "CHOCOLATE"
**Hand Configuration:**
- **Left Hand**: All fingers extended horizontally (flat palm facing up)
- **Right Hand**: Curved "C" shape (thumb opposing fingers)
- **Spatial**: Right hand above left hand, "C" hovering over palm
- **Detection**: 
  - Left: All fingertips aligned horizontally
  - Right: Small distance between thumb-index (curvature)
- **Vertical Separation**: 2-5cm
- **Stability**: ≥3 frames
- **Confidence**: >75%

---

#### 5️⃣ "COFFEE"
**Hand Configuration:**
- **Both Hands**: Fists closed (all fingers folded)
- **Thumbs**: Wrapped over fingers
- **Spatial**: One fist stacked vertically above the other
- **Detection**: All fingertips near palm center, vertical alignment
- **Stability**: ≥3 frames
- **Confidence**: >80%

---

#### 6️⃣ "HOW MUCH"
**Hand Configuration:**
- **Single Hand (Either)**: Pinch gesture
- **Thumb**: Extended outward
- **Index**: Slightly bent, touching thumb (pinch)
- **Other Fingers**: Folded
- **Palm**: Facing sideways
- **Detection**: Distance(thumb_tip, index_tip) very small (<1cm)
- **Stability**: ≥2-3 frames
- **Confidence**: >75%

---

#### 7️⃣ "I LOVE YOU"
**Hand Configuration:**
- **Single Hand**: ILY sign
- **Thumb**: Extended outward (left)
- **Index**: Extended upward
- **Middle**: Folded (center)
- **Ring**: Folded (center)
- **Pinky**: Extended upward (right)
- **Palm**: Facing forward
- **Detection**: Three fingers extended (thumb, index, pinky), two folded
- **Stability**: ≥3 frames
- **Confidence**: >750%

---

#### 8️⃣ "WASHROOM"
**Hand Configuration:**
- **Single Hand**: Closed fist
- **All Fingers**: Folded into fist
- **Thumb**: Wrapped outside
- **Palm**: Facing forward
- **Detection**: All fingertips clustered near palm center
- **Stability**: ≥2-3 frames
- **Confidence**: >80%

---

#### 9️⃣ "PAIN"
**Hand Configuration:**
- **Both Hands**: Pointing gesture
- **Right Hand**: Index extended forward, thumb extended upward, others folded
- **Left Hand**: Index extended forward, thumb extended upward, others folded
- **Spatial**: Both index fingers pointing toward each other
- **Detection**: 
  - Distance(right_index_tip, left_index_tip) ≈ 0-2cm (touching/very close)
  - Both thumbs pointing upward
  - Other fingers folded
- **Stability**: ≥3 frames
- **Confidence**: >80%

---

#### 🔟 "WHERE"
**Hand Configuration:**
- **Single Hand**: Pointing upward
- **Index**: Extended upward (highest point)
- **Other Fingers**: Folded toward palm
- **Thumb**: Supporting folded fingers
- **Palm**: Facing forward
- **Detection**: Index tip highest point, others near palm
- **Stability**: ≥2-3 frames
- **Confidence**: >70%

---

## 🛍️ Retailer Phrases (12 Industry-Specific Gestures)

### Context-Aware Communication for Service Industries

SunoSign AI includes **12 specialized retail phrases** designed for common service interactions:
- 🏥 **Pharmacy** - Medical/healthcare service requests
- 🛒 **Grocery** - Shopping and product inquiries
- 🚌 **Transport** - Transportation services
- 🏦 **Bank** - Financial services

---

### PHARMACY PHRASES (3)

#### 1️⃣ "I NEED MEDICINE"
**Hand Configuration:**
- **Right Hand**: Index pointing to chest (inward), others folded
- **Left Hand**: Open palm facing upward (requesting)
- **Spatial**: Right near chest, Left slightly forward
- **Detection**: Index pointing inward, left palm flat
- **Min Hold**: 3 frames
- **Confidence**: 86%
- **Output**: "I need medicine"

#### 2️⃣ "DO YOU HAVE THIS?"
**Hand Configuration:**
- **Right Hand**: Index pointing forward, others folded
- **Left Hand**: Open palm upward
- **Spatial**: Right pointing at object/reference
- **Detection**: Index extending outward, left palm open
- **Min Hold**: 2-3 frames
- **Confidence**: 84%
- **Output**: "Do you have this?"

#### 3️⃣ "WHAT IS THE DOSAGE?"
**Hand Configuration:**
- **Right Hand**: Index pointing upward (question indicator)
- **Left Hand**: Thumb-index pinch (quantity/measurement)
- **Spatial**: Right above left hand
- **Detection**: Right index vertical, Left pinch <1cm
- **Min Hold**: 3 frames
- **Confidence**: 85%
- **Output**: "What is the dosage?"

---

### GROCERY PHRASES (3)

#### 4️⃣ "HOW MUCH IS THIS?"
**Hand Configuration:**
- **Right Hand**: Thumb-index pinch (price/amount)
- **Left Hand**: Index pointing forward (object reference)
- **Spatial**: Right near center, Left pointing
- **Detection**: Pinch distance <1cm, pointing gesture
- **Min Hold**: 3 frames
- **Confidence**: 83%
- **Output**: "How much is this?"

**Detective Tips:**
- Hold pinch stable for 3 frames
- Keep left hand extended outward
- Clear separation between pointing and pinch gestures

#### 5️⃣ "GIVE ME THIS"
**Hand Configuration:**
- **Right Hand**: Index pointing at item (forward)
- **Left Hand**: Open palm facing upward (receiving)
- **Spatial**: Right pointing, Left below/receiving
- **Detection**: Clear pointing + receiving combination
- **Min Hold**: 3 frames
- **Confidence**: 84%
- **Output**: "Give me this"

**Detection Tips:**
- Point clearly at desired item
- Keep left palm open and flat
- Hands should show "asking + receiving" gesture

#### 6️⃣ "DO YOU HAVE FRESH STOCK?"
**Hand Configuration:**
- **Right Hand**: All 5 fingers extended, palm forward
- **Left Hand**: All 5 fingers extended, palm upward
- **Spatial**: Both hands open (availability signal)
- **Detection**: All fingers visible on both hands
- **Min Hold**: 3 frames
- **Confidence**: 82%
- **Output**: "Do you have fresh stock?"

**Detection Tips:**
- Make full open-hand gesture
- Fingers fully extended and visible
- Both hands should show open-palm state

---

### TRANSPORT PHRASES (3)

#### 7️⃣ "TAKE ME HERE"
**Hand Configuration:**
- **Right Hand**: Index pointing forward (direction)
- **Left Hand**: Index pointing downward (location)
- **Spatial**: Right pointing ahead, Left pointing down
- **Detection**: Dual direction indicators, distinct angle
- **Min Hold**: 3 frames
- **Confidence**: 85%
- **Output**: "Take me here"

**Detection Tips:**
- Right hand points to destination
- Left hand points down to map/location
- Clear directional contrast between hands

#### 8️⃣ "HOW MUCH FARE?"
**Hand Configuration:**
- **Right Hand**: Thumb-index pinch (amount/price)
- **Left Hand**: Open palm upward (request)
- **Spatial**: Right pinching, Left open
- **Detection**: Pinch <1cm distance, open palm
- **Min Hold**: 2-3 frames
- **Confidence**: 83%
- **Output**: "How much fare?"

#### 9️⃣ "IS THIS AVAILABLE?"
**Hand Configuration:**
- **Right Hand**: Index pointing forward (route/service)
- **Left Hand**: Open palm upward (inquiry)
- **Spatial**: Right pointing, Left asking
- **Detection**: Pointing + open palm combination
- **Min Hold**: 2-3 frames
- **Confidence**: 81%
- **Output**: "Is this available?"

---

### BANK PHRASES (3)

#### 🔟 "I WANT TO WITHDRAW MONEY"
**Hand Configuration:**
- **Right Hand**: Closed fist (grasping/taking action)
- **Left Hand**: Open palm upward (money representation)
- **Spatial**: Right near left, showing withdrawal motion
- **Detection**: Clear fist + open palm, moving apart
- **Min Hold**: 3 frames
- **Confidence**: 87%
- **Output**: "I want to withdraw money"

**Detection Tips:**
- Make fist with right hand (grasping motion)
- Left hand open and flat (representing money)
- Show slight separating motion between hands

#### 1️⃣1️⃣ "I WANT TO DEPOSIT MONEY"
**Hand Configuration:**
- **Right Hand**: Flat palm facing downward (depositing)
- **Left Hand**: Open palm facing upward (receiving)
- **Spatial**: Right moving toward left (depositing motion)
- **Detection**: Right palm down, Left palm up, approaching
- **Min Hold**: 3 frames
- **Confidence**: 86%
- **Output**: "I want to deposit money"

**Detection Tips:**
- Right hand flat and facing down
- Left hand flat and facing up
- Simulate placing/depositing motion

#### 1️⃣2️⃣ "HELP ME WITH THIS FORM"
**Hand Configuration:**
- **Right Hand**: Index pointing forward (form reference)
- **Left Hand**: Open palm upward (help request)
- **Spatial**: Right pointing at form, Left asking
- **Detection**: Pointing + open palm gesture
- **Min Hold**: 3 frames
- **Confidence**: 82%
- **Output**: "Help me with this form"

---

### Quick Reference: Retailer Phrases

| # | Gesture | Hands | Confidence | Duration | Industry |
|---|---------|-------|-----------|----------|----------|
| 1 | "I NEED MEDICINE" | 2 | 86% | 3 frames | Pharmacy |
| 2 | "DO YOU HAVE THIS?" | 2 | 84% | 2-3 frames | Pharmacy |
| 3 | "WHAT IS THE DOSAGE?" | 2 | 85% | 3 frames | Pharmacy |
| 4 | "HOW MUCH IS THIS?" | 2 | 83% | 3 frames | Grocery |
| 5 | "GIVE ME THIS" | 2 | 84% | 3 frames | Grocery |
| 6 | "DO YOU HAVE FRESH STOCK?" | 2 | 82% | 3 frames | Grocery |
| 7 | "TAKE ME HERE" | 2 | 85% | 3 frames | Transport |
| 8 | "HOW MUCH FARE?" | 2 | 83% | 2-3 frames | Transport |
| 9 | "IS THIS AVAILABLE?" | 2 | 81% | 2-3 frames | Transport |
| 10 | "I WANT TO WITHDRAW MONEY" | 2 | 87% | 3 frames | Bank |
| 11 | "I WANT TO DEPOSIT MONEY" | 2 | 86% | 3 frames | Bank |
| 12 | "HELP ME WITH THIS FORM" | 2 | 82% | 3 frames | Bank |

---

### Quick Reference Table

| Gesture | Hands | Key Feature | Min. Stability | Confidence |
|---------|-------|-----------|----------------|-----------|
| MY NAME IS | 2 | Perpendicular fingers intersection | 3 frames | 75%+ |
| ARE | 2 | Both thumbs up, symmetrical | 3 frames | 80%+ |
| YOU | 1 | Index pointing forward | 2-3 frames | 70%+ |
| CHOCOLATE | 2 | C-shape over flat palm | 3 frames | 75%+ |
| COFFEE | 2 | Stacked fists vertically | 3 frames | 80%+ |
| HOW MUCH | 1 | Thumb-index pinch (<1cm) | 2-3 frames | 75%+ |
| I LOVE YOU | 1 | 3 fingers extended (ILY) | 3 frames | 75%+ |
| WASHROOM | 1 | Closed fist | 2-3 frames | 80%+ |
| PAIN | 2 | Index tips touching | 3 frames | 80%+ |
| WHERE | 1 | Index pointing up | 2-3 frames | 70%+ |

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


