# Debug Install (Chrome)

These steps load the extension in developer mode using the local build output.

1. Build the extension:
   - `npm install`
   - `npm run build`
2. Open Chrome and go to `chrome://extensions`.
3. Enable `Developer mode` (top right).
4. Click `Load unpacked`.
5. Select the `dist/` folder from this project.
6. Open any webpage, then open the side panel and select the extension.

Notes:
- After any code change, run `npm run build`, then click the refresh icon on the extension card.
- Side panel requires Chrome 114+.
