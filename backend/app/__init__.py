from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import applications, contacts, analytics, settings, profile, resumes, cover_letters, referral_messages, template_files, resources, emails, calendar_events, todos, reminders
from .models.database import engine, Base
from .version import VERSION_INFO, VERSION

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=VERSION_INFO["name"],
    description=VERSION_INFO["description"],
    version=VERSION_INFO["version"]
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(applications.router, prefix="/api/applications", tags=["applications"])
app.include_router(contacts.router, prefix="/api/contacts", tags=["contacts"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])
app.include_router(resumes.router, prefix="/api/resumes", tags=["resumes"])
app.include_router(cover_letters.router, prefix="/api/cover-letters", tags=["cover_letters"])
app.include_router(referral_messages.router, prefix="/api/referral-messages", tags=["referral_messages"])
app.include_router(template_files.router, prefix="/api/template-files", tags=["template_files"])
app.include_router(resources.router, prefix="/api/resources", tags=["resources"])
app.include_router(emails.router, prefix="/api/emails", tags=["emails"])
app.include_router(calendar_events.router, prefix="/api/calendar-events", tags=["calendar_events"])
app.include_router(todos.router, prefix="/api/todos", tags=["todos"])
app.include_router(reminders.router, prefix="/api/reminders", tags=["reminders"])


@app.get("/")
async def root():
    return {
        "message": "Personal Application Tracking System API", 
        "version": VERSION_INFO["version"],
        "api_version": VERSION_INFO["api_version"]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": VERSION_INFO["version"]}

@app.get("/version")
async def get_version():
    """Get detailed version information"""
    return VERSION_INFO 