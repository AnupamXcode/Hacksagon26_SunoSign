# Hand Gesture Feature Rules — SunoSign Classification System

**Last Updated:** April 5, 2026  
**Detection Framework:** MediaPipe Hands 21-point Landmarks  
**Confidence Thresholds:** ≥70% for phrase output

---

## 📌 LANDMARK REFERENCE (21-Point Hand Model)

```
WRIST: 0
THUMB: 1(MCP), 2(PIP), 3(IP), 4(TIP)
INDEX: 5(MCP), 6(PIP), 7(DIP), 8(TIP)
MIDDLE: 9(MCP), 10(PIP), 11(DIP), 12(TIP)
RING: 13(MCP), 14(PIP), 15(DIP), 16(TIP)
PINKY: 17(MCP), 18(PIP), 19(DIP), 20(TIP)
```

**Finger State Detection:**
- **OPEN:** `tip.y < pip.y` (tip above proximal inter-phalangeal joint)
- **CLOSED:** `tip.y ≥ pip.y` (tip below PIP)
- **Thumb Special:** Uses x-axis for horizontal extension (hand-dependent)

---

# PART 1: NUMBER GESTURES (1-9)

## Gesture: "1"

**Conditions:**
- Hand: Right or Left
- Thumb: folded
- Index: extended upward
- Middle: folded
- Ring: folded
- Pinky: folded
- Palm: vertical or forward-facing

**Feature Logic:**
- `[Thumb, Index, Middle, Ring, Pinky] = [FALSE, TRUE, FALSE, FALSE, FALSE]`
- Index tip Y-position < Middle PIP position
- Distance(index_tip, other_fingertips) > threshold (20% of palm size)

**MediaPipe Validation:**
```javascript
thumb = !isThumbOpen(landmarks)
index = landmarks[8].y < landmarks[6].y  // tip < PIP
middle = landmarks[12].y >= landmarks[10].y
ring = landmarks[16].y >= landmarks[14].y
pinky = landmarks[20].y >= landmarks[18].y
```

**Stability Requirement:** Hold for ≥ 5 frames  
**Output Phrase:** "One"

---

## Gesture: "2"

**Conditions:**
- Hand: Right or Left
- Thumb: folded
- Index: extended
- Middle: extended
- Ring: folded
- Pinky: folded
- Palm: vertical

**Feature Logic:**
- `[Thumb, Index, Middle, Ring, Pinky] = [FALSE, TRUE, TRUE, FALSE, FALSE]`
- Both index and middle tips extended upward
- Angle between index and middle < 60°

**Stability Requirement:** Hold for ≥ 5 frames  
**Output Phrase:** "Two"

---

## Gesture: "3"

**Conditions:**
- Hand: Right or Left
- Thumb: folded
- Index: extended
- Middle: extended
- Ring: extended
- Pinky: folded
- Palm: vertical

**Feature Logic:**
- `[Thumb, Index, Middle, Ring, Pinky] = [FALSE, TRUE, TRUE, TRUE, FALSE]`
- Three finger tips extended
- Pinky remains closed

**Stability Requirement:** Hold for ≥ 5 frames  
**Output Phrase:** "Three"

---

## Gesture: "4"

**Conditions:**
- Hand: Right or Left
- Thumb: folded
- Index: extended
- Middle: extended
- Ring: extended
- Pinky: extended
- Palm: vertical

**Feature Logic:**
- `[Thumb, Index, Middle, Ring, Pinky] = [FALSE, TRUE, TRUE, TRUE, TRUE]`
- Four fingers extended, thumb closed
- All finger tips above MCP joints

**Stability Requirement:** Hold for ≥ 5 frames  
**Output Phrase:** "Four"

---

## Gesture: "5"

**Conditions:**
- Hand: Right or Left
- Thumb: extended
- Index: extended
- Middle: extended
- Ring: extended
- Pinky: extended
- Palm: fully open, forward-facing

**Feature Logic:**
- `[Thumb, Index, Middle, Ring, Pinky] = [TRUE, TRUE, TRUE, TRUE, TRUE]`
- All five fingers extended
- Palm distance from wrist > 0.15 (normalized)

**Feature Validation:**
- All finger tips below wrist level OR above it (depending on orientation)
- No fingers curled
- Confidence: ≥85%

**Stability Requirement:** Hold for ≥ 5 frames  
**Output Phrase:** "Five"

---

## Gesture: "6"

**Conditions:**
- Hand: Right or Left
- Thumb: extended (sideways/outward)
- Index: folded
- Middle: folded
- Ring: folded
- Pinky: extended
- Palm: horizontal or rotated 90°

**Feature Logic:**
- `[Thumb, Index, Middle, Ring, Pinky] = [TRUE, FALSE, FALSE, FALSE, TRUE]`
- Thumb and Pinky separated from other fingers
- Angle between thumb and pinky > 90°

**Stability Requirement:** Hold for ≥ 5 frames  
**Output Phrase:** "Six"

---

## Gesture: "7"

**Conditions:**
- Hand: Right or Left
- Thumb: extended
- Index: folded
- Middle: folded
- Ring: extended
- Pinky: folded

**Feature Logic:**
- `[Thumb, Index, Middle, Ring, Pinky] = [TRUE, FALSE, FALSE, TRUE, FALSE]`
- Thumb and Ring finger extended only
- Distance between them > 25% of palm diagonal

**Stability Requirement:** Hold for ≥ 5 frames  
**Output Phrase:** "Seven"

---

## Gesture: "8"

**Conditions:**
- Hand: Right or Left
- Thumb: extended
- Index: folded
- Middle: extended
- Ring: folded
- Pinky: folded

**Feature Logic:**
- `[Thumb, Index, Middle, Ring, Pinky] = [TRUE, FALSE, TRUE, FALSE, FALSE]`
- Thumb and Middle extended only

**Stability Requirement:** Hold for ≥ 5 frames  
**Output Phrase:** "Eight"

---

## Gesture: "9"

**Conditions:**
- Hand: Right or Left
- Thumb: folded
- Index: folded
- Middle: folded
- Ring: folded
- Pinky: extended (only)

**Feature Logic:**
- `[Thumb, Index, Middle, Ring, Pinky] = [FALSE, FALSE, FALSE, FALSE, TRUE]`
- Only Pinky extended, all others closed

**Stability Requirement:** Hold for ≥ 5 frames  
**Output Phrase:** "Nine"

---

# PART 2: DUAL-HAND PHRASE GESTURES

## Gesture: "Hello"

**Conditions:**
- Hand: Both (Left + Right)
- Both hands: fingers extended (≥4 fingers open on each)
- Palm: forward-facing
- Movement: waving motion (horizontal oscillation)

**Feature Logic:**
- Left hand: `fingers_open >= 4`
- Right hand: `fingers_open >= 4`
- Both palms facing camera (z-depth check)
- Wrist oscillation: direction changes ≥ 3 times in 10 frames
- Oscillation amplitude > 0.005 normalized units

**Stability Requirement:** Hold for ≥ 4 frames + wave motion  
**Confidence Threshold:** 85%  
**Output Phrase:** "Hello"

---

## Gesture: "Thank You"

**Conditions:**
- Hand: Right (primary) + optional Left
- Right hand: all fingers extended
- Index finger: extended upward (tip above wrist level)
- Movement: forward motion or static

**Feature Logic:**
- Right hand: `[T, I, M, R, P] = [?, TRUE, ?, ?, ?]` (at least 3+ extended)
- Right index tip Y < Right wrist Y (pointing upward)
- Movement: forward OR static position

**Optional:** One hand making gesture while other is open  
**Stability Requirement:** ≥ 3 frames  
**Confidence Threshold:** 75%  
**Output Phrase:** "Thank You"

---

## Gesture: "Help"

**Conditions:**
- Hand: Both (Left fist + Right open)
- Left hand: fist (≤1 finger extended)
- Right hand: open palm (≥4 fingers extended)
- Spatial: Left fist ON right open palm (distance < 0.15 normalized)

**Feature Logic:**
- Left fingers open: ≤1
- Right fingers open: ≥4
- `distance(left_wrist, right_wrist) < 0.15`
- Palm contact verified

**Stability Requirement:** Hold for ≥ 3 frames  
**Confidence Threshold:** 82%  
**Output Phrase:** "I need help"

---

## Gesture: "Stop"

**Conditions:**
- Hand: Both (Left + Right)
- Both hands: fully open (all 5 fingers extended)
- Palm: facing camera
- Spatial: wrists separated (distance > 0.3 normalized)

**Feature Logic:**
- Left: `[T, I, M, R, P] = [TRUE, TRUE, TRUE, TRUE, TRUE]`
- Right: `[T, I, M, R, P] = [TRUE, TRUE, TRUE, TRUE, TRUE]`
- `distance(left_wrist, right_wrist) > 0.3`
- Both palms forward-facing (z-depth comparison)

**Stability Requirement:** Hold for ≥ 4 frames  
**Confidence Threshold:** 80%  
**Output Phrase:** "Stop"

---

## Gesture: "Yes"

**Conditions:**
- Hand: Right
- Right hand: fist shape (≤1 finger extended, preferably thumb)
- Movement: nodding motion (vertical oscillation)

**Feature Logic:**
- Right fingers open: ≤1
- Right thumb: extended (optional)
- Wrist oscillation: vertical direction changes ≥ 2 times in 6 frames
- Y-axis movement > 0.04 normalized units

**Stability Requirement:** ≥ 2 frames + nodding motion  
**Confidence Threshold:** 72%  
**Output Phrase:** "Yes"

---

## Gesture: "No"

**Conditions:**
- Hand: Right
- Index: extended
- Middle: extended
- Ring: folded
- Pinky: folded
- Thumb: extended
- Movement: snapping or shaking

**Feature Logic:**
- Right: `[T, I, M, R, P] = [TRUE, TRUE, TRUE, FALSE, FALSE]`
- Movement: snap (rapid close/open cycle) OR shake

**Stability Requirement:** ≥ 4 frames of open/close oscillation  
**Confidence Threshold:** 70%  
**Output Phrase:** "No"

---

## Gesture: "I Need Water"

**Conditions:**
- Hand: Right (or both)
- Index: extended
- Middle: extended
- Ring: extended
- Pinky: folded
- Thumb: extended
- Movement: optional hand rotation or static

**Feature Logic:**
- Right: `[T, I, M, R, P] = [TRUE, TRUE, TRUE, TRUE, FALSE]`
- W-shape formed by extended fingers (4 up, 1 down)
- Optional: hand near mouth area

**Stability Requirement:** ≥ 3 frames  
**Confidence Threshold:** 75%  
**Output Phrase:** "I need water"

---

# PART 3: SUNOSIGN FULL-PHRASE GESTURES (16 Distinct Gestures)

## Gesture 1: "My Name Is..."

**Conditions:**
- Hand: Right
- Thumb: extended
- Index: extended
- Middle: folded
- Ring: folded
- Pinky: folded
- Movement: inward (toward body/center)

**Feature Logic:**
- `[T, I, M, R, P] = [TRUE, TRUE, FALSE, FALSE, FALSE]`
- Movement: inward motion (≥ 0.04 normalized displacement toward center)
- Duration: continuous motion over ≥ 4 frames

**Movement Detection:**
```
inwardDist = Math.abs(current_wrist.x - 0.5) - Math.abs(prev_wrist.x - 0.5)
if (inwardDist < -0.04) → INWARD detected
```

**Stability Requirement:** ≥ 4 frames with inward motion  
**Confidence:** 80%  
**Output Phrase:** "My name is..."

---

## Gesture 2: "Father"

**Conditions:**
- Hand: Right
- All fingers: extended
- `[T, I, M, R, P] = [TRUE, TRUE, TRUE, TRUE, TRUE]`
- Palm Orientation: vertical, neutral, or forward
- Movement: static

**Feature Logic:**
- All 5 fingers open
- Palm Z-depth < Wrist Z-depth (forward orientation)
- No significant hand movement
- Orientation != 'down' (distinguishes from Mother)

**Palm Orientation Logic:**
```javascript
dy = middleMcp.y - wrist.y
if (dy < -0.08 && Math.abs(dy) > dx) → orientation = 'vertical'
if (avgZ < wrist.z - 0.02) → orientation = 'forward'
```

**Stability Requirement:** ≥ 3 frames  
**Confidence:** 80%  
**Output Phrase:** "Father"

---

## Gesture 3: "Mother"

**Conditions:**
- Hand: Right
- All fingers: extended
- `[T, I, M, R, P] = [TRUE, TRUE, TRUE, TRUE, TRUE]`
- Palm Orientation: down or horizontal
- Movement: static

**Feature Logic:**
- All 5 fingers open
- dy > 0.08 (palm pointing downward: fingers below wrist)
- Orientation = 'down' OR 'horizontal'

**Stability Requirement:** ≥ 3 frames  
**Confidence:** 80%  
**Output Phrase:** "Mother"

---

## Gesture 4: "See You Later!"

**Conditions:**
- Hand: Right
- All fingers: extended
- `[T, I, M, R, P] = [TRUE, TRUE, TRUE, TRUE, TRUE]`
- Movement: wave (horizontal oscillation)

**Feature Logic:**
- All 5 fingers open
- Wrist horizontal oscillation detected:
  - Direction changes ≥ 3 times in 10 frames
  - X-axis movement > 0.005 between frames
  - Net movement < 30% of total movement (local motion)

**Wave Detection:**
```javascript
dirChangesX = 0
for i=2 to length:
  prev = wristPositions[i-1].x - wristPositions[i-2].x
  curr = wristPositions[i].x - wristPositions[i-1].x
  if (prev * curr < 0 && Math.abs(curr) > 0.005) dirChangesX++
if (dirChangesX >= 3) → WAVE detected
```

**Stability Requirement:** ≥ 6 frames with wave motion  
**Confidence:** 88%  
**Output Phrase:** "See you later!"

---

## Gesture 5: "Cat"

**Conditions:**
- Hand: Right
- Thumb: folded
- Index: extended
- Middle: extended
- Ring: folded
- Pinky: folded
- `[T, I, M, R, P] = [FALSE, TRUE, TRUE, FALSE, FALSE]`
- Movement: static (distinguishes from Repeat)

**Feature Logic:**
- Exactly 2 fingers extended (Index + Middle)
- Ring and Pinky fully closed
- No significant hand movement

**Potential Conflict:** Repeat gesture has same finger pattern but with circular movement  
**Distinguisher:** Movement type is static

**Stability Requirement:** ≥ 3 frames  
**Confidence:** 82%  
**Output Phrase:** "Cat"

---

## Gesture 6: "I Need Help"

**Conditions:**
- Hand: Right
- Thumb: folded
- Index: extended upward
- Middle: folded
- Ring: folded
- Pinky: folded
- `[T, I, M, R, P] = [FALSE, TRUE, FALSE, FALSE, FALSE]`
- Movement: static
- Orientation: vertical or upward

**Feature Logic:**
- Only Index extended
- Index tip Y < Wrist Y (pointing upward)
- No waving or side-to-side motion

**Distinguisher:** Where gesture has same finger pattern but with wave movement

**Stability Requirement:** ≥ 3 frames  
**Confidence:** 85%  
**Output Phrase:** "I need help"

---

## Gesture 7: "Please Repeat"

**Conditions:**
- Hand: Right
- Thumb: folded
- Index: extended
- Middle: extended
- Ring: folded
- Pinky: folded
- `[T, I, M, R, P] = [FALSE, TRUE, TRUE, FALSE, FALSE]`
- Movement: circular

**Feature Logic:**
- Same finger pattern as Cat (2 fingers extended)
- Circular motion detected:
  - Angular displacement calculation over ≥ 8 frames
  - Total angle > π × 1.2 radians (≈216°)

**Circular Motion Detection:**
```javascript
for i=1 to length:
  a1 = atan2(pos[i-1].y - cy, pos[i-1].x - cx)
  a2 = atan2(pos[i].y - cy, pos[i].x - cx)
  da = a2 - a1 (adjust for wraparound)
  totalAngle += da
if (Math.abs(totalAngle) > π * 1.2) → CIRCULAR detected
```

**Stability Requirement:** ≥ 8 frames with circular motion  
**Confidence:** 80%  
**Output Phrase:** "Please repeat"

---

## Gesture 8: "I Am In Pain"

**Conditions:**
- Hand: Right
- All fingers: closed
- `[T, I, M, R, P] = [FALSE, FALSE, FALSE, FALSE, FALSE]`
- Movement: shake (rapid small motion)

**Feature Logic:**
- All finger tips ≥ their PIP positions (fully closed)
- Hand shake detected:
  - Total movement > 0.06 normalized units
  - Net movement < 30% of total (oscillating in place)

**Shake Detection:**
```javascript
totalMovement = sum of distances between consecutive frames
netMovement = distance(first_frame, last_frame)
if (totalMovement > 0.06 && 
    netMovement < totalMovement * 0.3) → SHAKE detected
```

**Stability Requirement:** ≥ 4 frames with shake  
**Confidence:** 78-85% (higher with continued shaking)  
**Output Phrase:** "I am in pain"

---

## Gesture 9: "I Want More"

**Conditions:**
- Hand: Right
- Thumb: extended
- Index: extended
- Middle: folded
- Ring: folded
- Pinky: folded
- `[T, I, M, R, P] = [TRUE, TRUE, FALSE, FALSE, FALSE]`
- Movement: pinch or tapping

**Feature Logic:**
- Thumb and Index extended only
- Distance between thumb and index tips < 20% of palm size
- Optional: pinch oscillation (open-close cycle)

**Pinch Detection:**
```javascript
thumbIndexDist = distance(landmarks[4], landmarks[8])
palmSize = distance(landmarks[0], landmarks[9])
if (thumbIndexDist < palmSize * 0.2) → PINCH detected
```

**Stability Requirement:** ≥ 3 frames  
**Confidence:** 82%  
**Output Phrase:** "I want more"

---

## Gesture 10: "Where Is It?"

**Conditions:**
- Hand: Right
- Thumb: folded
- Index: extended
- Middle: folded
- Ring: folded
- Pinky: folded
- `[T, I, M, R, P] = [FALSE, TRUE, FALSE, FALSE, FALSE]`
- Movement: wave or shake (side-to-side oscillation)

**Feature Logic:**
- Only Index extended
- Horizontal side-to-side motion:
  - Index position X-axis oscillation
  - Direction changes ≥ 2 times in 6 frames
  - Movement > 0.004 between frames

**Movement Detection (WHERE-specific):**
```javascript
indexPositions = recent frames (index tip positions)
dirChanges = 0
for i=2 to length:
  prev = indexPositions[i-1].x - indexPositions[i-2].x
  curr = indexPositions[i].x - indexPositions[i-1].x
  if (prev * curr < 0 && Math.abs(curr) > 0.004) dirChanges++
if (dirChanges >= 2) → SIDE-TO-SIDE detected
```

**Distinguisher:** Help gesture has static index; Where has side-to-side motion

**Stability Requirement:** ≥ 4 frames with oscillation  
**Confidence:** 82%  
**Output Phrase:** "Where is it?"

---

## Gesture 11: "Where Is The Restroom?"

**Conditions:**
- Hand: Right
- Thumb: folded
- Index: extended
- Middle: extended
- Ring: extended
- Pinky: folded
- `[T, I, M, R, P] = [FALSE, TRUE, TRUE, TRUE, FALSE]`
- Palm Orientation: vertical or up
- Movement: static

**Feature Logic:**
- Exactly 3 fingers extended (Index, Middle, Ring)
- Pinky closed
- Orientation == 'vertical' OR 'up' (palm pointing upward/forward)
- No significant movement

**Distinguisher:** Restroom orientation is vertical (3-finger salute); unique among 3-finger gestures

**Stability Requirement:** ≥ 3 frames  
**Confidence:** 85%  
**Output Phrase:** "Where is the restroom?"

---

## Gesture 12: "I Love You"

**Conditions:**
- Hand: Right
- Thumb: extended
- Index: extended
- Middle: folded
- Ring: folded
- Pinky: extended
- `[T, I, M, R, P] = [TRUE, TRUE, FALSE, FALSE, TRUE]`
- Movement: none or gentle movement

**Feature Logic:**
- Exactly 3 fingers extended: Thumb, Index, Pinky
- Ring and Middle completely closed
- Thumb-Index angle: varied (can be wide or close)
- This configuration forms the "I Love You" sign

**Distinctiveness:** 92% confidence (very unique fingerprint)

**Stability Requirement:** ≥ 3 frames  
**Confidence:** 92% (highest after validation)  
**Output Phrase:** "I love you"

---

## Gesture 13: "How Are You?"

**Conditions:**
- Hand: Right
- All fingers: extended
- `[T, I, M, R, P] = [TRUE, TRUE, TRUE, TRUE, TRUE]`
- Movement: forward (toward camera)

**Feature Logic:**
- All 5 fingers open
- Wrist Z-coordinate decreasing over time (moving forward in depth)
- Forward displacement > 0.03 normalized depth units

**Forward Motion Detection:**
```javascript
zChange = recent[0].wrist.z - recent[last].wrist.z
if (zChange > 0.03) → FORWARD movement detected
```

**Stability Requirement:** ≥ 4 frames with forward motion  
**Confidence:** 82%  
**Output Phrase:** "How are you?"

---

## Gesture 14: "How Much Does It Cost?"

**Conditions:**
- Hand: Right
- Thumb: extended
- Index: extended
- Middle: folded
- Ring: folded
- Pinky: folded
- `[T, I, M, R, P] = [TRUE, TRUE, FALSE, FALSE, FALSE]`
- Movement: pinch gesture

**Feature Logic:**
- Thumb and Index extended only
- Thumb-Index distance < 20% of palm size
- Optional: pinching motion (oscillating close/open)

**Distinguisher:** More gesture also has [T,I] pattern; How Much has pinch movement

**Stability Requirement:** ≥ 3 frames  
**Confidence:** 82%  
**Output Phrase:** "How much does it cost?"

---

## Gesture 15: "I Want Chocolate"

**Conditions:**
- Hand: Right
- All fingers: extended
- `[T, I, M, R, P] = [TRUE, TRUE, TRUE, TRUE, TRUE]`
- Movement: inward (toward body)

**Feature Logic:**
- All 5 fingers open
- Inward motion (wrist moving toward center/body):
  - `inwardDist = Math.abs(current_wrist.x - 0.5) - Math.abs(prev_wrist.x - 0.5)`
  - `inwardDist < -0.04` (moving toward horizontal center)
- Duration: ≥ 4 frames

**Distinguisher:** Father/Mother/How Are You all have all-open fingers; Chocolate has inward movement

**Stability Requirement:** ≥ 4 frames with inward motion  
**Confidence:** 78%  
**Output Phrase:** "I want chocolate"

---

## Gesture 16: "I Want Coffee"

**Conditions:**
- Hand: Right
- Thumb: extended
- Index: folded
- Middle: folded
- Ring: folded
- Pinky: extended
- `[T, I, M, R, P] = [TRUE, FALSE, FALSE, FALSE, TRUE]`
- Movement: tilt or static

**Feature Logic:**
- Thumb and Pinky extended (other fingers closed)
- Movement: tilt (wrist rotation) OR static
- Thumb-Pinky separation > 90°

**Tilt Motion Detection:**
```javascript
if (Math.abs(last.y - first.y) > 0.04 && 
    Math.abs(last.x - first.x) < 0.02) → TILT detected
```

**Stability Requirement:** ≥ 3 frames  
**Confidence:** 80%  
**Output Phrase:** "I want coffee"

---

# PART 4: DISAMBIGUATION MATRIX

| Finger Pattern | Movement | Additional Condition | Output |
|---|---|---|---|
| [0,1,0,0,0] | Static | Upward orientation | Help |
| [0,1,0,0,0] | Wave/Shake | Side-to-side | Where? |
| [0,1,0,0,0] | Inward | Toward body | My Name Is |
| [0,1,1,0,0] | Static | None | Cat |
| [0,1,1,0,0] | Circular | Continuous rotation | Repeat |
| [0,1,1,1,0] | Static | Vertical orientation | Restroom |
| [1,0,0,0,1] | Tilt/Static | Hand rotation | Coffee |
| [1,1,0,0,0] | Pinch | Thumb-Index close | How Much? |
| [1,1,0,0,1] | Static | Unique signature | I Love You |
| [1,1,1,0,0] | Static | None | More |
| [1,1,1,1,0] | Static | None | Water |
| [1,1,1,1,1] | Static | Down/Horizontal | Mother |
| [1,1,1,1,1] | Static | Vertical/Forward | Father |
| [1,1,1,1,1] | Wave | Horizontal oscillation | See You Later! |
| [1,1,1,1,1] | Forward | Depth decrease | How Are You? |
| [1,1,1,1,1] | Inward | Toward center | Chocolate |
| [0,0,0,0,0] | Shake | Rapid oscillation | Pain |

---

# PART 5: STABILITY & VALIDATION RULES

## Frame Holding Requirements
- **Numbers (1-9):** ≥ 5 consecutive frames
- **Dual-hand Phrases:** ≥ 3-4 frames depending on movement
- **SunoSign Gestures:** ≥ 3-6 frames depending on movement complexity

## Confidence Thresholds for Output
- **Number Output:** ≥70% (after 5-frame hold)
- **Phrase Output:** ≥75% (after frame hold)
- **Main Gesture Output:** ≥78% (varies by gesture: 72%-92%)

## Cooldown Between Detections
- **Same Gesture:** 1000ms cooldown (previously 2000ms)
- **Different Gesture:** 100ms transition time
- **Purpose:** Prevent duplicate detection spam

## Motion History Tracking
- **MAX_HISTORY:** 20 frames
- **Sampling Rate:** 33ms per frame (30 FPS)
- **Lookback Window:** 6-10 frames for movement analysis
- **Total Memory:** ~660ms of gesture history

---

# PART 6: IMPLEMENTATION CHECKLIST

- [x] Number detection (1-9): tested and validated
- [x] Dual-hand phrases (Hello, Thank You, Help, Stop, Yes, No, Water): implemented
- [x] SunoSign gestures (16 distinct): full classification
- [x] Movement detection: wave, shake, circular, forward, inward, tilt
- [x] Palm orientation: down, up, vertical, horizontal, forward, neutral
- [x] Ambiguity resolution: movement-based disambiguation
- [x] Confidence scoring: 70-92% range validation
- [x] Frame rate optimization: 33ms (30 FPS) detection
- [x] Stability thresholds: 3-6 frame hold requirements

---

# PART 7: FUTURE ENHANCEMENTS

**Planned Additions:**
- [ ] Hand orientation angles (pitch, roll, yaw)
- [ ] Finger curvature depth estimation
- [ ] Two-handed symmetry detection
- [ ] Gesture trajectory recording (for handwriting)
- [ ] Confidence weighting by individual landmark quality
- [ ] Custom gesture training pipeline

---

**Document Version:** 1.0  
**Last Validation:** April 5, 2026  
**Gesture Count:** 25 total (9 numbers + 7 phrases + 16 SunoSign + base features)
