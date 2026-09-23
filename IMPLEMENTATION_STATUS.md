# Clarity: Google Auth + Cloud Sync + Mobile App - Implementation Status

## ✅ Phase 1: Backend Google Authentication (COMPLETE)

**Changes made:**
- ✅ Added `google-api-client` dependency to `backend/pom.xml`
- ✅ Updated `User` model with `googleId`, `avatarUrl`, `authProvider` fields
- ✅ Made `password` nullable for Google-only users
- ✅ Added `findByGoogleId()` to `UserRepository`
- ✅ Expanded `AuthDto.TokenResponse` to include `userId`, `email`, `avatarUrl`
- ✅ Added `GoogleAuthRequest` DTO
- ✅ Implemented `AuthService.googleLogin()` with Google ID token verification
- ✅ Added `POST /api/auth/google` endpoint in `AuthController`
- ✅ Updated `application.yml` with Google client-id config and DATABASE_URL env var
- ✅ Updated CORS config for Expo origins
- ✅ Updated `.env.example` with Google and Supabase config

## ✅ Phase 2: Desktop Frontend Google Authentication (COMPLETE)

**Changes made:**
- ✅ Created `desktop/src/lib/google-auth.ts` - Google Identity Services helper
- ✅ Updated `types.ts` - added `GoogleAuthRequest`, expanded `AuthResponse`
- ✅ Updated `store.ts` - added `googleLogin()`, `email`, `avatarUrl`, `token` to state
- ✅ Updated `api.ts` - added `httpRequest()` helper and `googleLogin()` method
- ✅ Updated `Layout.tsx` - shows Google avatar if available
- ✅ Updated `AuthPage.tsx` - added real clickable Google Sign-In button with divider
- ✅ Created `desktop/.env.example` for Google Client ID

## 🔄 Phase 3: Cloud Sync Infrastructure (TODO)

**Backend tasks remaining:**
- [ ] Add `updatedAt` to `CalendarEvent` and `Expense` models
- [ ] Add `deletedAt` and `clientId` to all entity models (soft delete support)
- [ ] Update repositories with `findByUserIdAndUpdatedAtAfter()` methods
- [ ] Create `SyncDto.java` with `PushRequest`, `PullResponse`, `SyncItem`
- [ ] Create `SyncController.java` with `/api/sync/push` and `/api/sync/pull` endpoints
- [ ] Create `SyncService.java` with Last-Write-Wins conflict resolution
- [ ] Update all service delete methods to soft-delete (set `deletedAt`)

**Desktop Frontend tasks remaining:**
- [ ] Update Rust SQLite schema in `db.rs` - add `server_id`, `sync_status`, `deleted_at`, `updated_at` columns
- [ ] Update Rust models in `models.rs` with sync fields
- [ ] Add sync Tauri commands in `commands.rs`
- [ ] Register sync commands in `lib.rs`
- [ ] Create `desktop/src/lib/sync.ts` - sync engine with push/pull logic
- [ ] Add sync status indicator to `Layout.tsx`
- [ ] Start sync engine in `App.tsx` on auth

## 📱 Phase 4: Expo Mobile App (TODO)

**Tasks remaining:**
- [ ] Initialize Expo project at `mobile/`
- [ ] Install dependencies (expo-auth-session, expo-sqlite, react-navigation, etc.)
- [ ] Create shared lib files (types, api, store, sync)
- [ ] Implement Google Sign-In for mobile using expo-auth-session
- [ ] Create navigation structure (AuthStack, MainTabs)
- [ ] Build screens (Calendar, Diary, Tasks, Expenses, Projects)
- [ ] Implement SQLite offline storage
- [ ] Implement sync engine for mobile
- [ ] Apply Clarity design system (terracotta theme)

## 🔧 Setup Instructions

### Backend Setup

1. **Google Cloud Console Setup:**
   - Go to https://console.cloud.google.com/apis/credentials
   - Create OAuth 2.0 Client ID (Web application)
   - Add authorized JavaScript origins: `http://localhost:5173`, `tauri://localhost`
   - Copy the Client ID

2. **Backend Configuration:**
   ```bash
   cd backend
   cp .env.example .env
   ```
   Edit `.env`:
   - Set `GOOGLE_CLIENT_ID` to your Google OAuth Client ID
   - Set `DATABASE_URL` to your Supabase PostgreSQL connection string
   - Set `JWT_SECRET` to a secure random string (generate with `openssl rand -hex 32`)

3. **Run Backend:**
   ```bash
   mvn spring-boot:run
   ```

### Desktop Frontend Setup

1. **Desktop Configuration:**
   ```bash
   cd desktop
   cp .env.example .env
   ```
   Edit `.env`:
   - Set `VITE_GOOGLE_CLIENT_ID` to your Google OAuth Client ID (same one from backend)

2. **Install & Run:**
   ```bash
   npm install
   npm run tauri dev
   ```

## 🧪 Testing

### Google Authentication Test
1. Start backend: `cd backend && mvn spring-boot:run`
2. Start desktop: `cd desktop && npm run tauri dev`
3. Click "Sign in with Google" button
4. Should redirect to Google login
5. After successful login, should see:
   - User avatar from Google in sidebar
   - Username in greeting
   - JWT token stored in Zustand state

### Expected Behavior
- ✅ Google button is clickable and shows official Google branding
- ✅ Redirects to google.com for authentication
- ✅ Returns to app with user logged in
- ✅ Avatar appears in sidebar
- ✅ Can use app normally (diary, tasks, etc.)
- ✅ Logout works correctly

## 📝 Next Steps

1. **Complete Phase 3 (Sync)** - This is the largest phase with ~15 files to modify
2. **Complete Phase 4 (Mobile)** - Create full Expo app with same features
3. **Test end-to-end sync** - Create task on desktop, see it on mobile
4. **Test offline mode** - Disconnect, make changes, reconnect, verify sync
5. **Deploy backend to production** - Update CORS for production domains

## 🚨 Important Notes

- **Password field is now nullable** in User model - Google users have no password
- **JWT token now includes userId, email, avatarUrl** - update any code that depends on TokenResponse
- **CORS is configured for development** - add production domains before deploying
- **Google Client ID must be the same** for backend and desktop
- **Sync is NOT YET IMPLEMENTED** - data is still local-only until Phase 3 is complete

---

Generated: 2026-09-23
