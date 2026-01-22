import { UserRoutes } from '../app/modules/user/user.route'
import { AuthRoutes } from '../app/modules/auth/auth.route'
import express, { Router } from 'express'
import { PublicRoutes } from '../app/modules/public/public.route'
import { SupportRoutes } from '../app/modules/support/support.route'
import { UploadRoutes } from '../app/modules/upload/upload.route'
import { PromotionRoutes } from '../app/modules/promotion/promotion.route'
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
import { BookingRoutes } from '../app/modules/booking/booking.route';

const router = express.Router()

const apiRoutes: { path: string; route: Router }[] = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/users',
    route: UserRoutes,
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
  { path: '/upload', route: UploadRoutes },
  { path: '/promotion', route: PromotionRoutes },
  { path: '/payment', route: PaymentRoutes },
  { path: '/message', route: MessageRoutes },
  { path: '/chat', route: ChatRoutes },
  { path: '/review', route: ReviewRoutes },
  { path: '/category', route: CategoryRoutes },
  { path: '/favourite', route: FavouriteRoutes }
]

apiRoutes.forEach(route => {
  router.use(route.path, route.route)
})

export default router
