# People Operations Excellence — XYZ Company

Static, self-contained site: plain HTML, CSS and vanilla JS. No build step, no server.

Open `index.html` directly, or upload the whole folder to any static host.

- **GitHub Pages:** push to a repo, Settings > Pages > deploy from branch root. `.nojekyll` is included.
- **Netlify / Vercel:** drag the folder in. No build command; publish directory is the root.
- **Your own site:** upload the folder to a sub-path (for example `/case-study/`). All paths are relative.

Content lives in `assets/content.js` (the source text, one block per module). Edit it and refresh. It is a `.js` file, not `.json`, so the site also works when opened from disk.
