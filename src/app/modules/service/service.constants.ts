import {
  SERVICE_LOCATION_TYPE,
  SERVICE_PRICING_TYPE,
  SERVICE_STATUS,
  SERVICE_VISIBILITY_LEVEL,
} from '../../../enum/service'

export const SERVICE_CONSTANTS = {
  MESSAGES: {
    CREATED: 'Service created successfully',
    RETRIEVED: 'Service retrieved successfully',
    RETRIEVED_ALL: 'Services retrieved successfully',
    UPDATED: 'Service updated successfully',
    DELETED: 'Service deleted successfully',
    NOT_FOUND: 'Service not found',
    ALREADY_EXISTS: 'Service with this title already exists for this provider',
    CREATE_FAILED: 'Failed to create service',
    UPDATE_FAILED: 'Failed to update service',
    DELETE_FAILED: 'Failed to delete service',
    UNAUTHORIZED: 'You are not authorized to perform this action',
    PROVIDER_REQUIRED: 'Only service providers can create services',
  },
  STATUS: SERVICE_STATUS,
  PRICING_TYPE: SERVICE_PRICING_TYPE,
  VISIBILITY_LEVEL: SERVICE_VISIBILITY_LEVEL,
  LOCATION_TYPE: SERVICE_LOCATION_TYPE,
  VALIDATION: {
    TITLE_MIN_LENGTH: 3,
    TITLE_MAX_LENGTH: 100,
    DESCRIPTION_MIN_LENGTH: 10,
    DESCRIPTION_MAX_LENGTH: 2000,
    PRICE_MIN: 0,
    PRICE_MAX: 999999,
    RATING_MIN: 0,
    RATING_MAX: 5,
    SERVICE_RADIUS_MIN: 0,
    SERVICE_RADIUS_MAX: 1000,
    DURATION_MIN: 0.5,
    DURATION_MAX: 24,
  },
  DEFAULT_VALUES: {
    RATING_AVERAGE: 0,
    RATING_COUNT: 0,
    TOTAL_BOOKINGS: 0,
    FAVORITES_COUNT: 0,
    VIEWS_COUNT: 0,
    IS_VERIFIED: false,
    IS_ACTIVE: true,
    SERVICE_RADIUS_KM: 50,
  },
  SEARCH_FIELDS: ['title', 'description', 'tags', 'equipment', 'subCategory'],
  FILTERABLE_FIELDS: [
    'searchTerm',
    'title',
    'category',
    'subCategory',
    'tags',
    'equipment',
    'pricingType',
    'minPrice',
    'maxPrice',
    'location.type',
    'location.country',
    'location.city',
    'visibilityLevel',
    'status',
    'isVerified',
    'providerId',
    'ratingAverage',
    'serviceType',
    'isActive'
  ],
  SORTABLE_FIELDS: ['createdAt', 'updatedAt', 'price', 'ratingAverage', 'totalBookings', 'viewsCount'],
  PAGINATION: {
    DEFAULT_LIMIT: 10,
    DEFAULT_PAGE: 1,
    MAX_LIMIT: 100,
  },
} as const

// List view projection for performance
export const SERVICE_LIST_PROJECTION = 'title category subCategory price currency coverMedia ratingAverage ratingCount totalBookings location status isActive serviceType providerId'

// Service filterable fields for query filtering
export const serviceFilterableFields = [...SERVICE_CONSTANTS.FILTERABLE_FIELDS]

// Service searchable fields
export const serviceSearchableFields = [...SERVICE_CONSTANTS.SEARCH_FIELDS]