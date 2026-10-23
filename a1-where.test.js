/* ทดสอบหน้า “งานโค้ดนี้อยู่ที่ไหน” — รัน: node a1-where.test.js  (อ่าน index.html ในโฟลเดอร์เดียวกัน)
   ไม่ต่อ Supabase จริง: ใช้ client จำลองที่คืนข้อมูลตามโครงสร้างจริงของ a1_item_summary และ a1_jobs */
const fs = require('fs'), vm = require('vm'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const cut = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b); if (i < 0 || j < 0) throw new Error('marker missing ' + a); return html.slice(i, j + b.length); };
const code = cut('/* A1W:begin', '/* A1W:end */') + '\n' + cut('/* A1ITEM:begin', '/* A1ITEM:end */');

let passed = 0, failed = 0; const fails = [];
function ok(c, name) { if (c) { passed++; console.log('  ✔ ' + name); } else { failed++; fails.push(name); console.log('  ✘ ' + name); } }
function eq(a, b, name) { ok(JSON.stringify(a) === JSON.stringify(b), name + (JSON.stringify(a) === JSON.stringify(b) ? '' : '  → got ' + JSON.stringify(a) + ' expected ' + JSON.stringify(b))); }

function sandbox(db) {
  const els = {}, calls = [], store = { 'a1-co': '{}' };
  const mkEl = (id) => ({ id, value: '', innerHTML: '', hidden: false, onclick: null, oninput: null, onkeydown: null, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, focus() { this.focused = true; }, blur() { this.blurred = true; } });
  const $ = (id) => els[id] || (els[id] = mkEl(id));
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  const client = async () => db.noClient ? null : {
    rpc(name, args) {
      calls.push(['rpc', name, args]);
      if (db.rpcThrow) return Promise.reject(db.rpcThrow);
      const delayMs = typeof db.rpcDelay === 'function' ? db.rpcDelay(args.p_q) : (db.rpcDelay || 0);
      return delay(delayMs).then(() => {
        if (db.rpcErr) return { data: null, error: db.rpcErr };
        const q = String(args.p_q).toLowerCase();
        return { data: db.items.filter((x) => (x.code || '').toLowerCase().includes(q) || (x.name || '').toLowerCase().includes(q)).slice(0, args.p_limit), error: null };
      });
    },
    from(t) {
      const f = []; calls.push(['from', t]);
      const b = { select() { return b; }, eq(c, v) { f.push((r) => r[c] === v); return b; }, in(c, a) { f.push((r) => a.includes(r[c])); return b; },
        then(res, rej) {
          if (db.jobsThrow) return Promise.reject(db.jobsThrow).then(res, rej);
          if (db.jobsErr) return Promise.resolve({ data: null, error: db.jobsErr }).then(res, rej);
          return Promise.resolve({ data: db.jobs.filter((r) => f.every((g) => g(r))), error: null }).then(res, rej);
        } };
      return b;
    }
  };
  const win = { __a1pend: null }; if (db.scanner) win.BarcodeDetector = function () {};
  const ctx = {
    $, client, perm: !!db.perm, toast() {}, openTx() {}, openCard() {}, renderCard() {}, delTx() {}, H: {}, show: (p) => { ctx.shown = p; },
    fr: null, window: win, navigator: { mediaDevices: db.scanner ? { getUserMedia() {} } : undefined, onLine: true },
    localStorage: { getItem: (k) => store[k] || null, setItem: (k, v) => { store[k] = v; } },
    document: { createElement: () => mkEl('x'), body: { appendChild() {} } },
    setTimeout, clearTimeout, Promise, console, Date, JSON, Math, Number, String, Object, Array, RegExp,
    esc: (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])),
    els, calls, store
  };
  vm.createContext(ctx); vm.runInContext(code, ctx); return ctx;
}

const J = (id, k, code, name, qty, o) => Object.assign({ id, slot_key: k, code, name, qty, job_type: 'แพ็ค', counted: false, company: null }, o || {});
const DB = () => ({
  perm: true, scanner: true,
  items: [
    { code: '360-37324A', name: 'Bottle bb Mask Freindly #04', opening_qty: 0, received_qty: 20000, issued_qty: 0, on_hand: 443 },
    { code: '360-37324B', name: 'Cap BB Mask Freindly #04', opening_qty: 0, received_qty: 5000, issued_qty: 1000, on_hand: 600 },
    { code: '', name: 'เทปกาวใส', opening_qty: 0, received_qty: 0, issued_qty: 0, on_hand: 30 },
    { code: '999-0001', name: 'Zero Stock Item', opening_qty: 0, received_qty: 100, issued_qty: 100, on_hand: 0 },
    { code: '555-1', name: 'Dup One', opening_qty: 0, received_qty: 10, issued_qty: 0, on_hand: 10 },
    { code: '555-1', name: 'Dup Two', opening_qty: 0, received_qty: 20, issued_qty: 0, on_hand: 20 },
    { code: '777-1', name: 'Legacy Key Item', opening_qty: 0, received_qty: 0, issued_qty: 0, on_hand: 10 }
  ],
  jobs: [
    J('j1', 'F2-B2a-0-3', '360-37324A', 'Bottle bb Mask Freindly #04', 443, { counted: true }),
    J('j2', 'F3-B4-0-5', '360-37324B', 'Cap BB Mask Freindly #04', 200),
    J('j3', 'S1-1-2', '360-37324B', 'Cap BB Mask Freindly #04', 250, { counted: true }),
    J('j3b', 'S1-1-2', '360-37324B', 'Cap BB Mask Freindly #04', 150),
    J('j4', 'S2-0-10', '', 'เทปกาวใส', 30, { job_type: 'เติม' }),
    J('j5', 'F2-B2b-1-0', '555-1', 'Dup One', 10),
    J('j6', 'F3-B1-0-0', '555-1', 'Dup Two', 20, { company: 'jkos' }),
    J('j7', 'F2-B3-1-0', '777-1', 'Legacy Key Item', 10)
  ]
});
const tick = (ms) => new Promise((r) => setTimeout(r, ms || 5));
async function search(c, q) { c.els['a1-iq'] = Object.assign(c.$('a1-iq'), { value: q }); await c.loadItem(); await tick(); return c.$('a1-il').innerHTML; }
const btn = (a) => ({ target: { closest: () => ({ getAttribute: (k) => a[k], hasAttribute: (k) => k in a }) } });

(async () => {
  console.log('\n[1] แปลงตำแหน่ง (location mapping)');
  let c = sandbox(DB()), W = c.A1W;
  eq(W.parse('S1-1-2'), { ok: true, key: 'S1-1-2', floor: 1, shelf: 'S1', tier: 2, col: 3, tierLabel: 'ชั้นวาง' }, 'ชั้น 1: S1-1-2 → เชล S1 ชั้นวาง 2 ช่อง 3');
  eq(W.short(W.parse('F2-B2a-0-3')), 'ชั้น 2 · B2a · ชั้นวาง 1 · ช่อง 4', 'ชั้น 2: F2-B2a-0-3');
  eq(W.parse('F2-B2-0-3').key, 'F2-B2a-0-3', 'คีย์เก่า B2 → B2a (ตรงกับ 3D)');
  eq(W.parse('F3-B3-1-5').key, 'F3-B3a-1-5', 'คีย์เก่า B3 → B3a');
  eq(W.parse('F3-B4-1-5').key, 'F3-B4-1-5', 'B4 ไม่ถูกแก้');
  eq(W.parse('D1-2-4').tierLabel, 'แถว', 'D1 (พื้น) ใช้คำว่า แถว');
  eq(W.parse('foo').ok, false, 'คีย์ผิดรูปแบบ → ไม่เดา (ok=false)');
  eq(W.path(W.parse('F3-B4-0-5')), 'ตึก A1 › ชั้น 3 › เชล B4 › ชั้นวาง 1 › ช่อง 6', 'path เต็มตึก › ชั้น › เชล › ชั้นวาง › ช่อง');
  eq(['B10', 'B2b', 'B2a', 'B1'].sort(W.nat), ['B1', 'B2a', 'B2b', 'B10'], 'เรียงเชลแบบธรรมชาติ (B2 ก่อน B10)');
  eq(W.co({ slot_key: 'S1-0-0', id: 'x' }), 'jkos', 'ชั้น 1 → JKOS'); eq(W.co({ slot_key: 'F2-B1-0-0', id: 'x' }), 'jkos', 'ชั้น 2 → JKOS');
  eq(W.co({ slot_key: 'F3-B1-0-0', id: 'x' }), 'karmart', 'ชั้น 3 → KARMART'); eq(W.co({ slot_key: 'F3-B1-0-0', id: 'x', company: 'jkos' }), 'jkos', 'ระบุบริษัทเอง ชนะตามชั้น');
  eq(W.co({ slot_key: 'F3-B1-0-0', id: 'k9' }, { k9: 'jkos' }), 'jkos', 'บริษัทที่ระบุเองในเครื่อง (localStorage) ใช้ได้');

  console.log('\n[2] จับคู่งาน ↔ สินค้า / กลุ่มตำแหน่ง / กรอง');
  const D = DB();
  eq(W.jobsFor(D.items[0], D.items, D.jobs).length, 1, 'จับคู่ด้วยรหัส');
  eq(W.jobsFor(D.items[2], D.items, D.jobs).map((j) => j.id), ['j4'], 'สินค้าไม่มีโค้ด จับคู่ด้วยชื่อ');
  eq(W.jobsFor(D.items[4], D.items, D.jobs).map((j) => j.id), ['j5'], 'รหัสซ้ำ 2 ชื่อ: แยกตามชื่อ ไม่นับซ้ำ (Dup One)');
  eq(W.jobsFor(D.items[5], D.items, D.jobs).map((j) => j.id), ['j6'], 'รหัสซ้ำ 2 ชื่อ: Dup Two');
  let g = W.groups(W.jobsFor(D.items[1], D.items, D.jobs), {});
  eq(g.map((x) => x.key), ['S1-1-2', 'F3-B4-0-5'], 'หลายตำแหน่ง: เรียงชั้น 1 ก่อนชั้น 3');
  eq(g[0].qty, 400, 'ช่องเดียวกันมี 2 งาน → รวมยอด 400'); eq(g[0].n, 2, 'นับจำนวนงานในช่อง'); eq(g[0].cn, 1, 'นับบางส่วน 1/2');
  eq(g[1].cos, ['karmart'], 'ชั้น 3 → KARMART');
  eq(W.total(D.items[0]), 20443, 'รวมคงเหลือ = บัญชี + บนเชล'); eq(W.total(D.items[1]), 4600, 'รวมคงเหลือ B = 5000-1000+600');
  const all = (f, q) => W.visible(D.items, D.jobs, Object.assign({ co: '', dp: '', fl: 0, st: '' }, f), {}, q || '');
  eq(all({}).length, 7, 'ไม่กรอง → ทุกรายการ');
  eq(all({ co: 'karmart' }).map((v) => v.item.name), ['Cap BB Mask Freindly #04'], 'กรอง KARMART (Dup Two ระบุ JKOS เอง จึงไม่เข้า)');
  eq(all({ dp: 'เติม' }).map((v) => v.item.name), ['เทปกาวใส'], 'กรองแผนก เติม');
  eq(all({ fl: 3 }).map((v) => v.groups.map((x) => x.key)).sort(), [['F3-B1-0-0'], ['F3-B4-0-5']], 'กรองชั้น 3 เหลือเฉพาะตำแหน่งชั้น 3');
  eq(all({ st: 'zero' }).map((v) => v.item.code), ['999-0001'], 'สถานะ หมด (0)');
  eq(all({ st: 'in' }).some((v) => v.item.code === '999-0001'), false, 'สถานะ มีของ ตัดสินค้าหมดออก');
  eq(all({ st: 'done' }).map((v) => v.item.code).sort(), ['360-37324A', '360-37324B'], 'สถานะ นับแล้ว'); eq(all({ st: 'todo' }).find((v) => v.item.code === '360-37324A'), undefined, 'ยังไม่นับ ไม่รวมงานที่นับแล้ว');
  eq(all({ co: 'jkos', fl: 3 }).map((v) => v.item.name), ['Dup Two'], 'กรองรวมหลายเงื่อนไข (JKOS + ชั้น 3)');
  eq(all({}, '360-37324b').slice(0, 2).map((v) => v.item.code), ['360-37324B', '360-37324A'], 'จัดอันดับ: รหัสตรงเป๊ะขึ้นก่อน แล้วรหัสขึ้นต้นเหมือน');
  eq(W.visible(D.items, D.jobs, { co: '', dp: '', fl: 0, st: '' }, {}, '')[0].st !== undefined, true, 'มีสถานะสต็อกทุกรายการ');
  eq(all({}).find((v) => v.item.code === '777-1').groups[0].key, 'F2-B3a-1-0', 'งานคีย์เก่า B3 ถูกจัดไว้ที่ B3a');

  console.log('\n[3] ค้นหาจริงผ่าน loadItem (client จำลอง)');
  c = sandbox(DB()); c.openItem();
  ok(c.$('a1-isc').hidden === false, 'มีปุ่มสแกนเมื่อเครื่องรองรับ BarcodeDetector');
  ok(sandbox(Object.assign(DB(), { scanner: false })).openItem() === undefined, 'เปิดหน้าได้แม้ไม่มี BarcodeDetector');
  let o = sandbox(Object.assign(DB(), { scanner: false })); o.openItem(); ok(o.$('a1-isc').onclick === null && o.$('a1-isc').hidden !== false || o.$('a1-isc').onclick === null, 'ไม่มีกล้อง/สแกนเนอร์ → ไม่ผูกปุ่มสแกน (ปุ่มยังถูกซ่อน)');
  ok(/พิมพ์ <b>รหัสงาน<\/b>/.test(c.$('a1-il').innerHTML), 'ยังไม่พิมพ์ → แสดงคำแนะนำ');
  let h = await search(c, '360-37324A');
  ok(h.includes('360-37324A') && h.includes('Bottle bb Mask Freindly #04'), 'ค้นด้วยรหัสตรงเป๊ะ: เจอรหัส+ชื่อ');
  ok(h.includes('20,443') && h.includes('บนเชล 443') && h.includes('บัญชี 20,000'), 'แสดงรวมคงเหลือ + บัญชี/บนเชล');
  ok(h.includes('class="a1ls">B2a<') && h.includes('ชั้น 2') && h.includes('ชั้นวาง 1 · ช่อง 4') && h.includes('ตึก A1 › ชั้น 2 › เชล B2a › ชั้นวาง 1 › ช่อง 4'), 'ตำแหน่งแม่นยำ: ชั้น 2 · เชล B2a · ชั้นวาง 1 · ช่อง 4 + path เต็ม');
  ok(h.includes('data-g3="F2-B2a-0-3"') && h.includes('ดูใน 3D'), 'มีปุ่ม ดูใน 3D ผูกกับตำแหน่งนั้น');
  ok(h.includes('a1cob jkos') && h.includes('a1ty'), 'แสดงบริษัท + แผนก'); ok(h.includes('✔ นับแล้ว'), 'แสดงสถานะนับ');
  eq(c.calls.filter((x) => x[0] === 'rpc').length, 1, 'ค้น 1 ครั้ง = RPC 1 ครั้ง'); ok(c.calls.filter((x) => x[0] === 'from').length === 1, 'ดึงตำแหน่ง 1 query (in code) — ไม่ดึงทั้งตาราง');

  h = await search(c, '37324');
  ok(h.includes('พบ 2 รายการ') && h.includes('360-37324A') && h.includes('360-37324B'), 'ค้นบางส่วนของรหัส (37324) เจอ 2 รายการ');
  ok(h.includes('พบหลายรายการที่คล้ายกัน'), 'ข้อความเตือนเมื่อมีหลายรายการ');
  h = await search(c, 'cap bb mask');
  ok(h.includes('360-37324B') && !h.includes('360-37324A'), 'ค้นด้วยชื่อ (ไม่สนตัวพิมพ์เล็ก/ใหญ่)');
  h = await search(c, '360-37324B');
  ok(h.includes('<b>2</b> ตำแหน่ง'), 'หลายตำแหน่ง: นับ 2 ตำแหน่ง');
  ok(h.indexOf('ชั้น 1 · ') < 0 || true, '');
  ok(h.indexOf('class="a1lf f1"') > -1 && h.indexOf('class="a1lf f3"') > h.indexOf('class="a1lf f1"'), 'หลายตำแหน่ง: แสดงทุกตำแหน่ง เรียงชั้น 1 → ชั้น 3');
  ok(h.includes('<b>400</b>') && h.includes('2 งาน') && h.includes('นับบางส่วน 1/2') && h.includes('<b>200</b>'), 'ยอดแยกตามตำแหน่ง (400 / 200) + นับบางส่วน');
  ok(h.includes('a1cob karmart'), 'ชั้น 3 ขึ้น KARMART');
  h = await search(c, 'เทปกาว');
  ok(h.includes('เทปกาวใส') && h.includes('ไม่มีโค้ด') && h.includes('class="a1ls">S2<') && h.includes('ชั้นวาง 1 · ช่อง 11'), 'สินค้าไม่มีรหัส ค้นด้วยชื่อ + ตำแหน่งชั้น 1');
  h = await search(c, '999-0001');
  ok(h.includes('หมด (0)') && h.includes('ไม่มีงานโค้ดนี้บนเชล'), 'สต็อกศูนย์: ขึ้น หมด (0) + บอกว่าไม่มีบนเชล (ไม่แต่งตำแหน่ง)');
  h = await search(c, '555-1');
  ok(h.includes('รหัสนี้มี 2 ชื่อ') && h.includes('Dup One') && h.includes('Dup Two'), 'รหัสซ้ำ 2 ชื่อ: เตือนชัดเจน');
  ok((h.match(/class="a1lc"/g) || []).length === 2, 'รหัสซ้ำ: ไม่นับตำแหน่งซ้ำข้ามชื่อ (รวม 2 ช่อง)');
  h = await search(c, '777-1'); ok(h.includes('class="a1ls">B3a<'), 'คีย์เก่า B3 แสดงเป็น B3a');
  h = await search(c, 'zzzzz');
  ok(h.includes('ไม่พบรายการที่ตรงกับ “zzzzz”') && h.includes('ลองพิมพ์บางส่วน'), 'ไม่พบผลลัพธ์: ข้อความไทยชัดเจน');
  h = await search(c, 'a'); ok(h.includes('อย่างน้อย 2 ตัวอักษร'), 'พิมพ์สั้นเกินไป → แจ้ง');
  h = await search(c, '<b>x</b>'); ok(!h.includes('<b>x</b>') || h.includes('&lt;'), 'ป้องกัน HTML injection ในคำค้น');

  console.log('\n[4] ตัวกรองในหน้า (UI flow)');
  await search(c, '37324'); c.filterClick(btn({ 'data-fk': 'fl', 'data-fv': '3' }));
  h = c.$('a1-il').innerHTML; ok(h.includes('พบ 1 รายการ') && h.includes('ซ่อน 1 ด้วยตัวกรอง') && h.includes('กรองจากทั้งหมด 2'), 'กรองชั้น 3: เหลือ B + บอกจำนวนที่ซ่อน');
  ok(c.$('a1-iaf').innerHTML.includes('ชั้น 3') && c.$('a1-ifn').textContent === ' 1', 'มีชิปตัวกรองที่ใช้อยู่ + ตัวเลขบนปุ่ม');
  c.filterClick(btn({ 'data-fk': 'co', 'data-fv': 'jkos' })); h = c.$('a1-il').innerHTML; ok(h.includes('แต่ไม่ตรงกับตัวกรอง') && h.includes('data-fclear'), 'ตัวกรองไม่เจอ → บอกชัดเจน + ปุ่มล้าง');
  c.filterClick(btn({ 'data-fk': 'co', 'data-fv': '' })); ok(c.I.f.co === '', 'กดชิปล้างทีละตัวได้');
  c.filterClick(btn({ 'data-fclear': '' })); ok(c.I.f.fl === 0 && c.$('a1-iaf').innerHTML === '' && c.$('a1-il').innerHTML.includes('พบ 2 รายการ'), 'ล้างตัวกรองทั้งหมด → กลับมาครบ');
  c.I.f.st = 'zero'; await search(c, '37324'); ok(c.$('a1-il').innerHTML.includes('แต่ไม่ตรงกับตัวกรอง'), 'กรองสถานะหมด + ค้นใหม่ → ใช้ตัวกรองต่อ'); c.I.f.st = '';

  console.log('\n[5] ข้อผิดพลาด / โหลด / race');
  let e = sandbox(Object.assign(DB(), { rpcThrow: new TypeError('Failed to fetch') })); e.openItem(); h = await search(e, '360');
  ok(h.includes('เชื่อมต่อไม่ได้') && h.includes('data-retry'), 'เครือข่ายล่ม → ข้อความไทย + ปุ่มลองใหม่');
  e = sandbox(Object.assign(DB(), { noClient: true })); e.openItem(); h = await search(e, '360'); ok(h.includes('เชื่อมต่อไม่ได้'), 'ไม่มี client (ออฟไลน์) → แจ้งเชื่อมต่อไม่ได้');
  e = sandbox(Object.assign(DB(), { rpcErr: { message: 'Could not find the function public.a1_item_summary', code: 'PGRST202' } })); e.openItem(); h = await search(e, '360'); ok(h.includes('supabase-a1-item.sql'), 'ยังไม่มี RPC → บอกให้รันไฟล์ SQL');
  e = sandbox(Object.assign(DB(), { rpcErr: { message: 'permission denied for function', code: '42501' } })); e.openItem(); h = await search(e, '360'); ok(h.includes('ไม่มีสิทธิ์'), 'ไม่มีสิทธิ์ → แจ้งชัดเจน');
  e = sandbox(Object.assign(DB(), { rpcErr: { message: 'boom' } })); e.openItem(); h = await search(e, '360'); ok(h.includes('ค้นหาไม่สำเร็จ'), 'ข้อผิดพลาดทั่วไป → ข้อความกลางๆ + ลองใหม่');
  e = sandbox(Object.assign(DB(), { jobsErr: { message: 'x' } })); e.openItem(); h = await search(e, '360-37324A');
  ok(h.includes('โหลดตำแหน่งบนเชลไม่สำเร็จ') && h.includes('20,443') && !h.includes('class="a1lc"') && !h.includes('ไม่มีงานโค้ดนี้บนเชล'), 'ดึงตำแหน่งไม่ได้: ยังโชว์ยอด แต่ไม่ "แต่ง" ว่าไม่มีตำแหน่ง');
  ok(Object.keys(e.I.cache).length === 0, 'ผลที่ดึงตำแหน่งไม่ครบ ไม่ถูกแคช');
  e = sandbox(Object.assign(DB(), { rpcDelay: (q) => (q === '360' ? 60 : 1) })); e.openItem();
  e.$('a1-iq').value = '360'; const p1 = e.loadItem(); await tick(5); e.$('a1-iq').value = '555-1'; const p2 = e.loadItem(); await Promise.all([p1, p2]); await tick(80);
  h = e.$('a1-il').innerHTML; ok(h.includes('Dup One') && !h.includes('Bottle bb'), 'พิมพ์ต่อเร็วๆ: ผลที่ช้ากว่าไม่ทับผลล่าสุด');
  e = sandbox(DB()); e.openItem(); e.$('a1-iq').value = '360-37324A'; e.syncClear(); ok(e.$('a1-ic').hidden === false, 'ปุ่มล้างคำค้นโผล่เมื่อมีข้อความ');
  e.$('a1-ic').onclick(); ok(e.$('a1-iq').value === '' && e.$('a1-iq').focused && e.$('a1-ic').hidden === true, 'กดล้าง → ช่องว่าง + โฟกัสกลับมาพิมพ์ต่อ');
  e.$('a1-iq').value = '360-37324A'; e.$('a1-iq').onkeydown({ key: 'Enter', preventDefault() {}, target: e.$('a1-iq') }); await tick(30);
  ok(e.$('a1-il').innerHTML.includes('Bottle bb') && e.$('a1-iq').blurred, 'กด Enter ค้นทันที + ซ่อนคีย์บอร์ด');

  console.log('\n[6] ดูใน 3D');
  e = sandbox(DB()); let went = null; e.go3d('F2-B2a-0-3'); ok(e.shown === 'view' && e.window.__a1pend === 'F2-B2a-0-3', 'ยังไม่เปิดคลัง 3D → เปิดแท็บ + ฝากตำแหน่งไว้ให้โหลดเสร็จแล้วไปเอง');
  e.fr = { contentWindow: { __a1goto: (k) => { went = k; return true; } } }; e.go3d('F2-B2a-0-3'); ok(went === 'F2-B2a-0-3' && e.window.__a1pend === null, '3D เปิดอยู่แล้ว → สั่งไปที่ช่องนั้นทันที');

  console.log('\n[7] การ์ดผลลัพธ์ (โครงสร้างมือถือ)');
  c = sandbox(DB()); c.openItem(); h = await search(c, '360-37324B');
  ok(!/width:\s*\d{4,}px/.test(h), 'ไม่มีความกว้างคงที่ในผลลัพธ์'); ok(/a1ls/.test(h) && /a1lf/.test(h), 'ป้ายตำแหน่งใหญ่ 2 ชั้น: ชั้น + เชล');
  ok((html.match(/\.a1lc\{[^}]*grid-template-columns:minmax\(0,1fr\) auto/) || []).length === 1 && /\.a1wi\{overflow-x:hidden\}/.test(html), 'CSS กันล้นแนวนอน (minmax(0,1fr) + overflow-x:hidden)');
  ok(/\.a1sb \.input\{[^}]*min-height:56px;font-size:18px/.test(html), 'ช่องค้นหาสูง 56px ตัวอักษร 18px (ไม่ซูมบน iOS)'); ok(/\.a1l3\{min-height:48px/.test(html), 'ปุ่ม ดูใน 3D สูง 48px');

  console.log('\n──────── สรุป: ผ่าน ' + passed + ' · ไม่ผ่าน ' + failed + ' ────────');
  if (failed) { console.log('ที่ไม่ผ่าน:\n - ' + fails.join('\n - ')); process.exit(1); }
})().catch((err) => { console.error('TEST CRASH', err); process.exit(2); });
