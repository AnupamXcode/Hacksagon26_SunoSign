# 🧠 SunoSign AI  
### Context-Aware Multi-Hand Sign Language Communication System  

> An AI-powered real-time system that converts sign language gestures into meaningful text and speech using multi-hand tracking, motion intelligence, and context-aware predictions.

---

## 🏆 Problem Statement

Communication for speech-impaired individuals remains inefficient because:

- Most systems only detect **alphabets or static gestures**
- Lack of **context awareness**
- Not suitable for **real-time conversations**
- Require trained interpreters or prior knowledge

**Result:** Slow, impractical, and limited communication.

---

## 💡 Solution

SunoSign AI transforms gesture recognition into **intelligent communication**:

- Detects **both hands simultaneously**
- Understands **gesture sequences**
- Adapts using **context-aware AI**
- Provides **real-time suggestions + speech output**

---

## 🚀 Key Features

### ✋ Multi-Hand Detection
- Detects both hands in real time  
- 42 landmarks (21 per hand)  

### 🎯 Motion Intelligence
- Tracks direction, speed, repetition  
- Improves gesture differentiation  

### 🧩 Gesture Recognition Engine
- Rule-based (fast & stable)  
- Designed for ML scalability  

### 🔗 Sequence-Based Understanding
- Combines gestures into meaningful sentences  

### 🧠 Context-Aware AI (Core USP)
Same gesture → different meanings based on context:

| Context | Example |
|--------|--------|
| Medical | Aspirin |
| Grocery | Apple |
| Bank | Account |
| Transport | Bus |

### ⚡ Smart Suggestions
- Top 3 predictions  
- User confirmation system  

### 🗣️ Text-to-Speech
- Real-time voice output  
- Offline-compatible options  

### 🎨 User Interface
- Live camera feed  
- Hand tracking visualization  
- Predictions + final output  
- Confidence score  

---

## 🔄 System Workflow
Gesture → Detection → Landmarks → Motion Analysis
→ Recognition → Sequence Buffer → Context Engine
→ Suggestions → Sentence → Speech
---


---

## 🧠 Innovation Highlights

- Multi-hand + motion-aware recognition  
- Context-driven AI predictions (major differentiator)  
- Sequence → sentence transformation  
- Human-in-the-loop correction system  
- Real-time assistive communication  

---

## ⚖️ Trade-Offs

| Component | Advantage | Limitation |
|----------|----------|-----------|
| Rule-based system | Fast & reliable | Less adaptive |
| Context engine | Smart outputs | Needs tuning |
| Motion tracking | High accuracy | Noise sensitive |
| Sequence system | Natural sentences | Complexity |

---

## ⚠️ Limitations

- Not full sign language grammar yet  
- Performance depends on lighting conditions  
- Limited dataset for ML expansion  

---

## 🔮 Future Scope

- LSTM / Transformer-based gesture modeling  
- Full sign language grammar understanding  
- Mobile application (Android/iOS)  
- Multilingual speech output  
- Edge AI (offline wearable devices)  
- Two-way communication (Text → Sign)  

---

## 🛠️ Tech Stack

### Frontend
- React + Vite  
- Tailwind CSS  

### Backend / AI
- Python  
- OpenCV  
- MediaPipe  

### Logic Layer
- Rule-based engine  
- Sequence buffer  
- Context-aware system  

### Speech
- Web Speech API / pyttsx3  

---

## 📁 Project Structure

```bash
signflow-ai/
├── node_modules/                # Dependencies
├── public/                      # Static assets
├── src/                         # Source code
│
├── .gitignore                   # Git ignore rules
├── bun.lock                     # Bun lock file
├── bun.lockb                    # Bun binary lock file
├── components.json              # UI components config
├── eslint.config.js             # ESLint configuration
├── index.html                   # Entry HTML file
├── package.json                 # Project dependencies
├── package-lock.json            # Dependency lock file
│
├── playwright.config.ts         # Playwright config
├── playwright-fixture.ts        # Test fixtures
├── vitest.config.ts             # Unit testing config
│
├── postcss.config.js            # PostCSS config
├── tailwind.config.ts           # Tailwind CSS config
│
├── tsconfig.json                # TypeScript config
├── tsconfig.app.json            # App TS config
├── tsconfig.node.json           # Node TS config
│
└── vite.config.ts               # Vite configuration
```
---
### 🌍 Use Cases
-🏥 Hospitals
-🛒 Retail stores
-🏦 Banking
-🚌 Public transport
-🏫 Daily communication

--- 
### 📊 Impact
- Improves accessibility
- Enables real-time interaction
- Reduces dependency on interpreters
- Bridges communication gap
---
### 👥 Team
- Anupam Shrivastava
- Snehal Sathawane
- Sarthaki Fuley
- Shubh Rai
