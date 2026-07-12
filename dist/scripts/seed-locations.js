"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = __importDefault(require("../config"));
const user_model_1 = require("../app/modules/user/user.model");
const colors_1 = __importDefault(require("colors"));
const countries = ['Germany', 'France', 'United Kingdom', 'Spain', 'Italy'];
const cities = {
    Germany: ['Berlin', 'Munich', 'Hamburg'],
    France: ['Paris', 'Lyon', 'Marseille'],
    'United Kingdom': ['London', 'Manchester', 'Birmingham'],
    Spain: ['Madrid', 'Barcelona', 'Valencia'],
    Italy: ['Rome', 'Milan', 'Naples'],
};
const seedLocations = async () => {
    try {
        console.log(colors_1.default.yellow('⏳ Connecting to database...'));
        await mongoose_1.default.connect(config_1.default.database_url);
        console.log(colors_1.default.green('🚀 Database connected successfully'));
        const users = await user_model_1.User.find({});
        console.log(colors_1.default.blue(`Found ${users.length} users in database.`));
        let updatedCount = 0;
        for (const user of users) {
            if (!user.address || !user.address.country || !user.address.city) {
                const randomCountry = countries[Math.floor(Math.random() * countries.length)];
                const countryCities = cities[randomCountry];
                const randomCity = countryCities[Math.floor(Math.random() * countryCities.length)];
                await user_model_1.User.findByIdAndUpdate(user._id, {
                    $set: {
                        'address.country': randomCountry,
                        'address.city': randomCity,
                        'address.presentAddress': `${randomCity}, ${randomCountry}`,
                        'address.permanentAddress': `${randomCity}, ${randomCountry}`,
                    },
                });
                updatedCount++;
            }
        }
        console.log(colors_1.default.green(`✅ Successfully updated ${updatedCount} users with locations.`));
        process.exit(0);
    }
    catch (error) {
        console.error(colors_1.default.red('❌ Error seeding locations:'), error);
        process.exit(1);
    }
};
seedLocations();
