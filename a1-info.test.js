const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync(require('path').join(__dirname,'index.html'),'utf8');
const cut=(a,b)=>{const i=html.indexOf(a),j=html.indexOf(b);return html.slice(i,j+b.length)};
const code=cut('/* A1W:begin','/* A1W:end */')+'\n'+cut('/* A1ITEM:begin','/* A1ITEM:end */')+'\n'+cut('/* A1INFO:begin','/* A1INFO:end */');
const els={};const mk=id=>({id,value:'',innerHTML:'',hidden:false,firstChild:null,setAttribute(){},focus(){},blur(){},remove(){}});
const body=[];const docObj={createElement:()=>{const e=mk('x');e.parentNode=null;return e},body:{appendChild(e){e.parentNode={removeChild(){}};els[e.id]=e}},addEventListener(){},getElementById:id=>els[id]||null};
const J=(id,k,code,name,qty,o)=>Object.assign({id,slot_key:k,code,name,qty,job_type:'แพ็ค',counted:false,company:null},o||{});
const jobs=[J('j1','F2-B2a-0-3','360-37324A','Bottle BB',443,{counted:true})];
const logs=[
 {at:'2026-10-10T03:00:00Z',job_id:'j1',slot_key:'S1-1-2',name:'Bottle BB',code:'360-37324A',action:'add',old_qty:null,new_qty:443,actor:'a@x'},
 {at:'2026-10-15T08:30:00Z',job_id:'j1',slot_key:'F3-B4-0-5',name:'Bottle BB',code:'360-37324A',action:'move',actor:'b@x'},
 {at:'2026-10-20T10:15:00Z',job_id:'j1',slot_key:'F2-B2a-0-3',name:'Bottle BB',code:'360-37324A',action:'move',actor:'c@x'}];
const card=[{id:'t2',at:'2026-10-21T08:30:00Z',kind:'out',qty:1000,ref:'imc2610009',balance:19000},{id:'t1',at:'2026-10-20T03:00:00Z',kind:'in',qty:20000,ref:'',balance:20000}];
const calls=[];
const client=async()=>({rpc(n,a){calls.push(n);if(n==='a1_item_summary')return Promise.resolve({data:[{code:'360-37324A',name:'Bottle BB',opening_qty:0,received_qty:20000,issued_qty:1000,on_hand:443}],error:null});return Promise.resolve({data:a.p_offset?[]:card,error:null})},
 from(t){const f=[];const b={select(){return b},eq(c,v){f.push(r=>r[c]===v);return b},in(c,a){f.push(r=>a.includes(r[c]));return b},order(){return b},limit(){return b},then(res,rej){const src=t==='a1_jobs'?jobs:logs;return Promise.resolve({data:src.filter(r=>f.every(g=>g(r))),error:null}).then(res,rej)}};return b}});
const ctx={$:id=>els[id]||(els[id]=mk(id)),client,perm:true,toast(){},openTx(){},openCard(){},renderCard(){},delTx(){},H:{},show(){},fr:null,window:{},navigator:{},localStorage:{getItem:()=>'{}'},document:docObj,setTimeout,clearTimeout,Promise,console,Date,JSON,Math,Number,String,Object,Array,RegExp,URL,decodeURIComponent,esc:s=>String(s==null?'':s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))};
vm.createContext(ctx);vm.runInContext(code,ctx);
let pass=0,fail=0;const ok=(c,n)=>{c?pass++:fail++;console.log((c?'  ✔ ':'  ✘ ')+n)};
(async()=>{
 ok(ctx.qrCodeOf('https://jkos-stor.vercel.app/?qr=360-37324A')==='360-37324A','อ่านรหัสจากลิงก์ QR');
 ok(ctx.qrCodeOf('360-37324A')==='360-37324A'&&ctx.qrCodeOf('JKOS:360-37324A')==='360-37324A','อ่านรหัสจากบาร์โค้ดธรรมดา/JKOS:');
 await ctx.a1Info('https://jkos-stor.vercel.app/?qr=360-37324A',{}); await new Promise(r=>setTimeout(r,60));
 const h=els['a1-info'].innerHTML;
 ok(h.includes('360-37324A')&&h.includes('Bottle BB'),'หัวข้อ: รหัส+ชื่อ');
 ok(h.includes('19,000')&&h.includes('คงเหลือปัจจุบัน'),'ยอดคงเหลือปัจจุบัน (บัญชี+บนเชล)');
 ok(h.includes('ตำแหน่งปัจจุบัน')&&h.includes('class="a1ls">B2a<')&&h.includes('data-ig3="F2-B2a-0-3"'),'ตำแหน่งปัจจุบัน + ปุ่มดูใน 3D');
 ok(h.includes('imc2610009')&&h.includes('21/10/2569')&&h.includes('−1,000')&&h.includes('+20,000'),'ประวัติรับเข้า-จ่ายออก มีวันเวลา พ.ศ. + ยอด');
 ok(/ย้าย.*จาก.*ชั้น 1 · S1 · ชั้นวาง 2 · ช่อง 3.*→.*ชั้น 3 · B4/.test(h),'ย้ายครั้งแรก: จาก S1 → B4');
 ok(/ย้าย.*จาก.*ชั้น 3 · B4.*→.*ชั้น 2 · B2a/.test(h),'ย้ายครั้งที่สอง: จาก B4 → B2a');
 ok(h.includes('เพิ่มงานที่')&&h.includes('10/10/2569 เวลา ')&&h.includes('15/10/2569 เวลา ')&&h.includes('20/10/2569 เวลา '),'แสดงวันเวลาของทุกเหตุการณ์');
 ok(h.indexOf('20/10/2569 เวลา')<h.indexOf('15/10/2569 เวลา')&&h.indexOf('15/10/2569 เวลา')<h.indexOf('10/10/2569 เวลา'),'ประวัติย้ายเรียงล่าสุดก่อน');
 ctx.infoClose(); ok(ctx.INF===null,'ปิดหน้าต่างได้');
 await ctx.a1Info('999-NOPE',{}); await new Promise(r=>setTimeout(r,40));
 ok(els['a1-info']&&true,'โค้ดที่ไม่มี: ไม่พัง');
 console.log('ผ่าน',pass,'ไม่ผ่าน',fail); process.exit(fail?1:0);
})().catch(e=>{console.error('CRASH',e);process.exit(2)});
