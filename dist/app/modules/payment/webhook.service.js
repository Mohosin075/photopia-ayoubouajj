"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = void 0;
const http_status_codes_1 = require("http-status-codes");
const stripe_1 = __importDefault(require("../../../config/stripe"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const payment_model_1 = require("./payment.model");
const emailHelper_1 = require("../../../helpers/emailHelper");
const booking_model_1 = require("../booking/booking.model");
const handleCheckoutSessionCompleted = async (sessionData) => {
    var _a, _b;
    try {
        console.log('🔔 Processing Checkout Session Completed:', sessionData.id);
        const sessionWithDetails = await stripe_1.default.checkout.sessions.retrieve(sessionData.id, {
            expand: ['payment_intent', 'line_items'],
        });
        let lookupId;
        if (typeof sessionWithDetails.payment_intent === 'string') {
            lookupId = sessionWithDetails.payment_intent;
        }
        else if ((_a = sessionWithDetails.payment_intent) === null || _a === void 0 ? void 0 : _a.id) {
            lookupId = sessionWithDetails.payment_intent.id;
        }
        else {
            lookupId = sessionWithDetails.id;
        }
        const mongoSession = await payment_model_1.Payment.startSession();
        mongoSession.startTransaction();
        try {
            // Find and lock the payment document
            const payment = await payment_model_1.Payment.findOne({
                $or: [
                    { paymentIntentId: lookupId },
                    { 'metadata.checkoutSessionId': sessionWithDetails.id },
                ],
            }).session(mongoSession);
            if (!payment) {
                throw new Error(`Payment not found for session: ${sessionWithDetails.id}`);
            }
            // Check if already processed to avoid duplicates
            if (payment.status === 'succeeded') {
                await mongoSession.commitTransaction();
                return;
            }
            // Update payment
            payment.status = 'succeeded';
            payment.metadata = { ...payment.metadata, ...sessionWithDetails };
            await payment.save({ session: mongoSession });
            // Update Booking Status if bookingId exists in metadata or payment
            const bookingId = payment.bookingId || ((_b = sessionWithDetails.metadata) === null || _b === void 0 ? void 0 : _b.bookingId);
            console.log(`Webhook: Processing booking update for ID: ${bookingId}`);
            if (bookingId) {
                const updatedBooking = await booking_model_1.Booking.findByIdAndUpdate(bookingId, {
                    status: 'confirmed',
                    paymentStatus: 'deposit_paid',
                    stripePaymentId: sessionWithDetails.id
                }, { session: mongoSession, new: true });
                console.log(`Webhook: Booking status updated to confirmed for: ${updatedBooking === null || updatedBooking === void 0 ? void 0 : updatedBooking.bookingNumber}`);
            }
            await mongoSession.commitTransaction();
            console.log(`Successfully processed payment for session: ${sessionWithDetails.id}`);
            // Send email
            await emailHelper_1.emailHelper.sendEmail({
                to: payment.userEmail,
                subject: 'Payment Successful',
                html: `<p>Your payment was successful.</p>`
            });
        }
        catch (error) {
            await mongoSession.abortTransaction();
            throw error;
        }
        finally {
            mongoSession.endSession();
        }
    }
    catch (error) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Checkout processing failed: ${error.message}`);
    }
};
const handleCheckoutSessionExpired = async (session) => {
    const mongoSession = await payment_model_1.Payment.startSession();
    mongoSession.startTransaction();
    try {
        const payment = await payment_model_1.Payment.findOne({
            $or: [
                { paymentIntentId: session.id },
                { 'metadata.checkoutSessionId': session.id },
            ],
        }).session(mongoSession);
        if (payment) {
            payment.status = 'failed';
            payment.metadata = { ...payment.metadata, ...session, expired: true };
            await payment.save({ session: mongoSession });
        }
        await mongoSession.commitTransaction();
    }
    catch (error) {
        await mongoSession.abortTransaction();
        throw error;
    }
    finally {
        mongoSession.endSession();
    }
};
const handlePaymentSuccess = async (paymentIntent) => {
    const mongoSession = await payment_model_1.Payment.startSession();
    mongoSession.startTransaction();
    console.log(paymentIntent);
    try {
        // STRICT LOOKUP: First try paymentIntentId
        let payment = await payment_model_1.Payment.findOne({
            paymentIntentId: paymentIntent.id,
        }).session(mongoSession);
        // FALLBACK LOOKUP: If not found by ID (common if DB has SessionID stored instead of PI ID),
        // try to find by ticketId from metadata + status=pending.
        if (!payment && paymentIntent.metadata && paymentIntent.metadata.ticketId) {
            console.log(`Payment not found by ID ${paymentIntent.id}. Trying fallback lookup by ticketId: ${paymentIntent.metadata.ticketId}`);
            payment = await payment_model_1.Payment.findOne({
                ticketId: paymentIntent.metadata.ticketId,
                status: 'pending',
            }).session(mongoSession);
            // If we found it via fallback, update the paymentIntentId to the correct one immediately
            if (payment) {
                payment.paymentIntentId = paymentIntent.id;
            }
        }
        if (!payment) {
            // If payment not found by ID, it might be that the checkout session creation
            // hasn't synced yet, OR this event is irrelevant because we primarily rely on
            // checkout.session.completed for initial fulfillment.
            // We will simply log and return.
            console.log(`Payment not found for intent: ${paymentIntent.id}. Skipping payment_intent.succeeded handler.`);
            await mongoSession.commitTransaction();
            return;
        }
        // Check if already processed
        if (payment.status === 'succeeded') {
            await mongoSession.commitTransaction();
            return;
        }
        // Update payment
        payment.status = 'succeeded';
        // Ensure we don't overwrite crucial metadata if it exists
        payment.metadata = { ...payment.metadata, ...paymentIntent };
        await payment.save({ session: mongoSession });
        // No more ticket/event/attendee updates needed here
        await mongoSession.commitTransaction();
        console.log(`Successfully processed payment intent: ${paymentIntent.id}`);
        // Send email
        if (payment.userEmail) {
            await emailHelper_1.emailHelper.sendEmail({
                to: payment.userEmail,
                subject: 'Payment Successful',
                html: `<p>Your payment was successful.</p>`
            });
        }
    }
    catch (error) {
        await mongoSession.abortTransaction();
        throw error;
    }
    finally {
        mongoSession.endSession();
    }
};
const handlePaymentFailure = async (paymentIntent) => {
    const mongoSession = await payment_model_1.Payment.startSession();
    mongoSession.startTransaction();
    try {
        const payment = await payment_model_1.Payment.findOne({
            paymentIntentId: paymentIntent.id,
        }).session(mongoSession);
        if (payment) {
            payment.status = 'failed';
            payment.metadata = { ...payment.metadata, ...paymentIntent };
            await payment.save({ session: mongoSession });
        }
        await mongoSession.commitTransaction();
    }
    catch (error) {
        await mongoSession.abortTransaction();
        throw error;
    }
    finally {
        mongoSession.endSession();
    }
};
exports.WebhookService = {
    handleWebhook: async (payload) => {
        try {
            const event = JSON.parse(payload.body.toString());
            console.log(`Processing webhook: ${event.type}`);
            switch (event.type) {
                case 'checkout.session.completed':
                    await handleCheckoutSessionCompleted(event.data.object);
                    break;
                case 'checkout.session.expired':
                    await handleCheckoutSessionExpired(event.data.object);
                    break;
                case 'payment_intent.succeeded':
                    await handlePaymentSuccess(event.data.object);
                    break;
                case 'payment_intent.payment_failed':
                    await handlePaymentFailure(event.data.object);
                    break;
                default:
                    console.log(`Unhandled event type: ${event.type}`);
            }
        }
        catch (error) {
            console.error('Webhook processing error:', error);
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Webhook processing failed: ${error.message}`);
        }
    },
};
