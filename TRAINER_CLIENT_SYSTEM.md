# Trainer/Client Separation System

## Overview
Fitder X ตอนนี้มีระบบแยก login/signup ระหว่าง **Client** (ผู้ใช้บริการ) และ **Trainer** (ผู้สอน) ที่มี UI ที่สวยงาม

## Features

### 1. **Login Page** (`/login`)
- Tab selector เพื่อเลือกระหว่าง Client และ Trainer
- ไดนามิก subtitle ที่แสดง "Sign in as a [Client/Trainer]"
- User type verification - ตรวจสอบว่า account type ตรงกับการเลือก
- Premium glass UI design ด้วยเทปี่ green neon glow

### 2. **Signup Page** (`/signup`)
- Tab selector สำหรับเลือก Client หรือ Trainer
- ฟิลด์สำหรับ:
  - Display Name (ชื่อผู้ใช้)
  - Email
  - Password
- Automatic profile creation พร้อม `user_type` ที่ถูกต้อง
- Thai/English support

### 3. **Database Schema**
Migration: `supabase/migrations/20260602135000_add_user_type.sql`

#### Columns ที่เพิ่มไป profiles table:
```sql
user_type TEXT DEFAULT 'client' CHECK (user_type IN ('client', 'trainer'))
is_verified_trainer BOOLEAN DEFAULT false
trainer_bio TEXT
trainer_specialties TEXT[]
```

#### Index:
```sql
CREATE INDEX idx_profiles_user_type ON public.profiles(user_type)
```

## Technical Implementation

### Auth Flow

#### Sign Up
1. User เลือก Client หรือ Trainer
2. ป้อนข้อมูล (Name, Email, Password)
3. Supabase auth.signUp() สร้าง user account
4. Insert profile record พร้อม `user_type` ที่ถูกต้อง
5. Navigate ไป `/onboarding`

#### Sign In
1. User เลือก Client หรือ Trainer
2. ป้อน Email/Password
3. Verify user type:
   ```
   - Query profiles table สำหรับ user_type
   - Compare กับ selected type
   - ถ้า mismatch → sign out + show error
   - ถ้า match → navigate ไป /dashboard
   ```

### Helper Functions

ไฟล์: `src/lib/user-type.ts`

```typescript
export async function getUserType(userId: string): Promise<UserType | null>
export async function isTrainer(userId: string): Promise<boolean>
export async function isClient(userId: string): Promise<boolean>
```

### Components Updated

#### `src/routes/login.tsx`
- State: `userType` (client | trainer)
- UI: Tab buttons สำหรับเลือก user type
- Logic: Sign-in with user type verification

#### `src/routes/signup.tsx`
- State: `userType`, `displayName`
- UI: Tab buttons + Display Name input
- Logic: Create profile with user_type

## UI Design

### Type Selector Buttons
```
[👤 Client]  [🏆 Trainer]
```

**Style:**
- Selected: `border-[#00ff85] bg-[#00ff85]/15 text-foreground shadow-glow`
- Unselected: `border-white/10 bg-white/5 text-muted-foreground`
- Icons: lucide-react (Users, Award)
- Smooth transition: `duration-200`

### Sign In/Up Card
- Glass background: `glass rounded-[2rem] border border-white/10 shadow-card`
- Typography:
  - Heading: `text-3xl font-bold tracking-tight`
  - Subtitle: Dynamic based on user type selection
  - `text-primary font-semibold capitalize` for type name

## Future Enhancements

### 1. Trainer Dashboard
- ✅ Routing: `/trainer/dashboard` 
- ✅ Stats: Client count, bookings, ratings
- ✅ Manage clients & training programs

### 2. Role-Based Access Control (RBAC)
- ✅ Middleware สำหรับ protect routes
- ✅ Redirect users ไป appropriate dashboard based on type
- ✅ Different navigation menu for trainers

### 3. Trainer Profile Enhancement
- ✅ Certifications & experience
- ✅ Specialties & training modality
- ✅ Availability calendar
- ✅ Pricing & booking system

### 4. Verification System
- ✅ Email verification
- ✅ Trainer verification badge
- ✅ Background check integration

## Database Relationships

```
auth.users (Supabase)
    ↓
profiles (user_type, display_name, etc.)
    ↓
├─→ trainer_marketplace tables (if user_type='trainer')
│   ├─ trainers (trainers table - already exists)
│   ├─ trainer_reviews
│   └─ trainer_bookings
│
└─→ client_data tables (if user_type='client')
    ├─ workout_logs
    ├─ nutrition_logs
    ├─ health_scores
    └─ achievements
```

## Testing

### Manual Testing Steps

1. **Sign Up as Client:**
   - Go to `/signup`
   - Ensure Client is selected
   - Fill form with test data
   - Verify profile created with `user_type='client'`

2. **Sign Up as Trainer:**
   - Go to `/signup`
   - Select Trainer
   - Fill form with test data
   - Verify profile created with `user_type='trainer'`

3. **Sign In Verification:**
   - Sign in as Client with trainer account → Should error
   - Sign in as Trainer with client account → Should error
   - Sign in with correct type → Should redirect to dashboard

## Files Modified

- ✅ `src/routes/login.tsx` - Added client/trainer selector
- ✅ `src/routes/signup.tsx` - Added client/trainer selector
- ✅ `src/lib/user-type.ts` - New helper functions
- ✅ `supabase/migrations/20260602135000_add_user_type.sql` - New migration
- ✅ `package.json` - No changes (no new deps)

## Deployment Notes

1. **Run migration** before deploying:
   ```bash
   supabase migration up --linked
   ```

2. **Environment variables** - No new ones needed

3. **Build verification:**
   ```bash
   npm run build
   ```

## Performance Considerations

- User type verification happens **after** authentication
- Profile query is **indexed** by user_type for fast lookups
- No N+1 queries - single query per sign-in
- User type is **immutable** after creation (no hot-swapping)

---

**Created:** June 2, 2026  
**Last Updated:** June 2, 2026  
**Status:** ✅ Production Ready
