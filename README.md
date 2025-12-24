# ATS-Resume-Scanner-Upgrade-version
Upgrade version of ATS resume scanner project 

# ATS Resume Scanner - React Frontend

AI-Powered Intelligent Recruitment System built with React.js

## 🚀 Features

- ✨ Beautiful glassmorphism UI with animated splash screen
- 🤖 AI-powered resume parsing and analysis
- 📊 Intelligent candidate ranking system
- 📄 PDF report generation
- 🎯 ATS compatibility checking
- 📱 Fully responsive design

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend server running on port 8000

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd ats-resume-scanner-react
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in root directory:
```env
REACT_APP_API_URL=http://localhost:8000
```

4. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`

## 📁 Project Structure
```
ats-resume-scanner-react/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── SplashScreen.jsx
│   │   ├── Header.jsx
│   │   ├── JobRequirements.jsx
│   │   ├── UploadSection.jsx
│   │   ├── ProcessingCard.jsx
│   │   ├── ResultsCard.jsx
│   │   └── FeaturesGrid.jsx
│   ├── services/
│   │   └── api.js
│   ├── styles/
│   │   ├── Global.css
│   │   ├── SplashScreen.css
│   │   ├── Header.css
│   │   ├── JobRequirements.css
│   │   ├── UploadSection.css
│   │   ├── ProcessingCard.css
│   │   ├── ResultsCard.css
│   │   └── FeaturesGrid.css
│   ├── App.jsx
│   ├── App.css
│   └── index.js
├── package.json
├── .env
└── README.md
```

## 🔌 Backend Configuration

Ensure your backend server is running on port 8000 with the following endpoints:

- `POST /api/analyze` - Analyze resumes
- `POST /api/report` - Generate PDF report

## 📦 Build for Production
```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## 🎨 Customization

### Change Backend URL

Edit `.env` file:
```env
REACT_APP_API_URL=https://your-backend-url.com
```

### Modify Colors

Edit CSS variables in `src/styles/Global.css`:
```css
:root {
    --primary: #6366f1;
    --secondary: #8b5cf6;
    --accent: #ec4899;
    /* ... */
}
```

## 🐛 Troubleshooting

### CORS Issues
If you encounter CORS errors, ensure your backend has proper CORS headers configured:
```python
# Python Flask example
from flask_cors import CORS
CORS(app)
```

### Backend Connection Failed
- Verify backend server is running
- Check `.env` file has correct API URL
- Ensure port 8000 is not blocked by firewall

## 📄 License

MIT License

## 👨‍💻 Author

Pranav