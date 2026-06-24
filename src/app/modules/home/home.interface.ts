import { ICategory } from '../category/category.interface'
import { IService } from '../service/service.interface'
import { IRecentlyViewed } from '../recentlyViewed/recentlyViewed.interface'
import { IProjectIdea } from '../projectIdea/projectIdea.interface'
import { IProfessionalProfile } from '../professionalProfile/professionalProfile.interface'

export interface IHomeData {
  recentlyViewed: IRecentlyViewed[]
  mainCategories: ICategory[]
  trendingThisWeek: ICategory[]
  availableNow: IProfessionalProfile[]
  availableNowCounts: {
    online: number
    quickResponse: number
    expressDelivery: number
    thisWeekend: number
    lastMinute: number
  }
  superPros: IProfessionalProfile[]
  creativeStyles: any[]
  nearYou: any[]
  originalProjects: IService[]
  ideas: IProjectIdea[]
}
