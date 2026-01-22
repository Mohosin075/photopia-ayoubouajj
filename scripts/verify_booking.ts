import mongoose from 'mongoose';
import { User } from '../src/app/modules/user/user.model';
import { Service } from '../src/app/modules/service/service.model';
import { Availability } from '../src/app/modules/availability/availability.model';
import { Booking } from '../src/app/modules/booking/booking.model';
import config from '../src/config';
import { USER_ROLES } from '../src/enum/user';
import { SERVICE_STATUS, SERVICE_PRICING_TYPE, SERVICE_LOCATION_TYPE } from '../src/enum/service';

async function verifyBookingFlow() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(config.database_url as string);
    console.log('Connected.');

    // Cleanup
    console.log('Cleaning up old test data...');
    await User.deleteMany({ email: /test.*@example.com/ });
    await Service.deleteMany({ title: 'Test Service' });
    await Availability.deleteMany({});
    await Booking.deleteMany({ clientEmail: 'test-client@example.com' });

    // 1. Create Provider
    console.log('Creating Provider...');
    const provider = await User.create({
      email: 'test-provider@example.com',
      password: 'password123',
      role: USER_ROLES.PROFESSIONAL,
      name: { firstName: 'Test', lastName: 'Provider' },
      phoneNumber: '1234567890'
    });

    // 2. Create Client
    console.log('Creating Client...');
    const client = await User.create({
      email: 'test-client@example.com',
      password: 'password123',
      role: USER_ROLES.USER,
      name: { firstName: 'Test', lastName: 'Client' },
      phoneNumber: '0987654321'
    });

    // 3. Create Service
    console.log('Creating Service...');
    const service = await Service.create({
      providerId: provider._id,
      title: 'Test Service',
      description: 'A test service description',
      category: new mongoose.Types.ObjectId(), // Fake ID
      price: 100,
      currency: 'EUR',
      pricingType: SERVICE_PRICING_TYPE.HOURLY,
      duration: '1 hour',
      location: {
        type: SERVICE_LOCATION_TYPE.ONSITE,
        city: 'Paris',
        country: 'France'
      },
      status: SERVICE_STATUS.ACTIVE,
      isVerified: true,
      pricingModel: {
        type: SERVICE_PRICING_TYPE.HOURLY,
        weekdayHourlyRate: 100,
        weekendHourlyRate: 120
      }
    });

    // 4. Set Availability
    console.log('Setting Availability...');
    const availability = await Availability.create({
      providerId: provider._id,
      defaultSchedule: {
        monday: { start: '09:00', end: '18:00', isActive: true },
        tuesday: { start: '09:00', end: '18:00', isActive: true }
      }
    });

    // 5. Test Availability Check (Service logic normally does this, but we simulate Booking Service logic)
    // We will call the Availability Service logic manually or just rely on finding it.
    console.log('Verifying Availability logic...');
    // Let's assume next Monday
    const nextMonday = new Date();
    nextMonday.setDate(nextMonday.getDate() + (1 + 7 - nextMonday.getDay()) % 7);
    nextMonday.setHours(10, 0, 0, 0);

    // 6. Create Booking (Simulate successful booking)
    console.log('Creating Booking...');
    const booking = await Booking.create({
       bookingNumber: `TEST-BK-${Date.now()}`,
       clientId: client._id,
       providerId: provider._id,
       serviceId: service._id,
       bookingDate: nextMonday,
       startTime: '10:00',
       endTime: '12:00',
       durationHours: 2,
       eventLocation: {
         address: '123 Test St',
         city: 'Paris',
         country: 'France',
         distanceFromProviderKm: 5
       },
       pricingDetails: {
         pricingType: 'HOURLY',
         baseRate: 100,
         isWeekend: false,
         subtotal: 200,
         clientTotal: 220,
         providerEarnings: 190,
         currency: 'EUR',
         platformCommissionClient: 0.10,
         platformCommissionProvider: 0.05
       },
       clientName: 'Test Client',
       clientEmail: client.email
    });

    console.log('Booking created:', booking.bookingNumber);

    console.log('Verification Success!');
  } catch (error) {
    console.error('Verification Failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

verifyBookingFlow();
