# Flutter FCM Integration Guide

This guide explains how to integrate Firebase Cloud Messaging (FCM) with the Photopia backend.

## 1. Firebase Project Setup

1.  **Create Firebase Project**: Go to [Firebase Console](https://console.firebase.google.com/).
2.  **Add Apps**: Add your Android (`google-services.json`) and iOS (`GoogleService-Info.plist`) apps.
3.  **Enable FCM**: Ensure Cloud Messaging is enabled in the Firebase settings.

## 2. Flutter Dependencies

Add these to your `pubspec.yaml`:

```yaml
dependencies:
  firebase_core: ^latest_version
  firebase_messaging: ^latest_version
  flutter_local_notifications: ^latest_version # Recommended for foreground alerts
```

## 3. Initialization & Permissions

Initialize Firebase and request permissions for notifications in your `main.dart`.

```dart
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  // Request permission for iOS/Android 13+
  FirebaseMessaging messaging = FirebaseMessaging.instance;
  NotificationSettings settings = await messaging.requestPermission(
    alert: true,
    badge: true,
    sound: true,
  );
}
```

## 4. Registering Device Token

To receive notifications, the backend needs the device's unique token. Send this token to the backend during **Login** or **App Startup**.

```dart
// Get the FCM token
String? token = await FirebaseMessaging.instance.getToken();

// Send this to the backend
// API: PATCH /user/update-profile
// Request Body: { "deviceToken": "YOUR_FCM_TOKEN" }
```

## 5. Handling Notifications

The backend sends notifications with a `data` payload containing `type`, `notificationId`, and `actionUrl`.

### A. Foreground (App is open)
```dart
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  print('Got a message whilst in the foreground!');
  if (message.notification != null) {
    // Show a local notification using flutter_local_notifications
    _showLocalNotification(message);
  }
});
```

### B. Background/Terminated (User clicks notification)
```dart
FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
  print('User clicked notification!');
  String? actionUrl = message.data['actionUrl'];
  if (actionUrl != null) {
      // Navigate to the specific screen based on actionUrl
      Navigator.pushNamed(context, actionUrl);
  }
});
```

## 6. Deep Linking (actionUrl)

The backend includes an `actionUrl` in the `data` payload. Your Flutter app should parse this to navigate the user directly to the relevant content (e.g., a specific message thread or payment receipt).

**Example Payload Structure:**
```json
{
  "notification": {
    "title": "New Message",
    "body": "You have a new message from Alex"
  },
  "data": {
    "type": "NEW_MESSAGE",
    "notificationId": "65f...",
    "actionUrl": "/messages/senderId",
    "senderId": "..."
  }
}
```

## 7. Troubleshooting

- **No Token**: Ensure `google-services.json` is in `android/app/` and `GoogleService-Info.plist` is in the iOS project through Xcode.
- **Background Messages**: For background handling, ensure you have a top-level `@pragma('vm:entry-point')` handler.
- **Permission**: On Android 13+, you must explicitly request `POST_NOTIFICATIONS` permission in the `AndroidManifest.xml`.
