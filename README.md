# FOCUSFORGE — Personal Growth & Deep Focus Application

**FOCUSFORGE** is a premium, responsive, local-first web application designed to help students, developers, and young adults overcome procrastination, build discipline, track daily habits, conquer distractions, and cultivate laser focus without shame or guilt.

---

## 🌟 Key Features

### 1. 🛡️ Frictionless Onboarding & Goal Customization
- **Welcome Experience:** Introduces the app's ethos and allows users to set their display name and primary growth goals (e.g., college study, phone detox, daily reading, coding, fitness).
- **Customizable Anytime:** Goals and display name can be updated at any moment in the Settings view.

### 2. ⚡ Science-Backed Focus Recovery Mode (The 2-Minute Rule)
- **Break Inertia Without Shame:** When procrastination strikes, willpower often fails because the brain overestimates the pain of starting.
- **Micro-Action Shuffler:** Generates low-friction, 60-second starter tasks (e.g., "Clear your desk and open only the single tab you need", "Drink a glass of water and write 1 sentence").
- **2-Minute Reset Timer:** Fast countdown with positive reinforcement upon completion (+15 XP).
- **Direct Bridge to Deep Work:** Smoothly transitions into a 15-minute sprint or a 25-minute Pomodoro session once momentum is established.

### 3. ⏳ Precision Countdown Focus Timer
- **Interval Presets:** 5-minute Micro Burst, 15-minute Power Sprint, 25-minute Pomodoro, 45-minute Deep Forge, and custom minute duration (1–120 mins).
- **Background-Safe Precision:** Compensates for browser tab throttling and background suspension by tracking timestamp differences (`targetEndTime - Date.now()`). The timer never drifts or loses time.
- **Circular SVG Progress Ring:** Real-time visual progress ring rendered with dynamic SVG stroke offsets.
- **Built-in Web Audio API Synthesizers:**
  - Pleasant 3-harmonic meditation bell chime on session completion.
  - Generative ambient focus audio: **Gentle Rain**, **432Hz Binaural Beat**, and **Calming Pink Noise** (zero external MP3 files needed).
- **Anti-Exploit Reward Protection:** XP is only awarded when the timer genuinely finishes. Duplicate claims on page refresh or rapid clicking are strictly prevented.

### 4. 🎯 Daily Missions
- **Tactical Objectives:** Add, edit, prioritize (High, Medium, Low), and complete daily tasks.
- **Smart Anti-Exploit XP Guard:** Each mission awards +25 XP upon completion. Repeatedly checking and unchecking the same mission prevents duplicate XP farming.
- **Priority Filtering:** Filter missions by All, High, Medium, or Low priority.

### 5. ⚡ Habit Discipline Matrix
- **7-Day Rolling History:** Interactive matrix tracking habit completion across the current week.
- **Non-Punitive Streak Recovery:** Missed a day? Your historical data remains safe. Rebound immediately today without demoralizing penalties.
- **Categories:** Mind & Learning, Health & Fitness, Focus & Deep Work, and Morning/Night Routines.

### 6. 🔍 Distraction Detective
- **Voluntary Interruption Logger:** Log triggers as they occur (Social Media, Notifications, Noise, Tiredness, Unclear Tasks, Mind Wandering).
- **Transparent Privacy:** Explicitly communicates that the app does *not* monitor personal apps or browser tabs; it operates solely on self-reported inputs.
- **Smart Countermeasure Recommendations:** Dynamically analyzes your #1 focus killer and suggests actionable, practical solutions.
- **Interactive Breakdown Chart:** Visual distribution of interruptions.

### 7. 🧠 Mind Journal & Daily Reflection
- **Daily Check-in:** Log overall mood (5-point emoji scale), perceived concentration level (1–5 slider), "What went well today?", and "One improvement for tomorrow".
- **Local Privacy Notice:** Explicitly reminds users that data is stored locally in unencrypted browser storage.
- **Reflection History:** View and edit past entries to observe psychological growth over time.

### 8. 📊 Real Data Analytics
- **Total Focus Hours:** Real sum of completed focus sessions.
- **Weekly Adherence Trends:** Focus minutes by day (last 7 days) and habit completion percentages.
- **28-Day Activity Heatmap:** Visual streak density calendar showing high-focus vs. low-focus days.
- **Offline Reliability:** Uses Chart.js with an automatic native canvas fallback so charts always render even without an internet connection.

### 9. 🏆 Transparent Gamification & Badge System
- **Clear Progression Formula:** `Level = floor(sqrt(XP / 50)) + 1` with a real-time progress bar.
- **XP Rules Transparency:** Full modal detailing exact rewards for every constructive action.
- **Prestige Badges:** Unlockable badges for milestones (First Forge, 3-day streak, 7-day streak, Deep Diver, Inertia Breaker, etc.).
- **Vanilla Canvas Confetti:** Lightweight celebratory particle burst on level-up and milestone achievements.

### 10. ⚙️ Settings, Portability & Privacy
- **Theme Switcher:** Dark Navy with electric blue/violet accents and Clean Slate light mode.
- **Browser Desktop Notifications:** Opt-in system requesting official browser notification permissions.
- **Data Export (JSON):** Download a full backup of all your data with one click.
- **Data Import (JSON):** Restore your backup with schema validation.
- **Danger Zone:** Secure reset with double-confirmation prompt.

---

## 🛠️ Technology Stack
- **HTML5:** Semantic, accessible markup.
- **CSS3:** Custom properties (CSS variables), responsive flexbox and grid layouts, glassmorphism, animations.
- **Vanilla JavaScript (ES6+):** Clean, modular, zero-dependency codebase.
- **Web Audio API:** Hardware-accelerated audio synthesis for chimes and ambient focus sounds.
- **HTML5 Canvas:** Native particle celebration confetti and chart fallback.
- **LocalStorage API:** Robust persistence with automatic error recovery.

---

## 🚀 How to Run Locally

Because FOCUSFORGE is built with zero build tools or external server dependencies, it runs directly in any modern web browser:

### Option 1: Direct File Launch
Double-click `index.html` or drag and drop it into **Google Chrome**, **Microsoft Edge**, **Mozilla Firefox**, or **Safari**.

### Option 2: Local HTTP Server (Optional)
If you prefer running via a local server:

**Using Python 3:**
```bash
python -m http.server 8080
```
Then navigate to `http://localhost:8080` in your browser.

**Using Node.js (`npx serve`):**
```bash
npx serve .
```

---

## 🧪 Testing Verification Checklist

| Feature | Test Case | Expected Behavior | Status |
| :--- | :--- | :--- | :---: |
| **Onboarding** | Fresh visit without prior storage | Modal appears; saves user preferences and display name | Passed |
| **Timer** | Start 5m, 15m, 25m, 45m | Digital countdown and SVG ring update smoothly | Passed |
| **Tab Blur** | Switch away from tab during countdown | Timer stays accurate using timestamp difference | Passed |
| **Audio** | Toggle ambient noise & finish timer | Web Audio API plays binaural/rain and completion chime | Passed |
| **Missions** | Add, edit, check, uncheck | Status updates; unchecking does not allow duplicate XP exploit | Passed |
| **Habits** | Click 7-day checkboxes | Dates persist; calculates streaks correctly; awards +20 XP once/day | Passed |
| **Recovery** | Run 2-minute reset challenge | Timer counts down; awards +15 XP; bridges to 15m/25m sprint | Passed |
| **Journal** | Save mood, concentration, notes | Saves locally; awards +30 XP once/day; renders in history | Passed |
| **Distraction** | Log interruption categories | Stores log; chart updates; shows targeted countermeasure | Passed |
| **Analytics** | View metrics and charts | Computes real focus hours, top day, and 28-day heatmap | Passed |
| **Backup** | Export & Import JSON | Backup file downloaded; valid JSON restored accurately | Passed |
| **Responsiveness** | Mobile vs Desktop screen | Bottom navigation appears on mobile; sidebar collapses smoothly | Passed |

---

## 📄 License
MIT License. Free to use, study, and customize for personal growth and education.
