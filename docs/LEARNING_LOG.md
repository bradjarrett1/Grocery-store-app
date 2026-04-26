# Learning Log: Grocery App Project

This file tracks questions, concepts, and technical hurdles encountered during the development of the Grocery App.

---

## Session: February 28, 2026

### Q: What is an expo development server or expo router?
**A:** 
- **Expo development server:** A local server (`npx expo start`) that bundles your JavaScript and serves it to the Expo Go app or a development build. It enables "Fast Refresh" (instant UI updates).
- **Expo Router:** A file-based routing library for React Native (like Next.js). Files in the `app/` directory automatically become routes. It uses `_layout.tsx` for shared UI and groups like `(auth)` for organization.

---

### Q: What is npx and npm?
**A:** 
- **npm (Node Package Manager):** A tool to install libraries, manage dependencies in `package.json`, and share JS packages.
- **npx (Node Package Executor):** A tool to run packages without installing them globally (e.g., `npx expo start`). It ensures you use the version defined in your local project.

---

### Q: My terminal in Cursor has issues scrolling (jumping to top).
**A:** This is often caused by "Mouse Reporting" in the terminal.
- **Fix:** Disable `Terminal > Integrated: Mouse Reporting` in Cursor settings.
- **Other Fixes:** Disable `Scroll On Output`, or hold `Shift` while using the trackpad to bypass CLI intercepts.

---

### Q: What is a pip install? (Note: Related to separate Language bot development in antigravity IDE)
**A:** The package installer for Python (similar to `npm`). It downloads and installs Python libraries from the Python Package Index (PyPI).

---

### Q: What is expo go versus a development build?
**A:** 
- **Expo Go:** A pre-made app from the App Store. It’s like a "shared car"—fast and easy, but you can’t customize the engine (the native code).
- **Development Build:** Your own custom version of Expo Go. It’s like a "custom car"—you build it yourself so you can add specific native features that Expo Go doesn't support.

---
