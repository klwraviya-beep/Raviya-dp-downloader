const express = require('express');
const cors = require('cors');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');

const app = express();
app.use(cors()); // අනිවාර්යයි: වෙබ් බ්‍රව්සරයට API එකට සම්බන්ධ වීමට ඉඩ දෙයි

let sock; 

// WhatsApp වෙත සම්බන්ධ වීම
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if(connection === 'close') {
            console.log('Connection closed, reconnecting...');
            connectToWhatsApp();
        } else if(connection === 'open') {
            console.log('✅ RAVIYA TECH BOT - Connected!');
            console.log('🌐 Web API is ready on port 3000');
        }
    });
}

connectToWhatsApp();

// Frontend වෙබ් එකෙන් එන Request එක අල්ලන API එක
app.get('/api/getdp', async (req, res) => {
    const targetNumber = req.query.number; 

    if (!targetNumber) {
        return res.json({ success: false, message: "Target Number is missing!" });
    }

    const cleanNumber = targetNumber.replace(/[^0-9]/g, ''); 
    const jid = `${cleanNumber}@s.whatsapp.net`;

    try {
        // Baileys මගින් DP එකේ High Quality රූපය ලබා ගැනීම
        const ppUrl = await sock.profilePictureUrl(jid, 'image');
        
        res.json({ 
            success: true, 
            url: ppUrl 
        });

    } catch (error) {
        console.log("Error fetching DP for:", jid);
        res.json({ 
            success: false, 
            message: "Target has hidden their DP or no DP found.",
            url: "https://ui-avatars.com/api/?name=NO+DP&background=ff0044&color=fff&size=200" 
        });
    }
});

// Port 3000 මගින් Server එක ආරම්භ කිරීම
app.listen(3000, () => {
    console.log('🚀 API Server is running on http://localhost:3000');
});