# Android Firebase SHA setup (Phone OTP)

Phone OTP on a real device usually needs your EAS keystore fingerprints in Firebase.

## Get SHA-1 and SHA-256

### Option A — Expo website (easiest)
1. Open: https://expo.dev/accounts/adarsh_dev/projects/zippycar/credentials
2. Android → credentials / keystore
3. Copy **SHA-1** and **SHA-256**

### Option B — Terminal (interactive)
```powershell
cd d:\Zippycar\mobile
npx eas-cli credentials -p android
```
Select build profile `development` → view keystore fingerprints.

## Add to Firebase
1. Firebase Console → Project settings (gear)
2. Your apps → Android `com.zippycar.app`
3. **Add fingerprint** → paste SHA-1
4. **Add fingerprint** → paste SHA-256
5. Save

No APK rebuild needed for fingerprints alone.

## Test number must match exactly
Firebase → Authentication → Sign-in method → Phone numbers for testing:

| Field | Example |
|-------|---------|
| Phone | `+919090909090` |
| Code | `123456` |

In the app enter only `9090909090` (we add `+91` in code).

## After changing JS (already done)
Reload the app in the Zippycar dev client (shake device → Reload, or press `r` in Metro).
You do **not** need a new EAS build for the modular API / clearer error messages.
