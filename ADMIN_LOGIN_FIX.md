# Admin Login Troubleshooting Guide

## Masalah: Admin login tidak berfungsi dengan username "admin" dan password "admin"

### Penyebab Kemungkinan

1. **Database belum di-import** → OOAD schema belum ada di MySQL
2. **Tabel belum memiliki data admin** → Insert statement belum dijalankan
3. **Browser cache** → localStorage masih berisi data lama
4. **PHP endpoint error** → Server PHP belum running atau path salah

---

## Solusi Langkah-demi-Langkah

### LANGKAH 1: Test Login dengan Demo Mode (No PHP Needed)

1. Buka file `TEST_ADMIN_LOGIN.html` di browser
   - Buka: `file:///C:/Users/LENOVO/Desktop/School/Python/pagi_sore_frontend/TEST_ADMIN_LOGIN.html`
   
2. Click tombol **"Test Demo (admin/admin)"**
   - Jika berhasil (✅): Demo mode berfungsi, berarti issue di PHP backend
   - Jika gagal (❌): Ada issue di api.js atau browser JavaScript

3. Jika demo mode OK, bisa langsung cek di admin/login.html:
   - Buka: `file:///C:/Users/LENOVO/Desktop/School/Python/pagi_sore_frontend/admin/login.html`
   - Username: `admin`
   - Password: `admin`
   - Harusnya bisa login dan redirect ke dashboard.html

### LANGKAH 2: Jika Ingin Menggunakan PHP Backend

1. **Setup XAMPP:**
   ```
   - Start Apache + MySQL di XAMPP Control Panel
   - Pastikan MySQL running di port 3306
   ```

2. **Import Database:**
   ```sql
   -- Buka phpMyAdmin: http://localhost/phpmyadmin
   -- Buat database baru atau import schema_ooad.sql
   
   -- Atau via command line:
   mysql -u root < "C:\Users\LENOVO\Desktop\School\Python\pagi_sore_frontend\backend\sql\schema_ooad.sql"
   ```

3. **Verify Admin Data:**
   ```sql
   USE pagi_sore;
   SELECT * FROM admin;
   -- Harus ada 1 record: admin_id=1, username=admin, password=admin
   ```

4. **Test PHP Endpoint di TEST_ADMIN_LOGIN.html:**
   - Click **"Test PHP Endpoint"**
   - Jika response status 200 dan ada `"ok": true` → PHP working
   - Jika error → Check Apache error log atau XAMPP console

5. **Test Full Admin Login:**
   - Click **"Test Full Admin Login"**
   - Harusnya berhasil dan set PSAdmin flag di localStorage

---

## Quick Checklist

### ✅ Demo Mode (File-based, No Database)

```
1. Open admin/login.html in browser
2. Username: admin
3. Password: admin
4. Harusnya berhasil login
```

**Jika gagal:**
- Open browser DevTools (F12)
- Go to Console tab
- Look for error messages
- Check localStorage in Application tab

### ✅ PHP Backend Mode (Dengan MySQL)

**Prerequisites:**
- XAMPP running (Apache + MySQL)
- schema_ooad.sql sudah di-import ke MySQL
- admin data sudah terinsert

**Test:**
1. Modify admin/login.html to show errors:
   - Already done in latest version
   - Check browser console for error messages

2. Check MySQL:
   ```sql
   mysql -u root pagi_sore -e "SELECT * FROM admin;"
   ```

3. Check PHP file permissions:
   - `backend/php/*.php` harus readable
   - `backend/uploads/` harus writable

---

## Demo Mode Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin |
| Customer | Demo User | user123 |

---

## Files Affected in Latest Fix

1. **`admin_login.php`**
   - Changed: `admins` table → `admin` table
   - Changed: SELECT fields to include admin_id, username, name

2. **`admin/login.html`**
   - Added: Error logging and console messages
   - Fixed: Better error handling and feedback

3. **`js/api.js`**
   - Fixed: Demo customer name from "user" → "Demo User"
   - Ensured: STORAGE.admin has correct credentials

---

## Testing Procedure

### Method 1: Demo Only (Recommended for Quick Test)

```bash
# 1. Clear browser cache/localStorage
# 2. Open admin/login.html
# 3. Username: admin, Password: admin
# 4. Should see "Admin login berhasil" message
# 5. Should redirect to dashboard.html
```

### Method 2: With PHP + MySQL

```bash
# 1. Start XAMPP (Apache + MySQL)
# 2. Import schema: mysql < schema_ooad.sql
# 3. Verify admin exists: mysql pagi_sore -e "SELECT * FROM admin;"
# 4. Access via http://localhost/pagi_sore_frontend/admin/login.html
# 5. Username: admin, Password: admin
# 6. Should redirect to dashboard.html
```

---

## Debug Checklist

- [ ] Browser DevTools Console shows no JavaScript errors
- [ ] admin/login.html form submits (no form validation errors)
- [ ] adminLogin() function is called
- [ ] API response is received (check network tab)
- [ ] PSAdmin flag set in localStorage (check Application tab)
- [ ] Redirect happens successfully to dashboard.html
- [ ] dashboard.html loads without errors

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Invalid admin credentials" | Check STORAGE.admin in api.js or database |
| Redirects to login.html | Check if PSAdmin flag is set, might be missing |
| PHP endpoint returns error | Check MySQL is running, schema imported, admin data exists |
| Network 404 on admin_login.php | Check XAMPP path is correct and Apache serving files |
| localStorage cleared | Use demo mode or log in again |

---

## Next Steps

1. **Test demo mode** first (no dependencies)
2. **If demo works** but PHP doesn't → Check MySQL setup
3. **If both work** → Full system is ready for production testing
4. **If still issues** → Check browser console for specific error messages

