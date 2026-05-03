# Real-time Notification & Messaging Guide (Socket.io)

This document provides instructions on how to integrate and use real-time features for Notifications and Messaging using Socket.io in the Photopya project.

## 1. Socket.io Configuration

- **Server-side Initialization**: Sockets are initialized in `src/server.ts` and managed via `src/helpers/socketHelper.ts`.
- **Global Access**: The `io` instance is available globally via `global.io`.

## 2. Notification Real-time Integration

### Server-side Implementation
Notifications are sent automatically when a new notification is created in `src/app/modules/notification/notification.service.ts`.

- **Event Name**: `notification`
- **Room**: User's ID (`userId`)
- **Payload Structure**:
  ```json
  {
    "type": "NEW_NOTIFICATION",
    "data": {
      "_id": "notification_id",
      "userId": "user_id",
      "title": "Notification Title",
      "content": "Notification content...",
      "type": "PAYMENT_SUCCESS",
      "status": "UNREAD",
      ...
    }
  }
  ```

### Client-side Implementation
1. **Connect to Socket**:
   ```javascript
   const socket = io('YOUR_SERVER_URL');
   ```
2. **Join Notification Room**:
   You MUST join the notification room using your User ID to receive private notifications.
   ```javascript
   socket.emit('join-notification', userId);
   ```
3. **Listen for Notifications**:
   ```javascript
   socket.on('notification', (payload) => {
     if (payload.type === 'NEW_NOTIFICATION') {
       console.log('New notification received:', payload.data);
       // Update UI or show toast
     }
   });
   ```

---

## 3. Messaging (Chat) Real-time Integration

Messaging uses dynamic event names based on Chat IDs and User IDs to ensure efficient updates.

### A. Sending/Receiving Messages
When a message is sent via `src/app/modules/message/message.service.ts`, it emits to a specific chat room.

- **Event Name**: `getMessage::${chatId}`
- **Payload**: The newly created Message object.

**Client-side Usage**:
```javascript
// Listen for new messages in a specific chat
socket.on(`getMessage::${chatId}`, (newMessage) => {
  console.log('New message in chat:', newMessage);
  // Append to message list
});
```

### B. Updating Chat List
To keep the conversation list updated (last message, unread count, etc.), the server triggers an update event.

- **Event Name**: `updateChatList::${userId}`
- **Trigger**: Sent to both sender and receiver when a new message is created. Also sent to the sender when their message is marked as "seen".

**Client-side Usage**:
```javascript
// Listen for chat list updates
socket.on(`updateChatList::${userId}`, () => {
  console.log('Chat list needs refreshing');
  // Re-fetch chat list API
});
```

## 4. Summary of Events

| Feature | Event Name | Direction | Description |
| :--- | :--- | :--- | :--- |
| **General** | `join-notification` | Client -> Server | Join a private room using `userId` |
| **Notification** | `notification` | Server -> Client | Receives new in-app notification |
| **Chat** | `getMessage::${chatId}` | Server -> Client | Receives a new message for a specific chat |
| **Chat** | `updateChatList::${userId}` | Server -> Client | Notifies user to refresh their conversation list |

## 5. Connection Details
- **Ping Timeout**: 60,000ms
- **CORS**: Enabled for all origins (`*`)
- **Default Port**: Same as the API server port.
