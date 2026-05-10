"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv = __importStar(require("dotenv"));
const category_model_1 = require("../app/modules/category/category.model");
dotenv.config();
const MONGO_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/photopya';
const categoryData = [
    {
        theme: 'PHOTOGRAPHY',
        categories: [
            {
                name: 'Portrait & People',
                icon: '📸',
                isPopular: true,
                subcategories: [
                    'Studio portrait',
                    'Lifestyle / natural portrait',
                    'Portrait corporate / business',
                    'Artistic portrait',
                    'Passport photo & passport',
                    'Family portrait',
                    'Portrait of a couple',
                    'Newborn & maternity portrait'
                ]
            },
            {
                name: 'Events',
                icon: '🎓',
                isPopular: true,
                subcategories: [
                    'Wedding',
                    'Birthday & private party',
                    'Corporate events & seminars',
                    'Concert & show',
                    'Conference & Congress',
                    'Company evening',
                    'Graduation',
                    'Baptism & Communion'
                ]
            },
            {
                name: 'Fashion & Beauty',
                icon: '🎨',
                isPopular: true,
                subcategories: [
                    'Shooting mode (lookbook)',
                    'Fashion advertising',
                    'Beaut\u00e9 / Beauty',
                    'Haute couture',
                    'E-commerce catalog',
                    'Prop Shooting',
                    'Makeup & Hair',
                    'Fitness & sport'
                ]
            },
            {
                name: 'Real Estate & Architecture',
                icon: '🏠',
                isPopular: true,
                subcategories: [
                    'Interior architecture',
                    'Exterior architecture',
                    'Residential Real Estate',
                    'Commercial Real Estate',
                    'Drone / Aerial Real Estate',
                    '360\u00b0 virtual tour',
                    'Home staging',
                    'Plans & sections'
                ]
            },
            {
                name: 'Nature & Landscape',
                subcategories: [
                    'Landscape',
                    'Wildlife & Animals',
                    'Flora & botany',
                    'Mountain & wilderness',
                    'Sea & Ocean',
                    'Sunset & sky',
                    'Travel & Tourism',
                    'Astrophotography'
                ]
            },
            {
                name: 'Culinary & Gastronomy',
                icon: '🍔',
                isPopular: true,
                subcategories: [
                    'Food photography',
                    'Drinks & cocktails',
                    'Restaurant & menu',
                    'Pastry & dessert',
                    'Packshot food product',
                    'Cuisine lifestyle',
                    'Chef & Kitchen in Action',
                    'Table setting & d\u00e9coration'
                ]
            },
            {
                name: 'Product & Packshot',
                subcategories: [
                    'Packshot studio sur blanc',
                    'Creative Packshot',
                    'Product Close-up / Macro',
                    'Jewelry & Accessories',
                    'Cosmetics & Perfumes',
                    'Electronics & Tech',
                    'Fashion & textile product',
                    'Pack & packaging'
                ]
            },
            {
                name: 'Sport & Action',
                icon: '🏋️',
                isPopular: true,
                subcategories: [
                    'Individual sport',
                    'Team sport',
                    'Extreme sports',
                    'Fitness & musculation',
                    'Sports competition',
                    'Action & Movement',
                    'Motorsport',
                    'E-sport & gaming'
                ]
            },
            {
                name: 'Corporate & Corporate',
                icon: '🏢',
                isPopular: true,
                subcategories: [
                    'Team photo',
                    'Direction & portrait CEO',
                    'Company report',
                    'Industrial Photo',
                    'Medical & Health Photo',
                    'Work Environment',
                    'CSR & Sustainable Development',
                    'Internal communication'
                ]
            },
            {
                name: 'Air & Drone',
                icon: '✈️',
                isPopular: true,
                subcategories: [
                    'Overhead immobilage',
                    'Aerial Landscape',
                    'Aerial events',
                    'Inspection & technique',
                    'Agriculture & Cartography',
                    'Urban planning',
                    'Tourism & Promotion',
                    'Sport & Air Action'
                ]
            }
        ]
    },
    {
        theme: 'VIDEOGRAPHY',
        categories: [
            {
                name: 'Cinematography',
                icon: '🎬',
                isPopular: true,
                subcategories: [
                    'Short film',
                    'Feature film',
                    'Advertising film',
                    'Documentary',
                    'Fiction & Drama',
                    'Animated film',
                    'Experimental film'
                ]
            },
            {
                name: 'Corporate Video',
                subcategories: [
                    'Corporate Video',
                    'Presentation video',
                    'Customer Story',
                    'Recruitment video',
                    'Formation & e-learning',
                    'Internal video',
                    'Video Annual Report',
                    'CSR & Corporate Values'
                ]
            },
            {
                name: 'Advertising & Brand Content',
                subcategories: [
                    'Spot TV',
                    'Digital Advertising',
                    'Social media video',
                    'Influencer content',
                    'Brand film',
                    'Viral video',
                    'Kickstarter & crowdfunding',
                    'Product Overview'
                ]
            },
            {
                name: 'Video Events',
                subcategories: [
                    'Wedding',
                    'Seminars & conferences',
                    'Concert & festival',
                    'Company evening',
                    'Aftermovie',
                    'Live streaming',
                    'Sporting event',
                    'Ceremony & Gala'
                ]
            },
            {
                name: 'Creative Content & Social Media',
                icon: '🎮',
                isPopular: true,
                subcategories: [
                    'YouTube (long form)',
                    'TikTok & Reels',
                    'Instagram Stories',
                    'LinkedIn Video',
                    'Facebook video',
                    'Pinterest video',
                    'Twitch & live',
                    'Video Podcast'
                ]
            },
            {
                name: 'Real Estate & Architecture Video',
                subcategories: [
                    'Property video tour',
                    '360\u00b0 virtual tour',
                    'Real Estate Drone Video',
                    'Home tour',
                    'Commercial real estate',
                    'Architectural project',
                    'Construction site & follow-up',
                    'Real estate development'
                ]
            },
            {
                name: 'Documentary & Reportage',
                subcategories: [
                    'Social documentary',
                    'Nature documentary',
                    'Investigative reporting',
                    'Documentary portrait',
                    'Historical documentary',
                    'Sports documentary',
                    'Docu-reality',
                    'Vox pop'
                ]
            },
            {
                name: 'Drone & Aerial',
                subcategories: [
                    'Aerial video landscape',
                    'Immobilien drone',
                    'Drone Events',
                    'Inspection technique',
                    'Agriculture & Cartography',
                    'Sport & action drone',
                    'Drone Cinematography',
                    'FPV & cinewhoop'
                ]
            },
            {
                name: 'Music & Art Clip',
                subcategories: [
                    'Clip musical',
                    'Lyric video',
                    'Live performance',
                    'BTS & making-of',
                    'Visual album',
                    'Concert & tour',
                    'Artist promo',
                    'Dance & choreography'
                ]
            },
            {
                name: 'Institutional & Training',
                subcategories: [
                    'Educational Video',
                    'MOOC & e-learning',
                    'Tutorial & how-to',
                    'Medical Video',
                    'Legal Video',
                    'Internal training',
                    'Video Onboarding',
                    'Awareness'
                ]
            }
        ]
    },
    {
        theme: 'EDITING & POST-PRODUCTION',
        categories: [
            {
                name: 'Standard Video Editing',
                subcategories: [
                    'Event planning',
                    'Corporate Set-up',
                    'Advertising editing',
                    'Social media editing',
                    'YouTube Editing',
                    'Interview editing',
                    'Vlog editing',
                    'Testimonial editing'
                ]
            },
            {
                name: 'Film Editing',
                subcategories: [
                    'Short film',
                    'Feature film',
                    'Documentary',
                    'Clip musical',
                    'Advertising film',
                    'Series & episode',
                    'Animated film',
                    'Trailer & teaser'
                ]
            },
            {
                name: 'Motion Design',
                subcategories: [
                    '2D Animation',
                    'Logo Animation',
                    'Animated infographic',
                    'Lower thirds',
                    'Animated transitions',
                    'Titles & Credits',
                    'Explainer video',
                    'Motion typography'
                ]
            },
            {
                name: 'Calibration & Color Grading',
                subcategories: [
                    'Standard Calibration',
                    'Color grading cin\u00e9ma',
                    'Look commercial',
                    'Vintage & retro look',
                    'Look HDR',
                    'Color correction',
                    'Match moving',
                    'Look packshot'
                ]
            },
            {
                name: 'Visual Effects (VFX)',
                subcategories: [
                    'Compositing',
                    'Rotoscoping',
                    'Incrustation & green screen',
                    'Tracking & matchmove',
                    'Paint & cleanup',
                    'Deleting Items',
                    'Decor Extension',
                    'Weather effects'
                ]
            },
            {
                name: '3D Animation',
                subcategories: [
                    '3D Modeling',
                    '3D Character Animation',
                    'Product 3D Animation',
                    'Architectural Visualization',
                    'Smooth simulation',
                    'Particle Simulation',
                    'Motion capture',
                    'VR & AR content'
                ]
            },
            {
                name: 'Sound Design & Audio',
                subcategories: [
                    'Sound design',
                    'Audio Mixing',
                    'Bruitage & Foley',
                    'Voice-over & dubbing',
                    'Synchronized music',
                    'Audio restoration',
                    'Podcast editing',
                    'ASMR content'
                ]
            },
            {
                name: 'Multi-Platform Mounting',
                subcategories: [
                    'Portrait Format (9:16)',
                    'Square format (1:1)',
                    'Landscape aspect ratio (16:9)',
                    'Format story',
                    'Multi-network adaptation',
                    'Subtitling',
                    'Shortened version',
                    'Video SEO Optimization'
                ]
            },
            {
                name: 'Photo Editing',
                subcategories: [
                    'Beauty retouching',
                    'Fashion retouching',
                    'Product retouching',
                    'Real estate retouching',
                    'Landscape retouching',
                    'Portrait editing',
                    'Photo restoration',
                    'Creative photo editing'
                ]
            },
            {
                name: 'Emerging Formats',
                subcategories: [
                    '360\u00b0 video',
                    'Virtual Reality (VR)',
                    'Augmented Reality (AR)',
                    'Interactive content',
                    'Video for DOOH',
                    'Video LED wall',
                    'Metaverse content',
                    'Hologram'
                ]
            }
        ]
    }
];
const trendingSubcategories = [
    { name: 'TikTok & Reels', badge: '🔥 TRENDING' },
    { name: 'Corporate Video', badge: '⚡ ON THE RISE' },
    { name: 'Portrait corporate / business', badge: '📈 +45%' },
    { name: 'Aftermovie', badge: '🌟 POPULAR' },
    { name: '360\u00b0 virtual tour', badge: '💡 NEW' },
    { name: 'YouTube (long form)', badge: '🎯 APPLICATION' },
];
async function seedCategories() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose_1.default.connect(MONGO_URI);
        console.log('Connected to MongoDB.');
        // Drop the old unique index on 'name' if it exists
        try {
            await category_model_1.Category.collection.dropIndex('name_1');
            console.log('Dropped old name_1 index.');
        }
        catch (e) {
            console.log('Index name_1 does not exist or could not be dropped.');
        }
        // Optional: Clear existing categories
        await category_model_1.Category.deleteMany({});
        console.log('Cleared existing categories.');
        for (const themeItem of categoryData) {
            const { theme, categories } = themeItem;
            console.log(`Processing Theme: ${theme}`);
            for (const catItem of categories) {
                const { name: categoryName, subcategories, icon, isPopular } = catItem;
                const category = await category_model_1.Category.create({
                    name: categoryName,
                    type: 'category',
                    theme,
                    icon,
                    isPopular: isPopular || false,
                    isActive: true
                });
                console.log(`  Added Category: ${categoryName}`);
                for (const subcategoryName of subcategories) {
                    const trendingInfo = trendingSubcategories.find(t => t.name === subcategoryName);
                    await category_model_1.Category.create({
                        name: subcategoryName,
                        type: 'subcategory',
                        parent: category._id,
                        theme,
                        isTrending: !!trendingInfo,
                        trendingBadge: trendingInfo ? trendingInfo.badge : undefined,
                        isActive: true
                    });
                    console.log(`    Added Subcategory: ${subcategoryName}`);
                }
            }
        }
        console.log('Seeding completed successfully.');
    }
    catch (error) {
        console.error('Error seeding categories:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}
seedCategories();
