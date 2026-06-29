const express = require('express');
const login = require('fca-project-orion'); // FB Chat API
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Render ko active rakhne ke liye simple web page
app.get('/', (req, res) => {
    res.send('Satyam Pandey Ka Group Lock Server Chal Raha Hai! 🚀');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Facebook Bot Logic
const appState = JSON.parse(process.env.APP_STATE);
const LOCKED_NAME = process.env.LOCK_GROUP_NAME || "Satyam Pandey Group";

login({ appState: appState }, (err, api) => {
    if (err) return console.error("Login Error:", err);

    console.log("Satyam Pandey, aapka bot Facebook se connect ho gaya hai! 🎉");

    // Listen for group events
    api.listenMqtt((err, event) => {
        if (err) return console.error(err);

        // 1. GROUP NAME LOCK LOGIC
        if (event.type === "event" && event.logMessageData && event.logMessageData.name) {
            const currentName = event.logMessageData.name;
            const threadID = event.threadID;

            if (currentName !== LOCKED_NAME) {
                console.log(`⚠️ Naam badalne ki koshish ki gayi! Wapas lock kar raha hoon...`);
                
                // Wapas wahi naam set kar dega jo lock hai
                api.setTitle(LOCKED_NAME, threadID, (err) => {
                    if (!err) {
                        api.sendMessage(`🚫 Group ka naam locked hai! Satyam Pandey ke server ne ise wapas reset kar diya hai.`, threadID);
                    }
                });
            }
        }

        // 2. MEMBER LOCK/PROTECT LOGIC (Kisi ko remove karne par alert ya wapas add karna)
        if (event.type === "event" && event.logMessageType === "log:unsubscribe") {
            const leftUserID = event.logMessageData.leftParticipantFbId;
            const threadID = event.threadID;

            console.log(`👤 Member ID ${leftUserID} group se bahar hua/nikala gaya.`);
            
            // Notification dena ki member change hua hai
            api.sendMessage(`⚠️ Group members list me badlav hua hai! Server iski jaanch kar raha hai.`, threadID);
            
            // Aap chahein toh api.addUserToGroup(leftUserID, threadID) use karke wapas add bhi kar sakte hain
        }
    });
});
