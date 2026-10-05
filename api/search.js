module.exports = async function (req, res) {
    const query = req.query.q;

    if (!query) {
        return res.status(400).json({ error: "Kata kunci kosong" });
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.error("ERROR: API Key tidak ditemukan. Cek file .env Anda!");
        return res.status(500).json({ error: "API Key hilang" });
    }

    try {
        const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authString}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });
        
        if (!tokenResponse.ok) {
            return res.status(tokenResponse.status).json({ error: "Gagal meminta token" });
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=10`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!searchResponse.ok) {
            return res.status(searchResponse.status).json({ error: "Gagal dari API Spotify" });
        }

        const searchData = await searchResponse.json();
        res.status(200).json(searchData);

    } catch (error) {
        console.error("Error Sistem Node.js:", error);
        res.status(500).json({ error: error.message });
    }
};