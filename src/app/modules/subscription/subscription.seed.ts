import { SubscriptionPlan } from './subscription-plan.model'
import { stripeService } from './stripe.service'

// Default subscription plans for Photopia
const defaultPlans = [
  // Professional Plans
  {
    name: 'Professional Starter',
    description: 'Perfect for individual photographers starting their journey',
    price: 19.99,
    currency: 'usd',
    interval: 'month' as const,
    intervalCount: 1,
    trialPeriodDays: 10,
    features: [
      'Basic profile creation',
      'Portfolio with up to 20 images',
      'Basic booking management',
      'Community access',
      'Email support',
    ],
    maxTeamMembers: 1,
    maxServices: 3,
    userTypes: ['professional'],
    priority: 1,
  },
  {
    name: 'Professional Pro',
    description: 'Advanced features for established professionals',
    price: 39.99,
    currency: 'usd',
    interval: 'month' as const,
    intervalCount: 1,
    trialPeriodDays: 10,
    features: [
      'Everything in Starter',
      'Unlimited portfolio images',
      'Advanced booking & calendar sync',
      'Custom branding',
      'Priority search placement',
      'Standard analytics',
      'Priority support',
    ],
    maxTeamMembers: 3,
    maxServices: 10,
    userTypes: ['professional'],
    priority: 2,
  },
  {
    name: 'Professional Enterprise',
    description: 'Full-featured solution for studios and agencies',
    price: 99.99,
    currency: 'usd',
    interval: 'month' as const,
    intervalCount: 1,
    trialPeriodDays: 10,
    features: [
      'Everything in Pro',
      'Manage multiple professionals/team',
      'Advanced analytics & reporting',
      'Direct API access',
      'Dedicated manager',
      'White-label options',
      '24/7 phone support',
    ],
    maxTeamMembers: 99,
    maxServices: 99,
    userTypes: ['professional'],
    priority: 3,
  },
]

export async function seedSubscriptionPlans(): Promise<void> {
  try {
    console.log('Starting subscription plans seeding...')

    // Check if plans already exist
    const existingPlansCount = await SubscriptionPlan.countDocuments()
    if (existingPlansCount > 0) {
      console.log(`${existingPlansCount} subscription plans already exist. Skipping seed.`)
      return
    }

    // Create plans in Stripe and database
    for (const planData of defaultPlans) {
      try {
        // Create Stripe product
        const stripeProduct = await stripeService.createProduct({
          name: planData.name,
          description: planData.description,
          metadata: {
            userTypes: planData.userTypes.join(','),
            maxTeamMembers: planData.maxTeamMembers.toString(),
            maxServices: planData.maxServices.toString(),
          },
        })

        // Create Stripe price
        const stripePrice = await stripeService.createPrice({
          productId: stripeProduct.id,
          unitAmount: Math.round(planData.price * 100), // Convert to cents
          currency: planData.currency,
          interval: planData.interval,
          intervalCount: planData.intervalCount,
          metadata: {
            planName: planData.name,
          },
        })

        // Create local plan
        const plan = new SubscriptionPlan({
          ...planData,
          stripeProductId: stripeProduct.id,
          stripePriceId: stripePrice.id,
          isActive: true,
        })

        await plan.save()
        console.log(`Created subscription plan: ${planData.name}`)
      } catch (error) {
        console.error(`Error creating plan ${planData.name}:`, error)
        // Continue with other plans even if one fails
      }
    }

    console.log('Subscription plans seeding completed successfully')
  } catch (error) {
    console.error('Error seeding subscription plans:', error)
    throw error
  }
}

// Function to update existing plans (for migrations)
export async function updateSubscriptionPlans(): Promise<void> {
  try {
    console.log('Updating subscription plans...')

    // Add any plan updates here
    // Example: Update features for existing plans
    
    console.log('Subscription plans update completed')
  } catch (error) {
    console.error('Error updating subscription plans:', error)
    throw error
  }
}

// Function to create a specific plan (for testing or manual creation)
export async function createSpecificPlan(planData: any): Promise<void> {
  try {
    // Create Stripe product
    const stripeProduct = await stripeService.createProduct({
      name: planData.name,
      description: planData.description,
      metadata: planData.metadata || {},
    })

    // Create Stripe price
    const stripePrice = await stripeService.createPrice({
      productId: stripeProduct.id,
      unitAmount: Math.round(planData.price * 100),
      currency: planData.currency,
      interval: planData.interval,
      intervalCount: planData.intervalCount || 1,
    })

    // Create local plan
    const plan = new SubscriptionPlan({
      ...planData,
      stripeProductId: stripeProduct.id,
      stripePriceId: stripePrice.id,
    })

    await plan.save()
    console.log(`Created specific plan: ${planData.name}`)
  } catch (error) {
    console.error(`Error creating specific plan:`, error)
    throw error
  }
}
