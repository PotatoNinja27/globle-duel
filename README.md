# Globle Duel

Two-player competitive geography game inspired by Globle. Backend in Node.js/Express with Socket.io; frontend is vanilla JS and SVG.

## Project Structure

- `server/` – Node server, game logic, country data and border adjacency.
- `client/` – static front-end files.

## Setup (on your machine)

1. Ensure Node.js is installed (`node` + `npm`).
2. Install dependencies:
   ```powershell
   cd .\globle-duel
   npm install
   ```
3. Build the border adjacency dataset (only needed if you update `borders_raw.csv`):
   ```powershell
   cd .\globle-duel\server
   node buildBorders.js
   ```
   This reads `borders_raw.csv` and produces `borders.json` keyed by ISO2 codes.

4. Start the development server:
   ```powershell
   cd .\globle-duel
   npm run dev   # or npm start
   ```
   The app listens on http://localhost:3000 by default.

5. Open two browser windows, go to the URL, create a room in one and join from the other with the generated code.
   - Enter a player name before creating/joining.
   - The globe spins slowly and you can zoom (mouse wheel) and pan (click-drag).
   - Guess by typing or clicking a country on the map.
   - Adjacent-country guesses display an "🤝 Borders mystery country!" tag and a toast message; they are treated as zero distance (hot red). Correct guesses end the game.

## Useful Scripts

- `server/testDistance.js` tests the distance/adjacency logic in isolation.
- `server/testGame.js` simulates a two-player game and prints adjacency results.

## Notes

- Distances are currently computed between country centroids; bordering countries are forced to distance 0 for gameplay.
- Map handling uses an SVG (`/world.svg`) and supports zoom/pan via mouse interactions.

## Development

- Modify server-side logic in `server/*.js`; restart server to reload (nodemon watches files).
- Change front-end code in `client/*.js` or `client/style.css`; refresh browser.

Happy hacking!"}