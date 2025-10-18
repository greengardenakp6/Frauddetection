
const CONFIG = {
    // Use GitHub Pages base URL for API calls
    BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000'
        : `${window.location.origin}/api`,
    
    // GitHub repository info (update with your repo)
    REPO: 'yourusername/fraud-detection-system',
    BRANCH: 'main'
};
