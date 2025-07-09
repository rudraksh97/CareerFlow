from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import applications, contacts, analytics, settings
from .models.database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Personal Application Tracking System (PATS)",
    description="A comprehensive system to track job applications and manage contacts",
    version="1.0.0"
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

@app.get("/")
async def root():
    return {"message": "Personal Application Tracking System API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"} 