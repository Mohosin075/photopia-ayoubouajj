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
const payment_route_1 = require("../app/modules/payment/payment.route");
const notification_routes_1 = require("../app/modules/notification/notification.routes");
const message_routes_1 = require("../app/modules/message/message.routes");
const chat_routes_1 = require("../app/modules/chat/chat.routes");
const review_route_1 = require("../app/modules/review/review.route");
const professionalProfile_route_1 = require("../app/modules/professionalProfile/professionalProfile.route");
const category_route_1 = require("../app/modules/category/category.route");
const service_route_1 = require("../app/modules/service/service.route");
const favourite_route_1 = require("../app/modules/favourite/favourite.route");
const availability_route_1 = require("../app/modules/availability/availability.route");
const booking_route_1 = require("../app/modules/booking/booking.route");
const subscription_route_1 = require("../app/modules/subscription/subscription.route");
const wallet_route_1 = require("../app/modules/wallet/wallet.route");
const withdrawal_route_1 = require("../app/modules/withdrawal/withdrawal.route");
const analytics_route_1 = require("../app/modules/analytics/analytics.route");
const dashboard_route_1 = require("../app/modules/dashboard/dashboard.route");
const recentlyViewed_route_1 = require("../app/modules/recentlyViewed/recentlyViewed.route");
const home_route_1 = require("../app/modules/home/home.route");
const inspiration_route_1 = require("../app/modules/inspiration/inspiration.route");
const location_route_1 = require("../app/modules/location/location.route");
const router = express_1.default.Router();
const apiRoutes = [
    {
        path: '/dashboard',
        route: dashboard_route_1.DashboardRoutes,
    },
    {
        path: '/auth',
        route: auth_route_1.AuthRoutes,
    },
    {
        path: '/users',
        route: user_route_1.UserRoutes,
    },
    {
        path: '/subscription',
        route: subscription_route_1.SubscriptionRoutes,
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
    { path: '/notifications', route: notification_routes_1.NotificationRoutes },
    { path: '/upload', route: upload_route_1.UploadRoutes },
    { path: '/payment', route: payment_route_1.PaymentRoutes },
    { path: '/message', route: message_routes_1.MessageRoutes },
    { path: '/chat', route: chat_routes_1.ChatRoutes },
    { path: '/review', route: review_route_1.ReviewRoutes },
    { path: '/category', route: category_route_1.CategoryRoutes },
    { path: '/favourite', route: favourite_route_1.FavouriteRoutes },
    { path: '/wallet', route: wallet_route_1.WalletRoutes },
    { path: '/withdrawal', route: withdrawal_route_1.WithdrawalRoutes },
    { path: '/analytics', route: analytics_route_1.AnalyticsRoutes },
    { path: '/recently-viewed', route: recentlyViewed_route_1.RecentlyViewedRoutes },
    { path: '/public', route: public_route_1.PublicRoutes },
    { path: '/home', route: home_route_1.HomeRoutes },
    { path: '/inspiration', route: inspiration_route_1.InspirationRoutes },
    { path: '/locations', route: location_route_1.LocationRoutes }
];
apiRoutes.forEach(route => {
    router.use(route.path, route.route);
});
exports.default = router;
