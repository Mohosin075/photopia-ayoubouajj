# Flutter Messaging & Socket Integration Guide

This document outlines the steps for a Flutter developer to implement real-time messaging using the existing backend.

## 1. Authentication
All API requests must include the Bearer token in the headers.
```dart
headers: {
  'Authorization': 'Bearer <YOUR_TOKEN>',
}
```

## 2. API Endpoints

### A. Fetch Chat List
Retrieve all active conversations for the current user.
- **URL**: `GET /chat/`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "chats": [
        {
          "_id": "65f...",
          "participants": [{ "_id": "...", "name": "...", "profile": "..." }],
          "lastMessage": { "text": "Hello!", "createdAt": "..." },
          "unreadCount": 2
        }
      ],
      "totalUnreadChats": 1
    }
  }
  ```

### B. Create/Access Chat
Before sending a message, you need a `chatId`. Use this endpoint to get an existing chat or create a new one with a user.
- **URL**: `POST /chat/:receiverId`
- **Response**: Returns the Chat object containing `_id`.

### C. Fetch Messages
Load message history for a specific chat.
- **URL**: `GET /message/:chatId`
- **Notes**: Sorting is `-createdAt` (newest first).

### D. Send Message
Send a new message. Supports text and images.
- **URL**: `POST /message/`
- **Body (Multipart/Form-Data)**:
  - `chatId`: String
  - `receiver`: String (ID of the other participant)
  - `text`: String (optional)
  - `image`: File (optional)

---

## 3. Socket.io Integration

### A. Connection
Connect to the socket server using the `socket_io_client` package.

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

IO.Socket socket = IO.io('YOUR_SERVER_URL', <String, dynamic>{
  'transports': ['websocket'],
  'autoConnect': false,
});

socket.connect();
```

### B. Real-time Events (Listening)

#### 1. Listen for New Messages in a Chat
When the user is inside a specific chat screen, listen for the `chatId` specific event.
- **Event Name**: `getMessage::<chatId>`
- **Example**: `socket.on('getMessage::65f...', (data) { ... });`

#### 2. Update Chat List
To refresh the list of conversations (e.g., when a new message arrives from anyone or a message is marked as seen).
- **Event Name**: `updateChatList::<currentUserId>`
- **Example**: `socket.on('updateChatList::74g...', (data) { ... });`

---

## 4. Implementation Workflow for Flutter

1.  **Initialization**: On app start/login, connect the Socket.
2.  **Dashboard**:
    - Call `GET /chat/` to load the list.
    - Listen to `updateChatList::<userId>` to trigger a re-fetch of the chat list.
3.  **Chat Screen**:
    - Call `GET /message/:chatId` to load history.
    - Listen to `getMessage::<chatId>`. When data arrives, append it to your local list.
    - To send: Call `POST /message/`. The backend will handle broadcasting the message via Socket to both parties.
4.  **Marking as Seen**:
    - The backend automatically marks messages as `seen` when you call `GET /message/:chatId`.
    - It then emits `updateChatList` to the sender so they can see the "seen" status update.

---

## 5. Data Models

### Message Object
```json
{
  "_id": "...",
  "chatId": "...",
  "sender": "...",
  "text": "Hello",
  "image": "url_to_image",
  "seen": false,
  "createdAt": "..."
}
```

### Chat Object
```json
{
  "_id": "...",
  "participants": [...],
  "unreadCount": 0,
  "lastMessage": { ... }
}
```
