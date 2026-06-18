# V2.17.8 SDK54 — no warning banner + swipe fix

- Suppressed React Native/Expo development warning overlay via LogBox.ignoreAllLogs(true).
- Removed app console.warn calls from photo/file pickers.
- Added capture-level touch swipe handler in AppShell so horizontal swipes work even when screen content is inside ScrollView.
- Right swipe: back. Left swipe: forward when forward history exists.
- SDK remains Expo 54.
