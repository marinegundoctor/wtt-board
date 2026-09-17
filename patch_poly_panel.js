const fs = require('fs');
const file = 'src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Rename the section
content = content.replace(
  '                Polymarket Live Odds',
  '                Setka Cup on Polymarket'
);

// 2. Update the filter
const oldFilter = \`                  {liveScores.filter(score => {
                    if (globalFilter === "All") return true;
                    if (globalFilter === "WTT") return score.league.toLowerCase().includes("wtt");
                    if (globalFilter === "Setka") return !score.league.toLowerCase().includes("wtt");
                    return true;
                  }).map((score, i) => (\`;

const newFilter = \`                  {liveScores.filter(score => score.league.toLowerCase().includes("setka")).map((score, i) => (\`;

content = content.replace(oldFilter, newFilter);

fs.writeFileSync(file, content);
