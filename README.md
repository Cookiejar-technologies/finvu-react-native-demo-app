# Finvu Mobile SDK Integration Guide - React Native

## Code Guidelines

### 1. Avoid Third-Party Imports
In the AA journey screens, ensure that only AA flow-related code is present. No third-party API requests unrelated to the AA journey.

### 2. Do Not Store Data in Device Local Storage
Avoid storing data in local storage mechanisms like AsyncStorage or local databases.

### 3. Clean Data and Instances
Ensure all data is cleaned up when the AA journey ends, including closing states and clearing objects.

### 4. Avoid Redundant Calls
Minimize repeated calls to SDK methods to optimize performance and reduce unnecessary network requests.

### 5. Logout and Disconnect
Always call `logout()` and `disconnect()` when the user exits the AA journey, regardless of the outcome.

## Latest SDK Version
- React Native SDK: v1.0.3

## Prerequisites
- Minimum Android SDK version: 24
- Minimum iOS version: 16
- React Native version: Compatible with latest version

## Installation
1. Install the SDK:
```bash
    "finvu": "github:Cookiejar-technologies/finvu-expo-module",
```

2. Android Configuration (Project-level `build.gradle`):
```gradle
allprojects {
    repositories {
        google()
        mavenCentral()
        
        maven { 
            url 'https://maven.pkg.github.com/Cookiejar-technologies/finvu_android_sdk' 
            credentials {
                username = System.getenv("GITHUB_PACKAGE_USERNAME")
                password = System.getenv("GITHUB_PACKAGE_TOKEN")
            }
        }
    }
}
```

3. Android Configuration (App-level `build.gradle`):
```gradle
android {
    defaultConfig {
        minSdkVersion 24
    }
}
```

3. Build & Run React Native app:
```
npm install
npm run android
```


## SDK Initialization and Connection Management
```typescript
import * as Finvu from 'finvu';

// Initialize SDK
const config = {
    finvuEndpoint: "wss://wsslive.finvu.in/consentapi",
    certificatePins: [
        "TmZriS3UEzT3t5s8SJATgFdUH/llYL8vieP2wOuBAB8=",
        "aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890+/="
    ] // optional
};

// Initialize
const initResult = await Finvu.initializeWith(config);

// Connect to service
const connectResult = await Finvu.connect();
```

## Authentication

### Login with Consent Handle
```typescript
const loginResult = await Finvu.loginWithUsernameOrMobileNumber(
    consentHandleId: "CONSENT_HANDLE_ID",
    username: "USER_HANDLE",
    mobileNumber: "MOBILE_NUMBER"
);

// Verify OTP
const verifyResult = await Finvu.verifyLoginOtp(
    otp: "111111",
    otpReference: loginResult.data.reference
);

// Logout
const logoutResult = await Finvu.logout();
```

## FIP Management

### Fetch FIP Options
```typescript
const fipsResult = await Finvu.fipsAllFIPOptions();

// Fetch specific FIP details
const fipDetailsResult = await Finvu.fetchFipDetails("FIP_ID");
```

## Account Discovery

### Discover Accounts
```typescript
const discoveryResult = await Finvu.discoverAccounts(
    fipId: "FIP_ID",
    fiTypes: ["DEPOSIT", "RECURRING_DEPOSIT"],
    identifiers: [
        {
            category: "STRONG",
            type: "MOBILE",
            value: "930910XXXX"
        },
        {
            category: "WEAK",
            type: "PAN",
            value: "DFKPGXXXXR"
        }
    ]
);
```

## Account Linking

### Link Accounts
```typescript
// Initiate account linking
const linkingResult = await Finvu.linkAccounts(
    accounts: selectedAccounts,
    fipDetails: fipDetails
);

// Confirm linking with OTP
const confirmLinkingResult = await Finvu.confirmAccountLinking(
    referenceNumber: linkingResult.data.referenceNumber,
    otp: "123456"
);

// Fetch linked accounts
const linkedAccountsResult = await Finvu.fetchLinkedAccounts();
```

## Consent Management

### Manage Consent
```typescript
// Get consent details
const consentDetailsResult = await Finvu.getConsentRequestDetails(handleId);

// Approve consent
const approveResult = await Finvu.approveConsentRequest(
    consentDetails: consentRequestDetailInfo,
    linkedAccounts: selectedAccounts
);

// Deny consent
const denyResult = await Finvu.denyConsentRequest(consentRequestDetailInfo);
```

## SDK Error Codes

| Code | Description |
|------|-------------|
| 1001 | AUTH_LOGIN_RETRY |
| 1002 | AUTH_LOGIN_FAILED |
| 8000 | SESSION_DISCONNECTED |
| 9999 | GENERIC_ERROR |

## Frequently Asked Questions

### GitHub Authentication
Set up GitHub Personal Access Token (PAT) with package read permissions:
```
GITHUB_PACKAGE_USERNAME=your_github_username
GITHUB_PACKAGE_TOKEN=your_github_pat
```

### Handling Errors
```typescript
try {
    const result = await Finvu.someMethod();
    if (result.isSuccess) {
        // Process successful result
    } else {
        // Handle specific error
        console.error(result.error.code, result.error.message);
    }
} catch (error) {
    // Handle unexpected errors
}
```

## Support
For further assistance, contact Finvu support or refer to the detailed documentation.