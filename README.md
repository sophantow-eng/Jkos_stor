# JKOS — Packaging & Stock System

ระบบแพ็คเกจจิ้งและสต็อกคลังสินค้า (หน้าเว็บไฟล์เดียว + Supabase + Vercel)

## โครงสร้างโฟลเดอร์

| ที่อยู่ | คืออะไร |
|---|---|
| `index.html` | **แอปตัวจริง** (HTML/CSS/JS ในไฟล์เดียว) — ไฟล์นี้คือสิ่งที่ขึ้นเว็บ |
| `sw.js` | Service Worker รับแจ้งเตือน SOS (Web Push) |
| `vercel.json` | ตั้งค่า Vercel (cleanUrls, header ของ `sw.js`) |
| `supabase/functions/sos-push/` | Edge Function ส่ง Web Push (deploy ด้วย `supabase functions deploy sos-push --no-verify-jwt`) |
| `tests/` | ชุดทดสอบตรรกะหน้า A1 — รัน `node tests/a1-info.test.js` และ `node tests/a1-where.test.js` |
| `archive/versions/` | เวอร์ชันเก่าของ `index.html` เก็บไว้อ้างอิง (ไม่ขึ้นเว็บ — ดู `.vercelignore`) |

## แก้ไข / ขึ้นเว็บ

1. แก้ `index.html` แล้วทดสอบด้วยการเปิดไฟล์ หรือรัน `tests/`
2. push ขึ้น `main` — Vercel จะ deploy อัตโนมัติ
3. เวอร์ชันเก่าไม่ต้องเก็บเป็นไฟล์ใหม่ทุกครั้งแล้ว: ใช้ประวัติของ git (`git log`, `git checkout <commit> -- index.html`)

## หมายเหตุ

- ข้อมูลทั้งหมดอยู่บน Supabase (ไม่มีคีย์ลับในหน้าเว็บ)
- ธีมเริ่มต้น: "คลังสินค้า" (ตัวการ์ตูนคนงานเสื้อ JKOS น้ำเงิน) — ธีมแมวมีมาสคอตแมวเฉพาะธีมนั้น
