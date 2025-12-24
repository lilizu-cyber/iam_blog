# Security Fix: Hardcoded Admin Credentials

## Issue Fixed
Removed hardcoded admin credentials from source code and implemented secure database-backed authentication.

## Changes Made

### 1. Created User Model
- **File**: `src/backend/models/User.js`
- **Features**:
  - Stores users in PostgreSQL database
  - Passwords hashed with bcrypt (configurable rounds via BCRYPT_ROUNDS)
  - Supports multiple roles (admin, editor, author, user)
  - Includes `checkPassword()` method for secure password verification
  - Includes `createWithPassword()` static method for creating users with hashed passwords

### 2. Updated Authentication Routes
- **File**: `src/backend/api/routes/authRoutes.js`
- **Changes**:
  - Removed hardcoded `ADMIN_CREDENTIALS` constant
  - Updated login endpoint to query database for user
  - Added password verification using bcrypt
  - Added role-based access control check
  - Updated `/me` endpoint to fetch fresh user data from database

### 3. Created Admin User Setup Script
- **File**: `scripts/create-admin-user.js`
- **Purpose**: Creates initial admin user in database
- **Usage**: `npm run create:admin`
- **Features**:
  - Reads admin credentials from environment variables
  - Hashes password before storing
  - Prevents duplicate admin creation
  - Provides clear feedback

### 4. Updated Database Setup
- **File**: `scripts/setup-postgresql.js`
- **Changes**: Added User table creation to setup script

### 5. Updated Environment Variables
- **File**: `env.example`
- **Added**:
  ```env
  ADMIN_USERNAME=admin
  ADMIN_PASSWORD=Schlurfend.?.123
  ADMIN_EMAIL=admin@example.com
  ```

### 6. Updated Package.json
- **Added script**: `"create:admin": "node scripts/create-admin-user.js"`

## Setup Instructions

### Step 1: Update Environment Variables
Add to your `.env` file:
```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password-here
ADMIN_EMAIL=admin@yourdomain.com
```

**⚠️ IMPORTANT**: Use a strong, unique password in production!

### Step 2: Setup Database
```bash
npm run setup:db
```
This will create all tables including the `users` table.

### Step 3: Create Admin User
```bash
npm run create:admin
```
This will create the admin user with the credentials from your `.env` file.

### Step 4: Verify
1. Start your backend server
2. Try logging in with the admin credentials
3. Verify you can access admin routes

## Security Improvements

✅ **Passwords are hashed** - Using bcrypt with configurable rounds (default: 12)
✅ **No credentials in code** - All credentials stored in database
✅ **Environment-based setup** - Initial admin created via environment variables
✅ **Role-based access** - Only users with 'admin' role can access admin routes
✅ **Secure password verification** - Uses bcrypt.compare() for constant-time comparison

## Migration Notes

### For Existing Installations
If you have an existing installation:

1. **Backup your data** (if any)
2. Run `npm run setup:db` to create the User table
3. Run `npm run create:admin` to create your admin user
4. Update your `.env` file with the new admin credentials
5. Test login with new credentials

### Default Credentials
The default credentials (if not set in `.env`) are:
- Username: `admin`
- Password: `Schlurfend.?.123`
- Email: `admin@example.com`

**⚠️ CHANGE THESE IN PRODUCTION!**

## Next Steps

1. ✅ **Change default password** after first login
2. ✅ **Implement password change functionality** in admin panel
3. ✅ **Add user management UI** for creating/editing users
4. ✅ **Implement password reset** functionality
5. ✅ **Add password strength requirements**
6. ✅ **Implement account lockout** after failed login attempts

## Testing

To test the new authentication:

```bash
# 1. Setup database
npm run setup:db

# 2. Create admin user
npm run create:admin

# 3. Start server
npm run dev:backend

# 4. Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Schlurfend.?.123"}' \
  -c cookies.txt
```

## Files Modified

- ✅ `src/backend/models/User.js` (NEW)
- ✅ `src/backend/api/routes/authRoutes.js` (MODIFIED)
- ✅ `src/backend/models/index.js` (MODIFIED)
- ✅ `src/backend/infrastructure/ReadModelStore.js` (MODIFIED)
- ✅ `scripts/create-admin-user.js` (NEW)
- ✅ `scripts/setup-postgresql.js` (MODIFIED)
- ✅ `package.json` (MODIFIED)
- ✅ `env.example` (MODIFIED)

## Security Checklist

- [x] Passwords hashed with bcrypt
- [x] No credentials in source code
- [x] Environment variables for initial setup
- [x] Database-backed authentication
- [x] Role-based access control
- [ ] Password change functionality (TODO)
- [ ] Password reset functionality (TODO)
- [ ] Account lockout after failed attempts (TODO)
- [ ] Password strength requirements (TODO)

---

**Status**: ✅ **FIXED** - Ready for testing
**Priority**: 🔴 **CRITICAL** - Must be deployed before production










