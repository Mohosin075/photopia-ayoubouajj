"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const config_1 = __importDefault(require("./config"));
const stripe_1 = __importDefault(require("./config/stripe"));
const webhook_service_1 = require("./app/modules/payment/webhook.service");
const webhookApp = (0, express_1.default)();
webhookApp.post('/webhook', express_1.default.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const sig = req.headers['stripe-signature'];
        if (!sig) {
            res.status(400).json({ error: 'No Stripe signature' });
            return;
        }
        if (!config_1.default.stripe.webhookSecret) {
            res.status(500).json({ error: 'Webhook secret not configured' });
            return;
        }
        const rawBody = Buffer.isBuffer(req.body)
            ? req.body
            : Buffer.from(req.body, 'utf8');
        const cleanSecret = config_1.default.stripe.webhookSecret.trim();
        let event;
        try {
            event = stripe_1.default.webhooks.constructEvent(rawBody, sig, cleanSecret);
        }
        catch (err) {
            res.status(400).json({ error: `Webhook Error: ${err.message}` });
            return;
        }
        await webhook_service_1.WebhookService.handleWebhook({
            body: rawBody,
            headers: {
                'stripe-signature': sig,
            },
        });
        res.status(200).json({
            received: true,
            event: event.type,
            message: 'Webhook processed successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            error: error.message,
            event: 'unknown',
        });
    }
});
exports.default = webhookApp;
