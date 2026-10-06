const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
app.use(express.json());

const CONFIG_FILE = path.join(__dirname, 'warriors-config.json');

// 1. Where your static dashboard files live
const PUBLIC_DIR = '/var/www/localhost/htdocs'; // Adjust this to your actual Nginx web root if different!
app.use(express.static(PUBLIC_DIR));

// 2. Load configuration from server hard drive
app.get('/api/config', (req, res) => {
    if (fs.existsSync(CONFIG_FILE)) {
        res.json(JSON.parse(fs.readFileSync(CONFIG_FILE)));
    } else {
        res.json({ nickname: "", project: "", warriors: [] });
    }
});

// 3. Save configuration to server hard drive
app.post('/api/config', (req, res) => {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
});

// 4. Proxy requests securely to local warriors based on their ID
app.get('/api/warrior-proxy/:id', async (req, res) => {
    // Map your IDs to your local network URLs
    const warriorMap = {
        "1": "http://warrior01.archiveteam.18claypitts.hova.net:8001",
        "2": "http://warrior02.archiveteam.18claypitts.hova.net:8001",
        "3": "http://warrior03.archiveteam.18claypitts.hova.net:8001",
        "4": "http://warrior04.archiveteam.18claypitts.hova.net:8001",
        "5": "http://warrior05.archiveteam.18claypitts.hova.net:8001"
    };

    const targetUrl = warriorMap[req.params.id];
    if (!targetUrl) return res.status(404).send('Warrior config endpoint map not found');

    try {
        // Your server fetches the metrics data internally on your local network
        const response = await axios.get(`${targetUrl}/stats.json`, { timeout: 3000 });
        res.json(response.data);
    } catch (error) {
        res.status(500).send('Error connecting to local Warrior internally');
    }
});

// Run on port 8080 internally
app.listen(8080, () => console.log('Secure ATW Backend running on port 8080'));
