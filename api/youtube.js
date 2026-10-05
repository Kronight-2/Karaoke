module.exports = async function (req, res) {
    const query = req.query.q;

    if (!query) {
        return res.status(400).json({ error: "Kata kunci kosong" });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
        console.error("ERROR: API Key YouTube tidak ditemukan!");
        return res.status(500).json({ error: "API Key hilang" });
    }

    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&key=${apiKey}`);
        
        if (!response.ok) {
            return res.status(response.status).json({ error: "Gagal dari API YouTube" });
        }

        const data = await response.json();
        res.status(200).json(data);

    } catch (error) {
        console.error("Error Sistem:", error);
        res.status(500).json({ error: error.message });
    }
};