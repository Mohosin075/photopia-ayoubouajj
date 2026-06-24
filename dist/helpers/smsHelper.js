"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSMSNotification = void 0;
const twilio_1 = __importDefault(require("twilio"));
const config_1 = __importDefault(require("../config"));
let client = null;
if (config_1.default.twilio.account_sid && config_1.default.twilio.auth_token) {
    try {
        client = (0, twilio_1.default)(config_1.default.twilio.account_sid, config_1.default.twilio.auth_token);
    }
    catch (error) {
        console.error('Failed to initialize Twilio client:', error);
    }
}
const sendSMSNotification = async (to, body) => {
    try {
        if (client && config_1.default.twilio.phone_number) {
            console.log(`📱 [Twilio] Dispatching real SMS to ${to}...`);
            const message = await client.messages.create({
                body,
                from: config_1.default.twilio.phone_number,
                to,
            });
            console.log(`📱 [Twilio] SMS successfully sent! SID: ${message.sid}`);
            return true;
        }
        else {
            console.log(`📱 [Twilio Simulation] SMS would be sent to ${to}: "${body}"`);
            return true;
        }
    }
    catch (error) {
        console.error(`❌ [Twilio] SMS delivery failed to ${to}:`, error.message);
        return false;
    }
};
exports.sendSMSNotification = sendSMSNotification;
