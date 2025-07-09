from .applications import router as applications_router
from .contacts import router as contacts_router
from .analytics import router as analytics_router

__all__ = [
    "applications_router",
    "contacts_router", 
    "analytics_router"
] 