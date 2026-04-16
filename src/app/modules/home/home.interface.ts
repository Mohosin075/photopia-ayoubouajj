import { ICategory } from '../category/category.interface'
import { IService } from '../service/service.interface'
import { IRecentlyViewed } from '../recentlyViewed/recentlyViewed.interface'
import { IInspiration } from '../inspiration/inspiration.interface'
import { IProfessionalProfile } from '../professionalProfile/professionalProfile.interface'

export interface IHomeData {
    recentlyViewed: IRecentlyViewed[]
    popularCategories: ICategory[]
    trendingSubcategories: ICategory[]
    availableNow: IService[]
    superPros: IProfessionalProfile[]
    styles: string[]
    popularLocations: any[]
    originalProjects: IService[]
    inspirations: IInspiration[]
}
