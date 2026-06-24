import mongoose from 'mongoose'
import { AvailabilityService } from '../src/app/modules/availability/availability.service'
import { Availability } from '../src/app/modules/availability/availability.model'
import config from '../src/config/index'

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
    console.log('--- DATE RANGE TEST START ---')

    const providerId = new mongoose.Types.ObjectId()
    const serviceId = new mongoose.Types.ObjectId()

    console.log('Testing with Provider ID:', providerId)

    // 1. Create a special Availability configuration with:
    // - Availability Period: Jan 15-20, 2025 (from 09:00 to 18:00)
    // - Blocked Date Range: Jan 17-18, 2025 (e.g. weekend/holiday in the middle)
    // - Default Schedule: Monday isActive: true, but since availabilityPeriod is defined, other days shouldn't fallback unless we are outside all periods (in our rules, if periods exist, they act as the exclusive manual days)

    await Availability.create({
      providerId: providerId,
      serviceId: serviceId,
      defaultSchedule: {
        monday: { start: '09:00', end: '17:00', isActive: true },
      },
      availabilityPeriods: [
        {
          startDate: new Date('2025-01-15T00:00:00.000Z'),
          endDate: new Date('2025-01-20T00:00:00.000Z'),
          startTime: '09:00',
          endTime: '18:00',
          priceOverride: 150,
        },
      ],
      blockedDateRanges: [
        {
          startDate: new Date('2025-01-17T00:00:00.000Z'),
          endDate: new Date('2025-01-18T00:00:00.000Z'),
          note: 'Mid-week Break',
        },
      ],
    })
    console.log('Availability model created')

    // TEST 1: Date within Blocked Date Range (e.g. Jan 17, 2025)
    // Expected: isAvailable = false (blocked)
    const checkBlocked = await AvailabilityService.checkAvailabilityForDate(
      providerId.toString(),
      new Date('2025-01-17T12:00:00.000Z'),
      serviceId.toString(),
    )
    console.log(
      'Test 1 (Jan 17 - Blocked Range):',
      checkBlocked.isAvailable === false ? 'PASS' : 'FAIL',
      checkBlocked.reason,
    )

    // TEST 2: Date within Availability Period and NOT blocked (e.g. Jan 16, 2025)
    // Expected: isAvailable = true, hours: 09:00 - 18:00, pricing.priceOverride = 150
    const checkAvailable = await AvailabilityService.checkAvailabilityForDate(
      providerId.toString(),
      new Date('2025-01-16T12:00:00.000Z'),
      serviceId.toString(),
    )
    console.log(
      'Test 2 (Jan 16 - Available Period):',
      checkAvailable.isAvailable === true &&
        checkAvailable.workingHours?.start === '09:00' &&
        checkAvailable.workingHours?.end === '18:00' &&
        checkAvailable.pricing?.priceOverride === 150
        ? 'PASS'
        : 'FAIL',
      checkAvailable,
    )

    // TEST 3: Date outside Availability Period (e.g. Jan 22, 2025)
    // Expected: isAvailable = false (outside configured manual periods)
    const checkOutside = await AvailabilityService.checkAvailabilityForDate(
      providerId.toString(),
      new Date('2025-01-22T12:00:00.000Z'),
      serviceId.toString(),
    )
    console.log(
      'Test 3 (Jan 22 - Outside Periods):',
      checkOutside.isAvailable === false ? 'PASS' : 'FAIL',
      checkOutside.reason,
    )

    // TEST 4: Fallback behavior when no periods exist (Testing another provider)
    const providerId2 = new mongoose.Types.ObjectId()
    await Availability.create({
      providerId: providerId2,
      defaultSchedule: {
        monday: { start: '09:00', end: '17:00', isActive: true },
        tuesday: { start: '09:00', end: '17:00', isActive: false },
      },
    })

    // Monday (Jan 13, 2025) should be available
    const checkMonday = await AvailabilityService.checkAvailabilityForDate(
      providerId2.toString(),
      new Date('2025-01-13T12:00:00.000Z'), // Jan 13 is Monday
    )
    console.log(
      'Test 4.1 (Monday Fallback):',
      checkMonday.isAvailable === true ? 'PASS' : 'FAIL',
      checkMonday.workingHours,
    )

    // Tuesday (Jan 14, 2025) should be inactive
    const checkTuesday = await AvailabilityService.checkAvailabilityForDate(
      providerId2.toString(),
      new Date('2025-01-14T12:00:00.000Z'), // Jan 14 is Tuesday
    )
    console.log(
      'Test 4.2 (Tuesday Inactive):',
      checkTuesday.isAvailable === false ? 'PASS' : 'FAIL',
      checkTuesday.reason,
    )

    // Clean up
    await Availability.deleteMany({
      providerId: { $in: [providerId, providerId2] },
    })
    console.log('Cleaned up test data')

    console.log('--- DATE RANGE TEST END ---')
  } catch (error) {
    console.error('Test execution error:', error)
  } finally {
    await mongoose.disconnect()
  }
}

runTest()
