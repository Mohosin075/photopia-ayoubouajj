# Flutter Notification & Socket Integration Guide

This document outlines the steps for a Flutter developer to implement real-time notifications using the existing backend.

## 1. Authentication
All API requests must include the Bearer token in the headers.
```dart
headers: {
  'Authorization': 'Bearer <YOUR_TOKEN>',
}
```

## 2. API Endpoints

### A. Fetch Notification List (Current User)
Retrieve all notifications for the logged-in user.
- **URL**: `GET /notification/my`
- **Query Params**: `page`, `limit`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "meta": { "page": 1, "limit": 10, "total": 25, "totalPages": 3 },
      "data": [
        {
          "_id": "65f...",
          "userId": "...",
          "title": "Welcome!",
          "content": "Hi there, welcome to Photopia!",
          "type": "WELCOME",
          "isRead": false,
          "createdAt": "..."
        }
      ]
    }
  }
  ```

### B. Notification Stats (Unread Count)
Get the number of unread notifications for the user.
- **URL**: `GET /notification/stats`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "total": 25,
      "unread": 5,
      "byType": { "WELCOME": 1, "SYSTEM": 4 },
      ...
    }
  }
  ```

### C. Mark All as Read
Mark all unread notifications of the current user as read.
- **URL**: `PATCH /notification/read-all`

### D. Mark Single as Read
Mark a specific notification as read.
- **URL**: `PATCH /notification/:id/read`

---

## 3. Socket.io Integration

### A. Connection & Joining Room
To receive private notifications, the user must join a "room" named after their `userId`.

1.  **Connect**: Same as messaging.
2.  **Join Room**: Emit a `join-notification` event (Note: Ensure this event is implemented in the backend helper).
    ```dart
    socket.emit('join-notification', currentUserId);
    ```

### B. Real-time Events (Listening)

#### 1. Listen for New Notifications
Listen for the generic `notification` event. This will give you various types of updates (e.g., system alerts, payment successes).
- **Event Name**: `notification`
- **Example**:
  ```dart
  socket.on('notification', (data) {
    if (data['type'] == 'NEW_NOTIFICATION') {
      final notification = data['data'];
      print("New Notification: " + notification['title']);
      // Update UI or show local push notification
    }
  });
  ```

---

## 4. Notification Types (Payload Types)
The backend uses different types of notifications. Keep an eye on the `type` field in the response:
- `WELCOME`
- `PAYMENT_SUCCESS`
- `PASSWORD_RESET`
- `ACCOUNT_VERIFICATION`
- `SYSTEM_ALERT`

---

## 5. Typical Workflow for Flutter

1.  **On App Startup/Login**: Connect to the Socket and emit `join-notification` with your `userId`.
2.  **Notification Icon**: Call `GET /notification/stats` periodically or refresh when you get a socket event to show the unread badge.
3.  **Notification Screen**: Call `GET /notification/my`.
4.  **On New Notification**: When the `notification` event is received via socket:
    - Increment unread counter.
    - Show an in-app banner or local push notification.
    - Refresh the list if the user is currently on the notification screen.
5.  **Opening a Notification**: When the user clicks a notification:
    - Call `PATCH /notification/:id/read`.
    - Navigate to the `actionUrl` if provided in the notification object.
