"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_route_1 = require("../app/modules/user/user.route");
const auth_route_1 = require("../app/modules/auth/auth.route");
const express_1 = __importDefault(require("express"));
const public_route_1 = require("../app/modules/public/public.route");
const support_route_1 = require("../app/modules/support/support.route");
const upload_route_1 = require("../app/modules/upload/upload.route");
const promotion_route_1 = require("../app/modules/promotion/promotion.route");
const payment_route_1 = require("../app/modules/payment/payment.route");
const notification_routes_1 = require("../app/modules/notification/notification.routes");
const message_routes_1 = require("../app/modules/message/message.routes");
const chat_routes_1 = require("../app/modules/chat/chat.routes");
const review_route_1 = require("../app/modules/review/review.route");
const follow_route_1 = require("../app/modules/follow/follow.route");
const router = express_1.default.Router();
const apiRoutes = [
    { path: '/user', route: user_route_1.UserRoutes },
    { path: '/auth', route: auth_route_1.AuthRoutes },
    { path: '/notifications', route: notification_routes_1.NotificationRoutes },
    { path: '/public', route: public_route_1.PublicRoutes },
    { path: '/support', route: support_route_1.SupportRoutes },
    { path: '/upload', route: upload_route_1.UploadRoutes },
    { path: '/promotion', route: promotion_route_1.PromotionRoutes },
    { path: '/payment', route: payment_route_1.PaymentRoutes },
    { path: '/message', route: message_routes_1.MessageRoutes },
    { path: '/chat', route: chat_routes_1.ChatRoutes },
    { path: '/review', route: review_route_1.ReviewRoutes },
    { path: '/follow', route: follow_route_1.FollowRoutes },
];
apiRoutes.forEach(route => {
    router.use(route.path, route.route);
});
exports.default = router;
