

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        const { accNo, amount, location } = req.body;
        
        // Process with C backend (would need to be compiled for serverless)
        const alerts = []; // Process fraud detection
        
        res.status(200).json({ alerts });
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};
