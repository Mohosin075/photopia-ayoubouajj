"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = exports.confirmBookingAfterSuccessfulDeposit = void 0;
const http_status_codes_1 = require("http-status-codes");
const stripe_1 = __importDefault(require("../../../config/stripe"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const payment_model_1 = require("./payment.model");
const emailHelper_1 = require("../../../helpers/emailHelper");
const booking_model_1 = require("../booking/booking.model");
const wallet_service_1 = require("../wallet/wallet.service");
/**
 * Confirms booking + credits provider pending wallet once, when deposit payment succeeds.
 * Uses a conditional update so duplicate webhooks / sync+webhook paths never double-count wallet.
 */
const confirmBookingAfterSuccessfulDeposit = async (bookingId, stripePaymentId, session) => {
    if (!bookingId)
        return;
    const updatedBooking = await booking_model_1.Booking.findOneAndUpdate({
        _id: bookingId,
        status: 'pending',
        paymentStatus: 'pending',
    }, {
        $set: {
            status: 'confirmed',
            paymentStatus: 'deposit_paid',
            stripePaymentId,
            confirmedAt: new Date(),
        },
    }, { session, new: true });
    if (updatedBooking) {
        await wallet_service_1.WalletService.addPendingEarnings(updatedBooking.providerId, updatedBooking.pricingDetails.providerEarnings, session);
        console.log(`Booking confirmed after deposit: ${updatedBooking.bookingNumber} (stripe ref: ${stripePaymentId})`);
    }
};
exports.confirmBookingAfterSuccessfulDeposit = confirmBookingAfterSuccessfulDeposit;
const handleCheckoutSessionCompleted = async (sessionData) => {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        console.log('🔔 Processing Checkout Session Completed:', sessionData.id);
        const sessionWithDetails = await stripe_1.default.checkout.sessions.retrieve(sessionData.id, {
            expand: ['payment_intent', 'line_items'],
        });
        console.log('✅ Session Details Retrieved. Payment Intent:', sessionWithDetails.payment_intent);
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
            // Payment row may already be succeeded (e.g. race with client); still ensure booking is confirmed once.
            if (payment.status === 'succeeded') {
                const bookingIdEarly = ((_c = (_b = payment.bookingId) === null || _b === void 0 ? void 0 : _b.toString) === null || _c === void 0 ? void 0 : _c.call(_b)) ||
                    ((_d = sessionWithDetails.metadata) === null || _d === void 0 ? void 0 : _d.bookingId);
                await (0, exports.confirmBookingAfterSuccessfulDeposit)(bookingIdEarly, sessionWithDetails.id, mongoSession);
                await mongoSession.commitTransaction();
                return;
            }
            // Update payment
            payment.status = 'succeeded';
            payment.metadata = { ...payment.metadata, ...sessionWithDetails };
            await payment.save({ session: mongoSession });
            const bookingId = ((_f = (_e = payment.bookingId) === null || _e === void 0 ? void 0 : _e.toString) === null || _f === void 0 ? void 0 : _f.call(_e)) ||
                ((_g = sessionWithDetails.metadata) === null || _g === void 0 ? void 0 : _g.bookingId);
            console.log(`Webhook: Processing booking update for ID: ${bookingId}`);
            await (0, exports.confirmBookingAfterSuccessfulDeposit)(bookingId, sessionWithDetails.id, mongoSession);
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
    var _a, _b, _c, _d, _e, _f;
    const mongoSession = await payment_model_1.Payment.startSession();
    mongoSession.startTransaction();
    try {
        // STRICT LOOKUP: First try paymentIntentId
        let payment = await payment_model_1.Payment.findOne({
            paymentIntentId: paymentIntent.id,
        }).session(mongoSession);
        // FALLBACK LOOKUP: Use bookingId from metadata
        if (!payment) {
            const metadata = paymentIntent.metadata || {};
            const bookingId = metadata.bookingId;
            if (bookingId) {
                payment = await payment_model_1.Payment.findOne({
                    bookingId,
                    status: 'pending',
                })
                    .sort({ createdAt: -1 })
                    .session(mongoSession);
                if (payment) {
                    payment.paymentIntentId = paymentIntent.id;
                }
                else {
                    console.log(`⚠️ No record found for bookingId: ${bookingId} with status: pending`);
                }
            }
            else {
                console.log('❌ No bookingId found in metadata. Cannot perform fallback lookup.');
            }
        }
        if (!payment) {
            await mongoSession.commitTransaction();
            return;
        }
        // Payment doc may already be `succeeded` (saved card: API creates PI as succeeded before webhook).
        // Still run idempotent booking confirmation — the old early-return skipped booking entirely.
        if (payment.status === 'succeeded') {
            const bookingIdEarly = ((_b = (_a = payment.bookingId) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a)) || ((_c = paymentIntent.metadata) === null || _c === void 0 ? void 0 : _c.bookingId);
            await (0, exports.confirmBookingAfterSuccessfulDeposit)(bookingIdEarly, paymentIntent.id, mongoSession);
            await mongoSession.commitTransaction();
            console.log(`Successfully processed payment intent (already succeeded): ${paymentIntent.id}`);
            if (payment.userEmail) {
                await emailHelper_1.emailHelper.sendEmail({
                    to: payment.userEmail,
                    subject: 'Payment Successful',
                    html: `<p>Your payment was successful.</p>`,
                });
            }
            return;
        }
        // Update payment
        payment.status = 'succeeded';
        // Ensure we don't overwrite crucial metadata if it exists
        payment.metadata = { ...payment.metadata, ...paymentIntent };
        await payment.save({ session: mongoSession });
        const bookingId = ((_e = (_d = payment.bookingId) === null || _d === void 0 ? void 0 : _d.toString) === null || _e === void 0 ? void 0 : _e.call(_d)) || ((_f = paymentIntent.metadata) === null || _f === void 0 ? void 0 : _f.bookingId);
        await (0, exports.confirmBookingAfterSuccessfulDeposit)(bookingId, paymentIntent.id, mongoSession);
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
        let payment = await payment_model_1.Payment.findOne({
            paymentIntentId: paymentIntent.id,
        }).session(mongoSession);
        // Fallback for failure too
        if (!payment && paymentIntent.metadata && paymentIntent.metadata.bookingId) {
            payment = await payment_model_1.Payment.findOne({
                bookingId: paymentIntent.metadata.bookingId
            }).session(mongoSession);
        }
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
