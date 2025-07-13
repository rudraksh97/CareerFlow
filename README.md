# CareerFlow

A comprehensive application tracking system to help you manage your job applications efficiently. Track applications, contacts, resumes, cover letters, and much more in one centralized platform.

## 🎯 What is CareerFlow?

CareerFlow helps you organize and track your job applications across multiple platforms. When applying to hundreds of jobs, you can easily lose track of:

- Jobs you've applied to
- Application statuses
- Referral contacts and messages
- Resumes/cover letters used for each application
- Interview schedules and notes
- Company contacts and communication history

## ✨ Features

- **Job Application Tracking**: Manage all your applications in one place
- **Contact Management**: Store recruiter and reference contact information
- **Resume & Cover Letter Management**: Version control your application materials
- **Email Integration**: Connect with Gmail for seamless communication
- **Calendar Integration**: Track interviews and important dates
- **Analytics Dashboard**: Visualize your application progress
- **Referral Message Generator**: Create personalized referral requests
- **Search & Filter**: Advanced filtering to find applications quickly

## 🚀 Quick Start (Recommended)

### Prerequisites

- **Docker** and **Docker Compose** installed
- **Git** for cloning the repository
- **Node.js** (optional, for local development)
- **Python 3.8+** (optional, for local development)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/CareerFlow.git
cd CareerFlow
```

### 2. Start with Docker (Easiest)

```bash
# Make the startup script executable
chmod +x start-with-gateway.sh

# Start all services
./start-with-gateway.sh
```

That's it! The application will be available at `http://localhost:3000`

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **API Health Check**: http://localhost:3000/health
- **All API Endpoints**: http://localhost:3000/api/*

## 🌐 Deployment Options

### Option 1: Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up --build -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

### Option 2: Local Development

#### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up database
python migrate.py

# Start backend
python main.py
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

#### API Gateway Setup
```bash
cd api-gateway

# Install dependencies
npm install

# Start API Gateway
npm start
```

### Option 3: ngrok Hosting (For External Access)

Perfect for sharing your application or accessing it remotely:

```bash
# First, start the application locally
./start-with-gateway.sh

# In another terminal, install and run ngrok
ngrok http 3000
```

Your application will be accessible via the ngrok URL globally.

## ⚙️ Configuration

### Environment Variables

#### Backend Configuration
Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL=sqlite:///./data/pats.db
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/settings/auth/google/callback
OPENAI_API_KEY=your_openai_api_key
```

#### API Gateway Configuration
Environment variables for the API Gateway:

```env
PORT=3000
BACKEND_URL=http://localhost:8000
CORS_ORIGIN=*
NODE_ENV=production
```

### Google OAuth Setup (Optional)

For email and calendar integration:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API and Google Calendar API
4. Create OAuth 2.0 credentials
5. Add your credentials to the backend `.env` file

### OpenAI Integration (Optional)

For AI-powered features:

1. Get an API key from [OpenAI](https://openai.com/api/)
2. Add `OPENAI_API_KEY` to your backend `.env` file

## 🗂️ Project Structure

```
PATS/
├── api-gateway/          # Express.js API Gateway (Port 3000)
│   ├── server.js         # Main gateway server
│   ├── package.json      # Dependencies
│   └── Dockerfile        # Gateway container config
├── backend/              # FastAPI Backend (Port 8000)
│   ├── app/              # Application modules
│   │   ├── models/       # Database models
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   └── utils/        # Helper functions
│   ├── main.py           # Backend entry point
│   ├── requirements.txt  # Python dependencies
│   └── Dockerfile        # Backend container config
├── frontend/             # React Frontend
│   ├── src/              # Source code
│   │   ├── components/   # React components
│   │   ├── pages/        # Application pages
│   │   ├── services/     # API calls
│   │   └── types/        # TypeScript types
│   ├── package.json      # Node dependencies
│   └── Dockerfile        # Frontend container config
├── docker-compose.yml    # Multi-service orchestration
├── start-with-gateway.sh # Quick start script
└── README.md            # This file
```

## 🔧 Development Commands

### Docker Commands
```bash
# Build all services
docker-compose build

# Start services in development mode
docker-compose up

# Start services in background
docker-compose up -d

# View logs
docker-compose logs -f [service-name]

# Stop services
docker-compose down

# Remove all containers and volumes
docker-compose down -v
```

### Frontend Commands
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Run type checking
npm run type-check
```

### Backend Commands
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python migrate.py

# Start development server
python main.py

# Run tests
python -m pytest

# Create new migration
alembic revision --autogenerate -m "description"
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Integration Tests
```bash
cd backend
python -m pytest e2e-tests/
```

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process
kill -9 [PID]
```

#### Docker Issues
```bash
# Clean Docker cache
docker system prune -a

# Rebuild containers
docker-compose up --build --force-recreate
```

#### Database Issues
```bash
# Reset database
cd backend
rm data/pats.db
python migrate.py
```

#### Permission Issues
```bash
# Make scripts executable
chmod +x start-with-gateway.sh
chmod +x scripts/*.sh
```

### Getting Help

1. Check the logs: `docker-compose logs -f`
2. Verify all services are running: `docker-compose ps`
3. Test the health endpoint: `curl http://localhost:3000/health`
4. Check the troubleshooting section in `API_GATEWAY_GUIDE.md`

## 📱 Usage

### First Time Setup

1. **Start the application** using one of the deployment methods above
2. **Open your browser** and go to `http://localhost:3000`
3. **Create your profile** in the Settings page
4. **Connect Google services** (optional) for email/calendar integration
5. **Start adding job applications** from the Applications page

### Key Features

- **Dashboard**: Overview of your application pipeline
- **Applications**: Add, edit, and track job applications
- **Contacts**: Manage recruiter and reference contacts
- **Resumes**: Upload and organize different resume versions
- **Cover Letters**: Create and manage cover letters
- **Analytics**: Visualize your application progress
- **Settings**: Configure preferences and integrations

## 🚀 Production Deployment

### Docker Production Setup

1. **Clone the repository** on your server
2. **Set up environment variables** in production `.env` files
3. **Use Docker Compose** with production configurations
4. **Set up reverse proxy** (nginx/apache) for SSL termination
5. **Configure domain** and SSL certificates

### Cloud Deployment Options

- **AWS ECS** with Docker containers
- **Google Cloud Run** for serverless deployment
- **Digital Ocean Droplets** with Docker
- **Heroku** with container stack
- **Railway** for simple deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔄 Version Information

Current version information can be found in:
- `version.json` - Application version
- `VERSIONING.md` - Version management guide
- `scripts/version_manager.py` - Version management script

## 📞 Support

For support and questions:
- Check the troubleshooting section above
- Review the API Gateway guide in `API_GATEWAY_GUIDE.md`
- Check existing issues in the repository
- Create a new issue if needed

---

**Happy job hunting! 🎯** 