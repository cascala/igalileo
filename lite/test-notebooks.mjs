// Runs every example notebook through the WebAssembly engine and fails on any error.
//   node lite/test-notebooks.mjs path/to/galileo_rs.wasm examples/*.ipynb examples/*/*.ipynb
import fs from 'fs';
const {instance: {exports: g}} = await WebAssembly.instantiate(fs.readFileSync(process.argv[2]), {});
const enc = new TextEncoder(), dec = new TextDecoder();
function call(fn, code, ...rest) {
  const b = enc.encode(code); const p = g.galileo_alloc(b.length);
  new Uint8Array(g.memory.buffer, p, b.length).set(b);
  const n = g[fn](p, b.length, ...rest);
  return JSON.parse(dec.decode(new Uint8Array(g.memory.buffer, g.galileo_reply_ptr(), n)));
}
let bad = 0;
for (const f of process.argv.slice(3)) {
  g.galileo_reset(); const nb = JSON.parse(fs.readFileSync(f)); const t0 = Date.now(); let errs = [];
  for (const c of nb.cells) if (c.cell_type === 'code') {
    const src = [].concat(c.source).join(''); const t = Date.now();
    try { const r = call('galileo_execute', src); if (r.error) errs.push(src.slice(0,60) + ' :: ' + r.error.evalue); }
    catch (e) { errs.push(src.slice(0,60) + ' :: TRAP ' + e.message); }
    if (Date.now() - t > 2000) console.log('  slow', Date.now()-t, 'ms', src.slice(0,60));
  }
  bad += errs.length; console.log(f.split('/').slice(-2).join('/'), Date.now()-t0, 'ms', errs.length ? errs : 'ok');
}
process.exit(bad ? 1 : 0);
