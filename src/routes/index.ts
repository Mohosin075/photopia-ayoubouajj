import { UserRoutes } from '../app/modules/user/user.route'
import { AuthRoutes } from '../app/modules/auth/auth.route'
import express, { Router } from 'express'
import { PublicRoutes } from '../app/modules/public/public.route'
import { SupportRoutes } from '../app/modules/support/support.route'
import { UploadRoutes } from '../app/modules/upload/upload.route'
import { PaymentRoutes } from '../app/modules/payment/payment.route'
import { NotificationRoutes } from '../app/modules/notification/notification.routes'
import { MessageRoutes } from '../app/modules/message/message.routes'
import { ChatRoutes } from '../app/modules/chat/chat.routes'
import { ReviewRoutes } from '../app/modules/review/review.route'
import { ProfessionalProfileRoutes } from '../app/modules/professionalProfile/professionalProfile.route'
import { CategoryRoutes } from '../app/modules/category/category.route'
import { ServiceRoutes } from '../app/modules/service/service.route'
import { FavouriteRoutes } from '../app/modules/favourite/favourite.route'
import { AvailabilityRoutes } from '../app/modules/availability/availability.route'
import { BookingRoutes } from '../app/modules/booking/booking.route'
import { SubscriptionRoutes } from '../app/modules/subscription/subscription.route'
import { WalletRoutes } from '../app/modules/wallet/wallet.route'
import { WithdrawalRoutes } from '../app/modules/withdrawal/withdrawal.route'
import { AnalyticsRoutes } from '../app/modules/analytics/analytics.route'
import { DashboardRoutes } from '../app/modules/dashboard/dashboard.route'
import { RecentlyViewedRoutes } from '../app/modules/recentlyViewed/recentlyViewed.route'
import { HomeRoutes } from '../app/modules/home/home.route'
import { InspirationRoutes } from '../app/modules/inspiration/inspiration.route'
import { LocationRoutes } from '../app/modules/location/location.route'

const router = express.Router()

const apiRoutes: { path: string; route: Router }[] = [
  {
    path: '/dashboard',
    route: DashboardRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/users',
    route: UserRoutes,
  },
  {
    path: '/subscription',
    route: SubscriptionRoutes,
  },
  {
    path: '/professional-profiles',
    route: ProfessionalProfileRoutes,
  },
  {
    path: '/services',
    route: ServiceRoutes,
  },
  {
    path: '/availability',
    route: AvailabilityRoutes,
  },
  {
    path: '/booking',
    route: BookingRoutes,
  },
  { path: '/support', route: SupportRoutes },
  { path: '/notifications', route: NotificationRoutes },
  { path: '/upload', route: UploadRoutes },
  { path: '/payment', route: PaymentRoutes },
  { path: '/message', route: MessageRoutes },
  { path: '/chat', route: ChatRoutes },
  { path: '/review', route: ReviewRoutes },
  { path: '/category', route: CategoryRoutes },
  { path: '/favourite', route: FavouriteRoutes },
  { path: '/wallet', route: WalletRoutes },
  { path: '/withdrawal', route: WithdrawalRoutes },
  { path: '/analytics', route: AnalyticsRoutes },
  { path: '/recently-viewed', route: RecentlyViewedRoutes },
  { path: '/public', route: PublicRoutes },
  { path: '/home', route: HomeRoutes },
  { path: '/inspiration', route: InspirationRoutes },
  { path: '/locations', route: LocationRoutes }
]

apiRoutes.forEach(route => {
  router.use(route.path, route.route)
})

export default router
