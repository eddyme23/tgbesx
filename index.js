const express = require('express');
const mongoose = require('mongoose');
const app = express();

// 1. CONNECT TO PERMANENT MONGODB DATABASE
const dbUri = process.env.MONGODB_URI;
if (!dbUri) {
    console.error("CRITICAL ERROR: MONGODB_URI is missing from Render Environment Variables!");
} else {
    mongoose.connect(dbUri)
        .then(() => console.log('Successfully connected to MongoDB Atlas!'))
        .catch(err => console.error('MongoDB Connection Error:', err));
}

// 2. CREATE THE USER BLUEPRINT
const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    remainingMinutes: { type: Number, default: 0 }
});
const User = mongoose.model('User', userSchema);

// 3. ADMOB SSV CALLBACK ENDPOINT
app.get('/api/admob-ssv', async (req, res) => {
    const { custom_data, reward_amount } = req.query;
    const userId = custom_data; 
    
    if (!userId) {
        return res.status(400).send('Missing custom_data (user_id)');
    }

    // 1 Ad = 120 minutes
    const minutesToAdd = 120; 

    try {
        // Find the user, or create them if they don't exist yet
        let user = await User.findOne({ userId: userId });
        if (!user) {
            user = new User({ userId: userId, remainingMinutes: 0 });
        }
        
        user.remainingMinutes += minutesToAdd;
        await user.save(); // Save permanently to the cloud!

        console.log(`[AdMob] Added ${minutesToAdd} mins to User: ${userId}. Total: ${user.remainingMinutes}`);
        res.status(200).send('OK'); 

    } catch (error) {
        console.error("Database error during AdMob callback:", error);
        res.status(500).send('Internal Server Error');
    }
});

// 4. TIME CHECK ENDPOINT FOR YOUR ANDROID APP
app.get('/api/get_time', async (req, res) => {
    const userId = req.query.user_id;

    if (!userId) {
        return res.json({ time_remaining_ms: 0 });
    }

    try {
        let user = await User.findOne({ userId: userId });

        // --- 30 MINUTE FREE TRIAL LOGIC ---
        if (!user) {
            user = new User({ userId: userId, remainingMinutes: 30 });
            await user.save();
            console.log(`[New User] ID ${userId} received 30 free minutes in database.`);
        }
        // ---------------------------------------

        const timeMs = user.remainingMinutes * 60 * 1000;
        res.json({ time_remaining_ms: timeMs });

    } catch (error) {
        console.error("Database error during time check:", error);
        res.json({ time_remaining_ms: 0 });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`VPN Security Server running on port ${PORT}`);
});
