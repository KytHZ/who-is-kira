// Self-check of the game rules: node check.js
const assert = require('assert');
const html = require('fs').readFileSync(__dirname + '/who-is-kira.html', 'utf8');
const core = html.match(/<script id="core">([\s\S]*?)<\/script>/)[1];
const { newGame, seal, nextTurn, resolveNight, arrest, nextNight, winner, alive, kiraId } =
  new Function(core + 'return { newGame, seal, nextTurn, resolveNight, arrest, nextNight, winner, alive, kiraId };')();

const names = ['A', 'B', 'C', 'D', 'E'];
// Everyone takes a turn; Kira targets `target`, L checks `pair`.
function playNight(g, target, pair) {
  for (const id of [...g.order]) {
    const tip = alive(g).find(i => i !== id);
    seal(g, id, { tip, target, pair });
    nextTurn(g);
  }
  assert.equal(g.phase, 'dawn');
  resolveNight(g);
}

for (let i = 0; i < 200; i++) {
  const roles = newGame(names).players.map(p => p.role);
  assert.equal(roles.filter(r => r === 'kira').length, 1);
  assert.equal(roles.filter(r => r === 'l').length, 1);
}

// Catching Kira on day one: Task Force wins.
let g = newGame(names);
let k = kiraId(g), others = names.map((_, i) => i).filter(i => i !== k);
playNight(g, others[0], [k, others[1]]);
assert.equal(g.notes[0].hit, true);
assert.equal(g.players[others[0]].alive, false);
assert.equal(g.board.length, 4);
assert.equal(g.board.reduce((n, b) => n + b.n, 0) <= 5, true);
assert.equal(winner(g), null);
arrest(g, k);
assert.equal(winner(g), 'justice');

// Wrong arrests until two are left: Kira wins, and the turn order drops the dead.
g = newGame(names);
k = kiraId(g); others = names.map((_, i) => i).filter(i => i !== k);
playNight(g, others[0], others.slice(1, 3));
assert.equal(g.notes.length === 0 || g.notes[0].hit === false, true);
arrest(g, others[1]);
assert.equal(winner(g), null);
nextNight(g);
assert.equal(g.order.length, 3);
assert.equal(g.night, 2);
playNight(g, others[2], others.slice(2, 4));
assert.equal(winner(g), 'kira');

// Arresting nobody kills nobody.
g = newGame(names);
arrest(g, null);
assert.equal(alive(g).length, 5);

console.log('all rules checks passed');
