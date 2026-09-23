# Clarity - Google Auth + Cloud Sync + Mobile App Implementation
**Session Date:** 2026-09-23

## Overview
Working on adding three major features to Clarity (personal diary/tracker app):
1. ✅ Google OAuth Authentication (COMPLETE)
2. ⏳ Cloud Sync with Supabase (TODO)
3. ⏳ Expo React Native Mobile App (TODO)

---

## ✅ Phase 1 & 2: Google Authentication (COMPLETE)

### What Was Implemented

#### Backend Changes (Spring Boot)
- **Added Google OAuth dependency** - `google-api-client` v2.7.0 in `pom.xml`
- **Updated User model** (`User.java`):
  - Added `googleId` (String, unique) - stores Google's user ID
  - Added `avatarUrl` (String) - Google profile picture
  - Added `authProvider` (String) - tracks "LOCAL" or "GOOGLE"
  - Made `password` nullable (Google users don't have passwords)
- **New repository method** - `findByGoogleId()` in `UserRepository.java`
- **Expanded DTOs** (`AuthDto.java`):
  - New `GoogleAuthRequest` with `idToken` field
  - Updated `TokenResponse` to include `userId`, `email`, `avatarUrl`
- **Implemented Google login** (`AuthService.java`):
  - `googleLogin()` method verifies Google ID token
  - Looks up user by googleId, then by email (to link existing accounts)
  - Creates new user if not found
  - Returns JWT with full user details
- **New endpoint** - `POST /api/auth/google` in `AuthController.java`
- **Configuration updates**:
  - `application.yml` - added `clarity.google.client-id` config
  - Changed datasource URL to use `DATABASE_URL` env var (for Supabase)
  - `CorsConfig.java` - added Expo dev origins (`localhost:19000`, `exp://`, etc.)
  - `.env.example` - added `GOOGLE_CLIENT_ID` and `DATABASE_URL` variables

#### Desktop Frontend Changes (React + Tauri)
- **Created Google auth helper** (`google-auth.ts`):
  - Loads Google Identity Services (GSI) script dynamically
  - `initGoogleAuth()` - initializes with client ID
  - `renderGoogleButton()` - renders official Google button
  - TypeScript declarations for `window.google` global
- **Updated types** (`types.ts`):
  - `AuthResponse` now includes `token`, `email`, `avatarUrl`
  - Added `GoogleAuthRequest` interface
- **Updated Zustand store** (`store.ts`):
  - Added `email`, `avatarUrl`, `token` to state
  - Added `googleLogin(idToken)` action
  - Updated `login()` and `register()` to store new fields
- **Updated API client** (`api.ts`):
  - Added `API_BASE_URL` constant for backend
  - Added `httpRequest()` helper for backend API calls
  - Added `googleLogin(idToken)` method
  - Changed from Tauri `invoke()` to HTTP for auth endpoints
- **Enhanced AuthPage** (`AuthPage.tsx`):
  - Added `GoogleSignInButton` component
  - Loads GSI script on mount
  - Renders official Google "Sign in with Google" button
  - Added divider ("or") between form and Google button
  - Error handling for Google auth failures
  - Loading state during Google authentication
- **Updated Layout** (`Layout.tsx`):
  - Shows Google avatar image if available
  - Falls back to letter initial if no avatar
  - Uses `referrerPolicy="no-referrer"` for Google images
- **Created desktop env template** (`.env.example`):
  - `VITE_GOOGLE_CLIENT_ID` - Google OAuth Client ID
  - `VITE_API_URL` - Backend URL (default localhost:8080)

### Files Modified (18 total)
```
Backend (9 files):
  backend/pom.xml
  backend/.env.example
  backend/src/main/resources/application.yml
  backend/src/main/java/com/clarity/model/User.java
  backend/src/main/java/com/clarity/repository/UserRepository.java
  backend/src/main/java/com/clarity/dto/AuthDto.java
  backend/src/main/java/com/clarity/service/AuthService.java
  backend/src/main/java/com/clarity/controller/AuthController.java
  backend/src/main/java/com/clarity/config/CorsConfig.java

Desktop (9 files):
  desktop/.env.example (NEW)
  desktop/src/lib/google-auth.ts (NEW)
  desktop/src/lib/types.ts
  desktop/src/lib/store.ts
  desktop/src/lib/api.ts
  desktop/src/pages/AuthPage.tsx
  desktop/src/components/Layout.tsx
  IMPLEMENTATION_STATUS.md (NEW - detailed status doc)
```

### How It Works

1. **User clicks "Sign in with Google"** button in AuthPage
2. **Google GSI library loads** from `https://accounts.google.com/gsi/client`
3. **Google authentication popup** appears (real Google OAuth flow)
4. **User authenticates** with their Google account
5. **Google returns ID token** (JWT signed by Google)
6. **Frontend sends token** to `POST /api/auth/google`
7. **Backend verifies token** using `GoogleIdTokenVerifier`:
   - Checks signature, audience, issuer, expiry
   - Extracts user info (googleId, email, name, picture)
8. **Backend finds or creates user**:
   - Looks up by googleId first
   - Then by email (to link existing accounts)
   - Creates new user if not found
9. **Backend issues JWT** with user details
10. **Frontend stores token** in Zustand (persisted to localStorage)
11. **User is logged in** - avatar appears in sidebar!

### Testing Instructions

1. **Google Cloud Console Setup:**
   ```
   - Go to: https://console.cloud.google.com/apis/credentials
   - Create OAuth 2.0 Client ID (Web application)
   - Authorized JavaScript origins:
     * http://localhost:5173
     * tauri://localhost
   - Copy Client ID
   ```

2. **Backend Configuration:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env:
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   DATABASE_URL=postgresql://localhost:5432/clarity  # or Supabase URL
   JWT_SECRET=<generate with: openssl rand -hex 32>
   ```

3. **Desktop Configuration:**
   ```bash
   cd desktop
   cp .env.example .env
   # Edit .env:
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```

4. **Run Backend:**
   ```bash
   cd backend
   mvn spring-boot:run
   ```

5. **Run Desktop:**
   ```bash
   cd desktop
   npm install  # if first time
   npm run tauri dev
   ```

6. **Test:**
   - Click "Sign in with Google" button
   - Authenticate with Google account
   - Verify: Google avatar shows in sidebar
   - Verify: Can access diary, tasks, etc.
   - Verify: Logout works correctly

---

## ⏳ Phase 3: Cloud Sync Infrastructure (TODO)

### Goal
Enable data sync between devices using Supabase PostgreSQL as single source of truth, with local SQLite as offline cache. Last-Write-Wins conflict resolution based on `updatedAt` timestamps.

### Backend Tasks Remaining (~8 files)
- [ ] **Add `updatedAt` column** to `CalendarEvent` and `Expense` models
- [ ] **Add soft-delete support** to all models:
  - Add `deletedAt` (Instant, nullable) column
  - Add `clientId` (UUID) column for client-server mapping
  - Update `@PreUpdate` hooks
- [ ] **Update repositories** with sync queries:
  - `findByUserIdAndUpdatedAtAfter(userId, since)` - for pull
  - Filter out soft-deleted records in normal queries
- [ ] **Create sync DTOs** (`SyncDto.java`):
  - `PushRequest` - what client sends (changed items)
  - `PullResponse` - what server returns (all changes since timestamp)
  - `SyncItem` - individual entity with metadata
- [ ] **Create SyncService** (`SyncService.java`):
  - `push()` method - applies client changes with LWW conflict resolution
  - `pull()` method - returns all changes since timestamp
  - Compare `updatedAt` timestamps (client vs server)
  - Server wins if timestamps equal or server newer
- [ ] **Create SyncController** (`SyncController.java`):
  - `POST /api/sync/push` - receive client changes
  - `GET /api/sync/pull?since={timestamp}` - send server changes
- [ ] **Update all service delete methods** to soft-delete (set `deletedAt` instead of actual delete)
- [ ] **Update GET queries** to filter `WHERE deletedAt IS NULL`

### Desktop Frontend Tasks Remaining (~10 files)
- [ ] **Update SQLite schema** (`desktop/src-tauri/src/db.rs`):
  - Add to all tables: `server_id`, `client_id`, `updated_at`, `deleted_at`, `sync_status`
  - Create `sync_meta` table for last sync timestamp
  - Run as migrations (ALTER TABLE statements)
- [ ] **Update Rust models** (`models.rs`):
  - Add sync fields to all structs
  - Ensure `serde(rename_all = "camelCase")` for JSON
- [ ] **Add sync commands** (`commands.rs`):
  - `get_pending_changes(user_id)` - query `WHERE sync_status = 'PENDING'`
  - `apply_server_changes(items)` - upsert server data
  - `mark_synced(table, client_id, server_id)` - update after successful sync
  - `get_last_sync_time()` / `set_last_sync_time()` - timestamp management
- [ ] **Update existing Rust commands**:
  - Set `sync_status = 'PENDING'` on create/update
  - Set `deleted_at` instead of DELETE on soft delete
  - Set `client_id` (UUID v4) on creation
- [ ] **Register new commands** (`lib.rs`) in `generate_handler!`
- [ ] **Create sync engine** (`desktop/src/lib/sync.ts`):
  - `sync()` method - orchestrates push then pull
  - `startPeriodicSync(30000)` - sync every 30 seconds
  - `stopSync()` - cleanup on logout
  - Push: collect pending, POST to backend, update sync_status
  - Pull: GET from backend, apply locally, update last_sync_time
- [ ] **Update API client** (`api.ts`):
  - Add `syncPush(items)` method
  - Add `syncPull(since?)` method
  - Use `Authorization: Bearer ${token}` header
- [ ] **Add sync state** to Zustand (`store.ts`):
  - `syncStatus: 'idle' | 'syncing' | 'error'`
  - `lastSyncAt: string | null`
  - `triggerSync()` action
- [ ] **Add sync indicator** to Layout (`Layout.tsx`):
  - Cloud icon with status (syncing/synced/error)
  - Click to manually trigger sync
- [ ] **Start sync engine** (`App.tsx`):
  - Call `syncEngine.startPeriodicSync()` when authenticated
  - Stop on logout

### Sync Flow
```
1. User creates/edits item locally
2. SQLite: set sync_status='PENDING', updated_at=now()
3. Sync engine (every 30s):
   a. Push: collect pending items → POST /api/sync/push
   b. Server compares updatedAt: if client newer, apply; else skip (LWW)
   c. Server returns accepted items + server IDs
   d. Client updates: sync_status='SYNCED', server_id=<id>
   e. Pull: GET /api/sync/pull?since=<lastSync>
   f. Server returns all items changed since timestamp
   g. Client applies: upsert to SQLite, update sync_status
   h. Store new lastSyncTime
```

### Key Decisions
- **Last-Write-Wins** - Server compares `updatedAt` timestamps
- **Soft deletes** - Items marked with `deletedAt` instead of hard delete
- **Client IDs** - UUID generated locally for new items, maps to server ID after sync
- **Sync on**: App start, every 30s, manual button, reconnect after offline

---

## ⏳ Phase 4: Expo React Native Mobile App (TODO)

### Goal
Create a full-featured mobile app (iOS + Android) that:
- Uses same Spring Boot backend
- Same Google Sign-In flow
- Same SQLite offline storage
- Same sync engine
- Same UI design (terracotta theme, ruled ledger style)

### Project Setup
```bash
# In Clarity root:
npx create-expo-app@latest mobile --template blank-typescript
cd mobile
```

### Dependencies to Install
```bash
# Auth & Storage
npx expo install expo-auth-session expo-web-browser expo-crypto
npx expo install expo-secure-store
npx expo install @react-native-async-storage/async-storage

# Database
npx expo install expo-sqlite

# Navigation
npx expo install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npx expo install react-native-screens react-native-safe-area-context

# UI & Animations
npx expo install react-native-reanimated
npm install zustand dayjs lucide-react-native

# Network
npx expo install @react-native-community/netinfo
```

### Project Structure
```
mobile/
  app.json
  App.tsx
  src/
    navigation/
      RootNavigator.tsx      # Auth check, routes to AuthStack or MainTabs
      AuthStack.tsx          # Login/Register screens
      MainTabs.tsx           # Bottom tab navigator (5 tabs)
    screens/
      LoginScreen.tsx
      RegisterScreen.tsx
      CalendarScreen.tsx
      DiaryScreen.tsx
      TasksScreen.tsx
      ExpensesScreen.tsx
      ProjectsScreen.tsx
    lib/
      api.ts                 # HTTP client (always talks to backend)
      auth.ts                # Token management with expo-secure-store
      store.ts               # Zustand store (same shape as desktop)
      types.ts               # Copy from desktop or shared
      sync.ts                # Sync engine for mobile
      db.ts                  # expo-sqlite setup
      theme.ts               # Terracotta design tokens
    components/
      GoogleSignInButton.tsx # Using expo-auth-session
      SyncIndicator.tsx
      ... (shared UI components)
```

### Key Implementations

#### 1. Google Sign-In for Mobile (`GoogleSignInButton.tsx`)
```typescript
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export function GoogleSignInButton({ onSuccess }) {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      onSuccess(id_token); // Send to backend
    }
  }, [response]);

  return (
    <Pressable onPress={() => promptAsync()}>
      {/* Custom styled Google button */}
    </Pressable>
  );
}
```

#### 2. Secure Token Storage (`auth.ts`)
```typescript
import * as SecureStore from 'expo-secure-store';

export const AuthStorage = {
  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync('clarity_token');
  },
  async setToken(token: string) {
    await SecureStore.setItemAsync('clarity_token', token);
  },
  async clear() {
    await SecureStore.deleteItemAsync('clarity_token');
  },
};
```

#### 3. Mobile API Client (`api.ts`)
```typescript
const BACKEND_URL = __DEV__ 
  ? 'http://192.168.x.x:8080'  // Your computer's local network IP
  : 'https://clarity-api.yourdomain.com';

class MobileApiClient {
  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const token = await AuthStorage.getToken();
    const res = await fetch(`${BACKEND_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async googleLogin(idToken: string) { /* same as desktop */ }
  async getTasks() { /* same as desktop */ }
  // ... all other methods
}
```

#### 4. Mobile SQLite (`db.ts`)
```typescript
import * as SQLite from 'expo-sqlite';

export async function initDatabase() {
  const db = await SQLite.openDatabaseAsync('clarity.db');
  await db.execAsync(`
    PRAGMA journal_mode=WAL;
    PRAGMA foreign_keys=ON;
    
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      due_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      server_id INTEGER,
      client_id TEXT,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'PENDING'
    );
    -- Same for other tables
  `);
  return db;
}
```

#### 5. Mobile Sync Engine (`sync.ts`)
```typescript
// Same logic as desktop but:
// - Uses expo-sqlite instead of Tauri invoke
// - Uses NetInfo for online/offline detection
// - Syncs on app foreground (AppState listener)
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';

class MobileSyncEngine {
  start() {
    // Initial sync
    this.sync();
    
    // Periodic (30s)
    this.interval = setInterval(() => this.sync(), 30000);
    
    // On reconnect
    this.unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) this.sync();
    });
    
    // On foreground
    AppState.addEventListener('change', state => {
      if (state === 'active') this.sync();
    });
  }
  
  async sync() { /* same push/pull logic as desktop */ }
}
```

#### 6. Design System (`theme.ts`)
```typescript
export const LightTheme = {
  ground: '#E3E0D6',      // warm paper
  surface: '#F2F0E8',     // card background
  raised: '#FBFAF5',      // elevated
  rule: '#C8C3B4',        // borders
  ink: '#1B1F24',         // text
  inkSoft: '#5A6169',     // muted text
  inkFaint: '#8C939B',    // subtle text
  accent: '#C87467',      // terracotta
  accentSoft: '#D98A7E',  // lighter terracotta
  done: '#6B8065',        // green
  warn: '#C4880E',        // amber
  danger: '#BE1239',      // red
};

export const DarkTheme = { /* inverted palette */ };
```

#### 7. Bottom Tab Navigation (`MainTabs.tsx`)
```typescript
const Tab = createBottomTabNavigator();

export function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ /* styling */ }}>
      <Tab.Screen name="Calendar" component={CalendarScreen} 
        options={{ tabBarIcon: () => <Calendar /> }} />
      <Tab.Screen name="Diary" component={DiaryScreen}
        options={{ tabBarIcon: () => <BookOpen /> }} />
      <Tab.Screen name="Tasks" component={TasksScreen}
        options={{ tabBarIcon: () => <CheckSquare /> }} />
      <Tab.Screen name="Expenses" component={ExpensesScreen}
        options={{ tabBarIcon: () => <DollarSign /> }} />
      <Tab.Screen name="Projects" component={ProjectsScreen}
        options={{ tabBarIcon: () => <FolderKanban /> }} />
    </Tab.Navigator>
  );
}
```

### Mobile Testing
```bash
# Development
cd mobile
npx expo start

# Scan QR code with Expo Go app (iOS/Android)
# Or press 'a' for Android emulator, 'i' for iOS simulator

# Production builds
npx expo build:android
npx expo build:ios
```

### Google OAuth for Mobile
- Need separate Android and iOS Client IDs from Google Cloud Console
- Add to `app.json`:
  ```json
  {
    "expo": {
      "android": {
        "package": "com.clarity.app"
      },
      "ios": {
        "bundleIdentifier": "com.clarity.app"
      }
    }
  }
  ```
- Configure OAuth consent screen with mobile redirect URIs

---

## 📊 Implementation Progress

### Completed
- ✅ Phase 1: Backend Google Auth (9 files)
- ✅ Phase 2: Desktop Google Auth (9 files)
- ✅ Git commit created
- ✅ Documentation written

### Remaining Work Estimate
- ⏳ Phase 3: Cloud Sync (~15 files, ~3-4 hours)
  - Backend: 8 files (models, repos, services, controllers)
  - Desktop: 7 files (Rust + TypeScript)
- ⏳ Phase 4: Mobile App (~20+ files, ~5-6 hours)
  - Full Expo project setup
  - 7 screens + navigation
  - Auth, storage, sync implementations
  - Design system application

**Total remaining:** ~8-10 hours of focused development

---

## 🚀 Next Steps

When resuming:

1. **Test Phase 1 & 2 first:**
   - Set up Google OAuth credentials
   - Configure .env files
   - Run backend + desktop
   - Verify Google Sign-In works
   - Check avatar shows in sidebar

2. **Then choose path:**
   - **Option A:** Implement Phase 3 (Sync) - enables multi-device data sync
   - **Option B:** Implement Phase 4 (Mobile) - adds mobile app (sync will come after)
   - **Option C:** Do both in sequence (Sync first recommended)

3. **Recommended order:**
   - Complete Phase 3 (Sync) next
   - Test sync thoroughly (offline, conflicts, etc.)
   - Then Phase 4 (Mobile) - mobile will benefit from working sync

---

## 🔧 Configuration Checklist

### Before Testing
- [ ] Get Google OAuth Client ID from console.cloud.google.com
- [ ] Create `backend/.env` with `GOOGLE_CLIENT_ID`, `DATABASE_URL`, `JWT_SECRET`
- [ ] Create `desktop/.env` with `VITE_GOOGLE_CLIENT_ID`
- [ ] Set up Supabase PostgreSQL database (or use local Postgres)
- [ ] Run database migrations (Hibernate auto-updates schema)

### For Mobile (when ready)
- [ ] Get Android OAuth Client ID
- [ ] Get iOS OAuth Client ID
- [ ] Update `mobile/app.json` with package IDs
- [ ] Find your computer's local network IP for `BACKEND_URL`
- [ ] Configure OAuth redirect URIs for Expo

---

## 📝 Important Notes

### Database Schema Changes
- User table now has `google_id`, `avatar_url`, `auth_provider` columns
- Password is nullable (breaks existing NOT NULL constraint if migrating)
- Hibernate `ddl-auto: update` will auto-migrate, but test carefully

### Breaking Changes
- `AuthDto.TokenResponse` constructor signature changed
- `api.register()` and `api.login()` now use HTTP instead of Tauri invoke for desktop
- JWT token now stored in Zustand state (not just backend)

### Security Notes
- Google Client ID is public (safe to commit)
- JWT Secret must be strong random string
- Supabase connection string contains password (keep in .env)
- Mobile tokens stored in expo-secure-store (encrypted)

### CORS Configuration
Current CORS allows:
- `http://localhost:5173` - Vite dev
- `http://localhost:8081` - Expo dev
- `http://localhost:19000` - Expo Go
- `http://localhost:19006` - Expo web
- `tauri://localhost` - Tauri desktop
- `exp://localhost:19000` - Expo scheme

Add production domains before deploying!

---

## Git Commit
```
commit f43c035
feat(auth): implement Google OAuth authentication for backend and desktop

Phase 1 & 2 Complete: Google Sign-In with real clickable button
```

---

**Status:** Ready to continue with Phase 3 (Cloud Sync) or Phase 4 (Mobile App)
**Date:** 2026-09-23
**Session:** Can be resumed anytime - all progress committed to git
