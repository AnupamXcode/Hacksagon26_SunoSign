# 🔧 TROUBLESHOOTING GUIDE

## Quick Fix Index

### "Gestures not detecting"
→ [Solution 1](#solution-1-gestures-not-detecting)

### "Retailer mode not working"
→ [Solution 2](#solution-2-retailer-mode-not-working)

### "User mode not working"
→ [Solution 3](#solution-3-user-mode-not-working)

### "Context not switching"
→ [Solution 4](#solution-4-context-not-switching)

### "App not starting"
→ [Solution 5](#solution-5-app-not-starting)

### "Low FPS / Laggy"
→ [Solution 6](#solution-6-low-fps--laggy)

### "Build errors"
→ [Solution 7](#solution-7-build-errors)

---

## SOLUTION 1: Gestures Not Detecting

### Check 1: Camera Permission
```
❌ Camera disabled?
✅ Solution: Go to browser settings → Allow camera access
```

### Check 2: Lighting
```
❌ Too dark?
✅ Solution: Ensure good lighting (natural or balanced)

❌ Too bright/glare?
✅ Solution: Reduce backlight or reposition
```

### Check 3: Hand Visibility
```
❌ Hand not fully in frame?
✅ Solution: Keep entire hand in green box

❌ Hand too close?
✅ Solution: Extend arm slightly

❌ Hand too far?
✅ Solution: Move closer to camera
```

### Check 4: Gesture Position
```
❌ Finger not straight enough?
✅ Solution: Extend fingers more clearly

❌ Hand not at right angle?
✅ Solution: Adjust hand orientation
```

---

## SOLUTION 2: Retailer Mode Not Working

### Step 1: Check Mode is Selected
```javascript
// Open Console (F12) and run:
// Should see "retailer" mode
```

### Step 2: Switch Modes
```
1. Look for [👤 User] [🏪 Retailer] buttons
2. Click Retailer button
3. Check button is highlighted
4. Try gesture again
```

### Step 3: Check File Exists
```bash
# Verify retailerGestureEngine.js exists:
# src/lib/retailerGestureEngine.js

# In terminal:
ls src/lib/retailerGestureEngine.js
# Should show: src/lib/retailerGestureEngine.js

# If missing, rebuild:
npm run build
```

### Step 4: Rebuild App
```bash
npm run build
npm run dev

# Visit http://localhost:5173
# Test retailer mode again
```

---

## SOLUTION 3: User Mode Not Working

### Step 1: Verify Switch to User
```
1. Look for [👤 User] [🏪 Retailer] buttons  
2. Click User button
3. Check button is highlighted
```

### Step 2: Test Basic Gesture
```
1. Make simple 'A' gesture (closed fist, thumb to side)
2. Wait 2-3 seconds
3. Check for detection

If no detection:
→ Check Solution 1: Gestures Not Detecting
```

### Step 3: Check Console for Errors
```
1. Open DevTools (F12)
2. Go to Console tab
3. Look for red errors
4. Report errors to documentation
```

---

## SOLUTION 4: Context Not Switching

### Check 1: Button Visible
```
❌ Don't see [👤 User] [🏪 Retailer] buttons?
✅ Solution: Scroll to top of page
```

### Check 2: Button Clickable
```
❌ Button not responding?
✅ Solution: 
   1. Try clicking again
   2. Refresh page (F5)
   3. Wait for app to fully load
```

### Check 3: Mode Actually Changed
```javascript
// Open Console (F12) and run:
console.log('App state should show new context')

// Or check the output:
// It should say "context: user" or "context: retailer"
```

### Check 4: App State
```bash
# Restart app completely:
1. Close app tab
2. Clear browser cache (Ctrl+Shift+Del)
3. Visit http://localhost:5173 again
4. Try context switching
```

---

## SOLUTION 5: App Not Starting

### Check 1: Port in Use
```bash
# If port 5173 is taken:
npm run dev -- --port 5174

# Then visit http://localhost:5174
```

### Check 2: Build Issues
```bash
# Clean rebuild:
rm -r dist node_modules
npm install
npm run build
npm run dev
```

### Check 3: Dependencies Installed
```bash
# Check packages:
npm list

# If broken, reinstall:
npm install
npm run build
```

### Check 4: Node Version
```bash
# Check Node version (need 16+):
node --version

# Update if needed:
nvm install 18
nvm use 18
```

---

## SOLUTION 6: Low FPS / Laggy

### On Mobile
```
✅ Expected: 12-18 FPS
❌ Lower than 12?

Solutions:
1. Close other browser tabs
2. Disable other camera apps
3. Move to better light
4. Use newer phone
```

### On Desktop
```
✅ Expected: 20-30 FPS
❌ Lower than 20?

Solutions:
1. Close heavy applications
2. Update GPU drivers
3. Use Firefox/Chrome (not Edge)
4. Reduce resolution (zoom out)
```

### On Tablet
```
✅ Expected: 15-22 FPS
❌ Lower than 15?

Solutions:
1. Restart app
2. Close background apps
3. Ensure good connection
4. Try WiFi if on cellular
```

---

## SOLUTION 7: Build Errors

### Error: "Cannot find module"
```bash
# Try:
npm install

# Rebuild:
npm run build

# If still fails:
rm -r node_modules package-lock.json
npm install
npm run build
```

### Error: "PORT 5173 in use"
```bash
# Use different port:
npm run dev -- --port 5174

# Or kill port 5173:
# Windows: You need to find the process using port 5173
# Then restart: npm run dev
```

### Error: "Vite compilation failed"
```bash
# Clear cache:
rm -r dist .vite

# Rebuild:
npm run build

# If still fails, check:
npm list
npm install
npm run build
```

---

## ADVANCED TROUBLESHOOTING

### Enable Debug Mode
```javascript
// In browser console (F12):
localStorage.setItem('debug:gesture', 'true');
localStorage.setItem('debug:context', 'true');

// Reload page
location.reload();

// Now check console for detailed logs
```

### Check Network Issues
```
1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Look for any red/failed requests
5. Check the response content
```

### Check Performance
```
1. Open DevTools (F12)
2. Go to Performance tab  
3. Record for 3-5 seconds
4. Stop and analyze
5. Look for big gaps (heavy operations)
```

### Export Debug Info
```javascript
// In console:
const context = {
  userAgent: navigator.userAgent,
  fps: 'measured in app',
  mode: 'from app state',
  hasCamera: 'check browser',
  timestamp: new Date().toISOString()
};
console.table(context);
```

---

## WHEN ALL ELSE FAILS

### Nuclear Option: Complete Reset
```bash
# 1. Stop any running servers
# Ctrl+C

# 2. Delete everything except source
cd d:\Main\Hacksagon26_SunoSign
rm -r dist node_modules .vite

# 3. Fresh install
npm install

# 4. Fresh build
npm run build

# 5. Run dev
npm run dev

# 6. Visit http://localhost:5173
```

### Check File Integrity
```bash
# Verify new files exist:
ls src/lib/retailerGestureEngine.js
ls src/lib/contextAwareGesture.js

# Should both exist and have content
```

### Network Reset (If Using Remote)
```
1. Close all browser tabs
2. Clear browser cache (Ctrl+Shift+Delete)
3. Restart browser
4. Visit http://localhost:5173 (or your URL)
5. Accept camera permission
6. Test again
```

---

## GETTING HELP

### For Gesture Detection Issues
👉 See: [SEPARATE_GESTURE_MODES.md](SEPARATE_GESTURE_MODES.md#troubleshooting)

### For API/Integration Issues
👉 See: [SEPARATE_GESTURE_MODES.md - API Documentation](SEPARATE_GESTURE_MODES.md#api-documentation)

### For Implementation Details
👉 See: [IMPLEMENTATION_COMPLETION_REPORT.md](IMPLEMENTATION_COMPLETION_REPORT.md)

### Quick Reference
👉 See: [GESTURE_MODES_QUICK_REF.md](GESTURE_MODES_QUICK_REF.md)

---

## COMMON ISSUES & QUICK FIXES

| Issue | Quick Fix | Details |
|-------|-----------|---------|
| No detection | Check camera permission | Settings → Camera → Allow |
| Retailer mode broken | Rebuild app | `npm run build` then `npm run dev` |
| Laggy on phone | Close other apps | Free up device memory |
| Port in use | Use different port | `npm run dev -- --port 5174` |
| Module error | Reinstall deps | `npm install` |
| Context not changing | Refresh page | `F5` or `Ctrl+R` |

---

## TEST YOUR FIX

After applying a solution, do this quick test:

```
1. Open http://localhost:5173
2. Allow camera permission
3. See mode buttons (User | Retailer)
4. Click Camera button
5. Make "A" gesture
6. Should see detection in console/display
7. Switch to other mode
8. Make "A" gesture again
9. Should work in both modes
```

---

## Still Not Working?

### Collect This Info
```
- Browser: (Chrome/Firefox/Safari/Edge)
- OS: (Windows/Mac/Linux)
- Device: (Desktop/Mobile/Tablet)
- Error message: (exact text)
- Steps you took: (reproduction steps)
- Screenshot: (of the issue)
```

### Then Report
Document all info in an issue with the above details.

---

## FEATURE VERIFICATION CHECKLIST

After any fix, verify:

- [ ] App loads (http://localhost:5173)
- [ ] Camera works
- [ ] User mode: can detect A-Z
- [ ] Retailer mode: can detect A-Z
- [ ] Mode switching: smooth
- [ ] No console errors (F12)
- [ ] Reasonable FPS (10+ FPS)
- [ ] Context shows in output

If all pass: ✅ **You're good!**

---

**Last Resort:** Check the documentation files for your specific issue!
