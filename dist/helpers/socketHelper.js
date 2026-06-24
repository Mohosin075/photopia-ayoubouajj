"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketHelper = void 0;
const colors_1 = __importDefault(require("colors"));
const user_model_1 = require("../app/modules/user/user.model");
const socket = (io) => {
    io.on('connection', socket => {
        console.log(colors_1.default.blue('A user connected'), socket.id);
        // Join notification room (user specific)
        socket.on('join-notification', async (userId) => {
            if (userId) {
                socket.join(userId);
                console.log(colors_1.default.green(`User ${socket.id} joined notification room:${userId}`));
                // Update user status to online
                await user_model_1.User.findByIdAndUpdate(userId, {
                    isOnline: true,
                    lastActive: new Date(),
                });
                socket.userId = userId;
            }
        });
        //disconnect
        socket.on('disconnect', async () => {
            console.log(colors_1.default.red('A user disconnect'), socket.id);
            const userId = socket.userId;
            if (userId) {
                await user_model_1.User.findByIdAndUpdate(userId, {
                    isOnline: false,
                    lastActive: new Date(),
                });
            }
        });
        // Join stream room
        socket.on('join-stream', (streamId) => {
            if (streamId) {
                socket.join(`stream:${streamId}`);
                console.log(colors_1.default.green(`User ${socket.id} joined stream:${streamId}`));
            }
        });
        // Leave stream room
        socket.on('leave-stream', (streamId) => {
            if (streamId) {
                socket.leave(`stream:${streamId}`);
                console.log(colors_1.default.yellow(`User ${socket.id} left stream:${streamId}`));
            }
        });
    });
};
exports.socketHelper = { socket };
