# Troubleshooting Guide

## Issue: Output Not Showing

### ✅ Fixed Issues:
1. **MacroCard Component Error** - Fixed by moving the component outside the App function to prevent recreation on each render
2. **ESLint Errors** - All resolved, lint passes cleanly
3. **Build Errors** - Build completes successfully

### Current Status:
- ✅ Dev server running on `http://localhost:5174/`
- ✅ No compilation errors
- ✅ No linting errors
- ✅ Build successful

## How to Verify the Application is Working

### Step 1: Check Dev Server
The dev server should be running. You should see:
```
VITE v8.0.16  ready in 270 ms
➜  Local:   http://localhost:5174/
```

### Step 2: Open in Browser
1. Open your browser
2. Navigate to: `http://localhost:5174/`
3. You should see the VitalNourish dashboard

### Step 3: What You Should See

#### On Page Load:
1. **Top Navigation Bar** - "VitalNourish" logo with menu items
2. **Sidebar** (on desktop) - Navigation menu on the left
3. **Hero Section** - Large title "Nourish Your Body, Empower Your Life"
4. **Macro Cards** - Three circular progress rings for Carbs, Protein, Fat
5. **AI Nutrition Planner** - Green form with diet goal dropdown
6. **Weekly Calendar** - Monday's meals visible
7. **Nutrition Tips** - Four cards at the bottom
8. **Footer** - Links and copyright

#### To Test AI Functionality:
1. Scroll to the "AI Nutrition Planner" section (green background)
2. Select a diet goal from dropdown
3. Enter calories (default is 2000)
4. Click "Generate Plan"
5. Wait for AI to generate the plan
6. You should see a new section with 7 tabs (Day 1-7)
7. Click on tabs to see different days

## If Nothing Shows Up

### Check 1: Browser Console
1. Press F12 to open Developer Tools
2. Go to Console tab
3. Look for any errors (red text)
4. Common issues:
   - CORS errors
   - JavaScript errors
   - Missing .env file

### Check 2: Environment Variable
Make sure you have a `.env` file in the root directory:
```env
VITE_GROQ_API_KEY=your_actual_api_key_here
```

### Check 3: Clear Browser Cache
1. Press Ctrl+Shift+Del (Windows) or Cmd+Shift+Del (Mac)
2. Clear cached images and files
3. Refresh the page (Ctrl+R or Cmd+R)

### Check 4: Restart Dev Server
```bash
# Stop the current server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

### Check 5: Rebuild
```bash
npm run build
npm run preview
```

## Browser Compatibility

The application should work on:
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️ IE11 not supported

## Port Issues

If you see "Port 5173 is in use, trying another one...", the app will use port 5174 instead. This is normal and expected.

## Network Issues

If the dev server runs but you can't access it:
1. Check if any firewall is blocking localhost
2. Try 127.0.0.1:5174 instead of localhost:5174
3. Make sure no VPN is interfering

## Still Having Issues?

### Diagnostic Commands:

```bash
# Check if node_modules are installed correctly
npm install

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules
rm package-lock.json
npm install

# Check Node version (should be 16+)
node --version

# Check npm version
npm --version
```

### File Integrity Check:

Make sure these files exist:
- ✅ src/App.jsx (should be ~460 lines)
- ✅ src/App.css (should have glass-card styles)
- ✅ src/main.jsx (React entry point)
- ✅ index.html (should have Tailwind CDN)
- ✅ .env (should have your Groq API key)

### Quick Test:

Create a simple test file to verify React is working:

```bash
# Create test file
echo "console.log('App loaded successfully!')" >> src/test.js
```

Then add to App.jsx top:
```javascript
console.log('VitalNourish App Loaded!');
```

Refresh browser and check Console (F12) - you should see the message.

## Success Indicators

You'll know it's working when you see:
1. Green "VitalNourish" header at the top
2. Sidebar with "Nourish Coach" on the left (desktop)
3. Large hero image on the right side
4. Three colorful macro cards (Carbs, Protein, Fat)
5. Green AI planner form
6. Bottom tips section with icons

## Need More Help?

Check these files for reference:
- `CHANGES.md` - Complete list of what was changed
- `README.md` - Full project documentation
- Browser DevTools Console - Real-time error messages
