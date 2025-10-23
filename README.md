# Databricks React + FastAPI Application

> **🚀 Quick Deploy**: To deploy this app to Databricks, run `python deploy_to_databricks.py`

A modern full-stack application template with React, TypeScript, Material-UI, Framer Motion, and FastAPI, designed for Databricks Apps deployment.

## Features

### Frontend
- ⚛️ React 18 with TypeScript
- 🎨 Material-UI (MUI) components
- ✨ Framer Motion animations
- 🎯 Responsive drawer navigation
- 📱 Mobile-friendly design
- ⚡ Vite for fast development and builds

### Backend
- 🚀 FastAPI with automatic API documentation
- 📊 Health check and sample data endpoints
- 🗂️ Static file serving for production
- 🔄 Client-side routing support
- 🔐 CORS middleware configured

### Deployment
- 🎯 Databricks Apps ready
- 🔧 Automated build and deployment script
- 🔐 Secret management support
- ♻️ Hard redeploy option

## Project Structure

```
dbapps-project/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── AppBar.tsx   # Top navigation bar
│   │   │   ├── Drawer.tsx   # Side navigation drawer
│   │   │   └── MainContent.tsx
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/                 # FastAPI application
│   ├── main.py              # FastAPI app
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Environment variables
├── build.py                 # Build script
├── deploy_to_databricks.py  # Deployment script
├── app.yaml                 # Databricks configuration
└── README.md
```

## Quick Start

### Prerequisites

- Node.js (v18+)
- Python (v3.9+)
- npm or yarn
- Databricks CLI (for deployment)

### Local Development

1. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will be available at http://localhost:5173

4. **Start Backend Development Server**
   ```bash
   cd backend
   uvicorn main:app --reload --port 8000
   ```
   The backend will be available at http://localhost:8000
   API documentation: http://localhost:8000/docs

### Building for Production

Run the build script to compile the frontend and prepare for deployment:

```bash
python build.py
```

This will:
1. Install frontend dependencies
2. Build the React app to static files
3. Copy static files to backend/static
4. Prepare the project for deployment

## API Documentation

### Endpoints

#### Health Check
```
GET /api/health
```
Returns the health status of the API.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-23T12:00:00",
  "environment": "production"
}
```

#### Sample Data
```
GET /api/data
```
Returns sample data with a timestamp.

**Response:**
```json
{
  "message": "Hello from FastAPI!",
  "timestamp": "2025-10-23T12:00:00",
  "data": [
    {"id": 1, "name": "Item 1", "value": 100},
    {"id": 2, "name": "Item 2", "value": 200},
    {"id": 3, "name": "Item 3", "value": 300}
  ]
}
```

## Deployment to Databricks

### Prerequisites

1. Install Databricks CLI:
   ```bash
   pip install databricks-cli
   ```

2. Configure Databricks CLI:
   ```bash
   databricks configure --token
   ```

### Deployment Options

#### Standard Deployment
```bash
python deploy_to_databricks.py
```

This will:
- Check Databricks CLI configuration
- Auto-detect workspace URL and user email
- Build the React frontend
- Package the backend
- Import to Databricks workspace
- Deploy the app
- Display the app URL

#### Hard Redeploy
For a complete redeployment (deletes existing app and redeploys):
```bash
python deploy_to_databricks.py --hard-redeploy
```

#### Custom App Name and Folder
```bash
python deploy_to_databricks.py --app-name my-custom-app --app-folder /Workspace/Users/user@example.com/my-app
```

### Deployment Script Features

The `deploy_to_databricks.py` script:
- ✅ Checks Databricks CLI installation and configuration
- 🔍 Auto-detects workspace URL and user email
- 🔨 Builds React frontend using npm
- 📁 Copies static files to backend
- 📦 Packages backend (excludes venv, tests, etc.)
- 📤 Imports to Databricks workspace
- 🚀 Deploys the app
- 📱 Shows app URL and status
- 🧹 Cleans up temporary files

### Environment Configuration

The app uses the following environment variables in production:

- `ENV`: Set to "production"
- `PORT`: Set to "8000"
- `DEBUG`: Set to "False"

These are automatically configured during deployment via `app.yaml`.

## Troubleshooting

### Frontend build fails
- Ensure Node.js and npm are installed
- Try deleting `node_modules` and running `npm install` again
- Check for TypeScript errors in the code

### Backend fails to start
- Ensure Python 3.9+ is installed
- Check that all dependencies are installed: `pip install -r backend/requirements.txt`
- Verify that port 8000 is not already in use

### Databricks CLI not configured
If you see an error about Databricks CLI not being configured:
1. Run `databricks configure --token`
2. Enter your workspace URL (e.g., https://your-workspace.databricks.com)
3. Enter your personal access token

To create a personal access token:
1. Go to your Databricks workspace
2. Click on your user icon → Settings
3. Go to Developer → Access tokens
4. Click "Generate new token"

### Deployment fails
- Ensure you have proper permissions in your Databricks workspace
- Check that the app name doesn't conflict with existing apps
- Try using `--hard-redeploy` flag to do a clean redeployment
- Review the error message and check workspace logs

### Static files not found
- Run `python build.py` to build the frontend
- Ensure `backend/static` directory exists and contains the built files
- Check that the build was successful

## Development Tips

### Frontend
- Components are located in `frontend/src/components/`
- MUI theme configuration is in `frontend/src/main.tsx`
- Framer Motion animations are used in the Drawer and MainContent components
- API calls use the `/api` prefix which is proxied to the backend in development

### Backend
- Add new routes in `backend/main.py`
- Static files are served from `backend/static/` in production
- CORS is configured for local development (ports 5173 and 8000)
- FastAPI automatic docs are available at `/docs` and `/redoc`

### Adding New Pages
1. Create a new component in `frontend/src/components/`
2. Add the page to the navigation items in `Drawer.tsx`
3. Update the routing logic in `MainContent.tsx` if needed

## Technology Stack

### Frontend
- [React](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Material-UI](https://mui.com/) - UI components
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [Vite](https://vitejs.dev/) - Build tool

### Backend
- [FastAPI](https://fastapi.tiangolo.com/) - Web framework
- [Uvicorn](https://www.uvicorn.org/) - ASGI server
- [Python-dotenv](https://github.com/theskumar/python-dotenv) - Environment variables

### Deployment
- [Databricks Apps](https://docs.databricks.com/en/dev-tools/databricks-apps/index.html) - Application hosting
- [Databricks CLI](https://docs.databricks.com/en/dev-tools/cli/index.html) - Deployment tool

## License

MIT

## Support

For issues and questions, please refer to:
- [Databricks Apps Documentation](https://docs.databricks.com/en/dev-tools/databricks-apps/index.html)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Material-UI Documentation](https://mui.com/)
