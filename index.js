const express = require('express');
const app = express();

// Temporary in-memory database
const userDatabase = {}; 

function mapRewardToMinutes(rewardAmount) {
    // 1 ad view = 120 minutes (2 hours). Change this as needed.
    return 120; 
}

// 1. ADMOB SSV CALLBACK
app.get('/api/admob-ssv', (req, res) => {
    const { custom_data, reward_amount } = req.query;
    const userId = custom_data; 
    
    if (!userId) {
        return res.status(400).send('Missing user_id');
    }

    const minutesToAdd = mapRewardToMinutes(reward_amount);

    if (!userDatabase[userId]) {
        userDatabase[userId] = { remainingMinutes: 0 };
    }
    userDatabase[userId].remainingMinutes += minutesToAdd;

    console.log(`[AdMob] Added ${minutesToAdd} mins to User: ${userId}. Total: ${userDatabase[userId].remainingMinutes}`);

    res.status(200).send('OK'); 
});

// 2. TIME CHECK ENDPOINT FOR ANDROID APP
app.get('/api/get_time', (req, res) => {
    const userId = req.query.user_id;

    if (!userId || !userDatabase[userId]) {
        return res.json({ time_remaining_ms: 0 });
    }

    const timeMs = userDatabase[userId].remainingMinutes * 60 * 1000;
    res.json({ time_remaining_ms: timeMs });
});

// Render provides a specific port in the environment variables
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
