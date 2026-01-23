"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_route_1 = require("../app/modules/user/user.route");
const auth_route_1 = require("../app/modules/auth/auth.route");
const express_1 = __importDefault(require("express"));
const support_route_1 = require("../app/modules/support/support.route");
const upload_route_1 = require("../app/modules/upload/upload.route");
const promotion_route_1 = require("../app/modules/promotion/promotion.route");
const payment_route_1 = require("../app/modules/payment/payment.route");
const message_routes_1 = require("../app/modules/message/message.routes");
const chat_routes_1 = require("../app/modules/chat/chat.routes");
const review_route_1 = require("../app/modules/review/review.route");
const professionalProfile_route_1 = require("../app/modules/professionalProfile/professionalProfile.route");
const category_route_1 = require("../app/modules/category/category.route");
const service_route_1 = require("../app/modules/service/service.route");
const favourite_route_1 = require("../app/modules/favourite/favourite.route");
const availability_route_1 = require("../app/modules/availability/availability.route");
const booking_route_1 = require("../app/modules/booking/booking.route");
const router = express_1.default.Router();
const apiRoutes = [
    {
        path: '/auth',
        route: auth_route_1.AuthRoutes,
    },
    {
        path: '/users',
        route: user_route_1.UserRoutes,
    },
    {
        path: '/professional-profiles',
        route: professionalProfile_route_1.ProfessionalProfileRoutes,
    },
    {
        path: '/services',
        route: service_route_1.ServiceRoutes,
    },
    {
        path: '/availability',
        route: availability_route_1.AvailabilityRoutes,
    },
    {
        path: '/booking',
        route: booking_route_1.BookingRoutes,
    },
    { path: '/support', route: support_route_1.SupportRoutes },
    { path: '/upload', route: upload_route_1.UploadRoutes },
    { path: '/promotion', route: promotion_route_1.PromotionRoutes },
    { path: '/payment', route: payment_route_1.PaymentRoutes },
    { path: '/message', route: message_routes_1.MessageRoutes },
    { path: '/chat', route: chat_routes_1.ChatRoutes },
    { path: '/review', route: review_route_1.ReviewRoutes },
    { path: '/category', route: category_route_1.CategoryRoutes },
    { path: '/favourite', route: favourite_route_1.FavouriteRoutes }
];
apiRoutes.forEach(route => {
    router.use(route.path, route.route);
});
exports.default = router;
