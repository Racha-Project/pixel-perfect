# ขั้นตอนการสร้างตาราง Database

## วิธีที่ 1: ผ่าน Supabase Dashboard (ง่ายที่สุด) ✅ 

### ขั้นตอน:

1. **ไปที่ Supabase Dashboard:**
   - URL: https://app.supabase.com/project/zzvfjrvcvajncoympjzy/sql

2. **เลือก "New Query"**
   - คลิก "+" หรือ "New Query" button

3. **คัดลอก SQL จากไฟล์**
   - เปิดไฟล์: `migrations-combined.sql` ในโปรแกรมแก้ไข
   - ทำการ Ctrl+A เพื่อเลือกทั้งหมด
   - Ctrl+C เพื่อคัดลอก

4. **วางลงใน SQL Editor**
   - วางในช่อง SQL Editor ใน Supabase
   - คลิก "Run" button (มีไอคอน ▶)

5. **รอให้เสร็จสิ้น**
   - เมื่อสำเร็จจะเห็น checkmark ✅
   - ตัวเลขแสดงจำนวน rows ที่ถูกสร้าง

---

## วิธีที่ 2: ใช้ Supabase CLI (ถ้า login ได้)

```bash
cd c:\Users\HP\Desktop\BOTNOI\pixel-perfect
supabase projects list
supabase link --project-ref zzvfjrvcvajncoympjzy
supabase db push
```

---

## วิธีที่ 3: ใช้ Node.js Script (อีกทางเลือก)

หากต้องการให้ผมสร้าง script ที่ execute migrations โดยอัตโนมัติ:

```bash
node migrate.js
```

---

## ตาราง (Tables) ที่จะสร้าง:

### 1. **Enums** (ประเภทข้อมูล)
- `fitness_goal` - weight_loss, muscle_gain, recomposition, general_fitness
- `gender_type` - male, female, other
- `activity_level` - sedentary, light, moderate, active, very_active

### 2. **Main Tables**
- `profiles` - ข้อมูลผู้ใช้ (user_type, display_name, etc.)
- `workout_plans` - แผนการออกกำลัง
- `workout_logs` - บันทึกการออกกำลัง
- `nutrition_logs` - บันทึกอาหาร
- `health_scores` - คะแนนสุขภาพ
- `digital_twin_predictions` - การทำนาย AI
- `achievements` - ความสำเร็จ/badge
- `chat_history` - บันทึก chat กับ AI

### 3. **Trainer Tables**
- `trainers` - ข้อมูล trainer
- `trainer_reviews` - รีวิว trainer
- `trainer_bookings` - การจอง trainer

### 4. **User Type Column**
- `user_type` - เพิ่มใน profiles table (client / trainer)
- `is_verified_trainer` - การตรวจสอบ trainer
- `trainer_bio` - ประวัติ trainer
- `trainer_specialties` - ความเชี่ยวชาญ trainer

---

## File ที่จะใช้:

📄 **migrations-combined.sql** (17.8 KB)
- รวม 5 migration files
- มี DDL ทั้งหมด (CREATE TABLE, CREATE POLICY, etc.)
- สามารถ run ครั้งเดียว

---

## หลังจาก Run Migrations:

✅ ตัวเลือก 1: ลองสร้าง account ใหม่ใน app
```
1. ไปที่ http://localhost:5000/signup
2. เลือก Client หรือ Trainer
3. ป้อนข้อมูล
4. สร้าง account → profile จะถูกสร้างใน database
```

✅ ตัวเลือก 2: ดูข้อมูลใน Supabase Editor
```
1. ไปที่ https://app.supabase.com/project/zzvfjrvcvajncoympjzy/editor
2. ดูรายการตารางที่ด้านซ้าย
3. Explore data ในแต่ละตาราง
```

✅ ตัวเลือก 3: Query ด้วย REST API
```bash
curl -H "Authorization: Bearer sb_publishable_Fi_EZJDg-CSqxsvYu4zxdA_okLzJk5Q" \
  https://zzvfjrvcvajncoympjzy.supabase.co/rest/v1/profiles?select=*
```

---

## หาก Error:

- ❌ "Table already exists" → migration ถูก run แล้ว
- ❌ "Permission denied" → ต้อง login ด้วย owner account
- ❌ "Foreign key violation" → ลบตารางเก่าออกก่อน

---

ให้ผมรู้ว่าติดขัดตรงไหน แล้วผมช่วยแก้นะครับ! 🚀
