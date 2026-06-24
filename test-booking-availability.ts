import mongoose from 'mongoose'
import { AvailabilityService } from './src/app/modules/availability/availability.service'
import { BookingService } from './src/app/modules/booking/booking.service'
import { Service } from './src/app/modules/service/service.model'
import { Availability } from './src/app/modules/availability/availability.model'
import { Booking } from './src/app/modules/booking/booking.model'
import config from './src/config/index'

// Mock DB connection
const connectDB = async () => {
  try {
    await mongoose.connect(config.database_url as string)
    console.log('DB Connected')
  } catch (err) {
    console.error('DB Connection Error', err)
    process.exit(1)
  }
}

const runTest = async () => {
  await connectDB()

  try {
    console.log('--- TEST START ---')

    // 1. Setup Data
    const providerId = new mongoose.Types.ObjectId()
    const clientId = new mongoose.Types.ObjectId()
    const serviceId = new mongoose.Types.ObjectId()

    console.log('Using IDs:', { providerId, clientId, serviceId })

    // Mock User for context
    const mockUser = {
      userId: clientId,
      email: 'test@example.com',
      role: 'USER',
    }

    // Create Service
    const service = await Service.create({
      _id: serviceId,
      providerId: providerId,
      title: 'Test Service',
      description: 'Test Description',
      category: new mongoose.Types.ObjectId(),
      basePrice: 100,
      price: 100,
      currency: 'EUR',
      pricingType: 'HOURLY',
      duration: { value: 60, unit: 'minute' },
      location: {
        type: 'ONSITE',
        city: 'Paris',
        country: 'France',
        serviceRadiusKm: 20,
      },
      status: 'ACTIVE',
    })
    console.log('Service created')

    // Create Availability
    // Working hours: Mon-Fri 09:00 - 17:00
    // Custom date: Tomorrow (Blocked)
    // Custom date: Day After Tomorrow (Special Price 200)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const dayAfter = new Date()
    dayAfter.setDate(dayAfter.getDate() + 2)

    await Availability.create({
      providerId: providerId,
      defaultSchedule: {
        monday: { start: '09:00', end: '17:00', isActive: true },
        tuesday: { start: '09:00', end: '17:00', isActive: true },
        wednesday: { start: '09:00', end: '17:00', isActive: true },
        thursday: { start: '09:00', end: '17:00', isActive: true },
        friday: { start: '09:00', end: '17:00', isActive: true },
        saturday: { start: '10:00', end: '14:00', isActive: false },
        sunday: { start: '10:00', end: '14:00', isActive: false },
      },
      customDates: [
        {
          date: tomorrow,
          type: 'blocked',
        },
        {
          date: dayAfter,
          type: 'special_hours',
          start: '09:00',
          end: '18:00',
          priceOverride: 200, // Override price to 200 (Base was 100)
        },
      ],
    })
    console.log('Availability created')

    // 2. Test Availability Check

    // Check Monday
    const d = new Date()
    d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7))
    if (d.toDateString() === new Date().toDateString())
      d.setDate(d.getDate() + 7)

    const check1 = await AvailabilityService.checkAvailabilityForDate(
      providerId.toString(),
      d,
    )
    console.log('Check Monday:', check1.isAvailable === true ? 'PASS' : 'FAIL')

    // Check Blocked Date (Tomorrow)
    const check2 = await AvailabilityService.checkAvailabilityForDate(
      providerId.toString(),
      tomorrow,
    )
    console.log(
      'Check Blocked Date:',
      check2.isAvailable === false ? 'PASS' : 'FAIL',
    )

    // Check Price Override Date
    const check3 = await AvailabilityService.checkAvailabilityForDate(
      providerId.toString(),
      dayAfter,
    )
    console.log(
      'Check Override Date:',
      check3.isAvailable === true ? 'PASS' : 'FAIL',
    )
    console.log(
      'Check Override Price in Availability:',
      check3.pricing?.priceOverride === 200 ? 'PASS' : 'FAIL',
      check3.pricing,
    )

    // 3. Test Booking Creation

    // Booking on Price Override Date (Day After Tomorrow)
    try {
      const { booking, paymentSession } = await BookingService.createBooking(
        {
          providerId: providerId,
          serviceId: serviceId,
          clientId: clientId,
          bookingDate: dayAfter,
          startTime: '10:00',
          endTime: '12:00', // 2 Hours
          eventLocation: {
            address: '123 Test St',
            city: 'Paris',
            country: 'France',
            distanceFromProviderKm: 10,
          },
          clientName: 'Test Client',
          clientEmail: 'test@example.com',
        } as any,
        mockUser,
      )

      // Expected Logic:
      // 2 hours * 200 (Override) = 400 Subtotal
      // Client Total: 400 * (1 + 0.10) = 440
      // Deposit: 440 * 0.5 = 220
      // Provider Earnings: 400 * (1 - 0.05) = 380

      console.log('Booking Price Check:')
      console.log(
        ' - Subtotal (400):',
        booking.pricingDetails.subtotal === 400 ? 'PASS' : 'FAIL',
        booking.pricingDetails.subtotal,
      )
      console.log(
        ' - Client Total (440):',
        booking.pricingDetails.clientTotal === 440 ? 'PASS' : 'FAIL',
        booking.pricingDetails.clientTotal,
      )
      console.log(
        ' - Provider Earnings (380):',
        booking.pricingDetails.providerEarnings === 380 ? 'PASS' : 'FAIL',
        booking.pricingDetails.providerEarnings,
      )
      console.log(
        ' - Deposit (220):',
        booking.depositAmount === 220 ? 'PASS' : 'FAIL',
        booking.depositAmount,
      )
      console.log(
        ' - Balance (220):',
        booking.balanceAmount === 220 ? 'PASS' : 'FAIL',
        booking.balanceAmount,
      )
    } catch (e: any) {
      console.log('Booking Price Override Error:', e.message, e.stack)
    }

    console.log('--- TEST END ---')
  } catch (error) {
    console.error('Test script error:', error)
  } finally {
    // await Service.deleteMany({ title: 'Test Service' });
    // await Availability.deleteMany({ providerId: ... });
    // await Booking.deleteMany({ ... });
    await mongoose.disconnect()
  }
}

runTest()
