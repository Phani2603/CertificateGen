// scripts/list-s3-templates.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in .env.local");
    process.exit(1);
}

async function listTemplates() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Define minimal schemas
        const EventSchema = new mongoose.Schema({
            name: String,
            templateS3Key: String,
        }, { collection: 'events' });

        const CertificateSchema = new mongoose.Schema({
            eventName: String,
            templateS3Key: String,
        }, { collection: 'certificates' });

        const Event = mongoose.model('Event', EventSchema);
        const Certificate = mongoose.model('Certificate', CertificateSchema);

        // Get unique S3 keys from Events
        const events = await Event.find({ templateS3Key: { $exists: true, $ne: null } }).lean();

        console.log('=== REQUIRED TEMPLATE S3 KEYS FOR EVENTS ===');
        const uniqueKeys = new Set();

        events.forEach(event => {
            if (event.templateS3Key) {
                uniqueKeys.add(event.templateS3Key);
                console.log(`Event: "${event.name}"`);
                console.log(`S3 Key: ${event.templateS3Key}`);
                console.log('-------------------------------------------');
            }
        });

        // Check if certificates have any keys not found in events
        const certificates = await Certificate.find({ templateS3Key: { $exists: true, $ne: null } }).lean();
        let additionalKeysCount = 0;

        certificates.forEach(cert => {
            if (cert.templateS3Key && !uniqueKeys.has(cert.templateS3Key)) {
                uniqueKeys.add(cert.templateS3Key);
                if (additionalKeysCount === 0) {
                    console.log('\n=== ADDITIONAL KEYS FOUND ONLY ON INDIVIDUAL CERTIFICATES ===');
                }
                console.log(`Certificate Event: "${cert.eventName}"`);
                console.log(`S3 Key: ${cert.templateS3Key}`);
                console.log('-------------------------------------------');
                additionalKeysCount++;
            }
        });

        console.log(`\nTotal Unique Template Keys to upload: ${uniqueKeys.size}`);
        console.log('\n💡 Tip: Upload the original images to your new S3 bucket using these EXACT S3 keys.');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

listTemplates();
