const express = require('express');
const app = express();

// Temporary in-memory database to store user time
const userDatabase = {}; 

function mapRewardToMinutes(rewardAmount) {
    // 1 ad view = 180 minutes (3 hours).
    return 180; 
}

// 1. ADMOB SSV CALLBACK ENDPOINT
app.get('/api/admob-ssv', (req, res) => {
    const { custom_data, reward_amount } = req.query;
    const userId = custom_data; 
    
    if (!userId) {
        return res.status(400).send('Missing custom_data (user_id)');
    }

    const minutesToAdd = mapRewardToMinutes(reward_amount);

    if (!userDatabase[userId]) {
        userDatabase[userId] = { remainingMinutes: 0 };
    }
    userDatabase[userId].remainingMinutes += minutesToAdd;

    console.log(`[AdMob] Added ${minutesToAdd} mins to User: ${userId}. Total: ${userDatabase[userId].remainingMinutes}`);

    res.status(200).send('OK'); 
});

// 2. TIME CHECK ENDPOINT FOR YOUR ANDROID APP
app.get('/api/get_time', (req, res) => {
    const userId = req.query.user_id;

    if (!userId) {
        return res.json({ time_remaining_ms: 0 });
    }

    // --- 30 MINUTE FREE TRIAL LOGIC ---
    if (!userDatabase[userId]) {
        userDatabase[userId] = { remainingMinutes: 30 };
        console.log(`[New User] ID ${userId} received 30 free minutes.`);
    }

    const timeMs = userDatabase[userId].remainingMinutes * 60 * 1000;
    res.json({ time_remaining_ms: timeMs });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`VPN Security Server running on port ${PORT}`);
});
