import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import health, business, profile, customers, leads, invoices, proposals, dashboard

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("soloceo")

app = FastAPI(
    title="SoloCEO API",
    description="AI Business Operating System for Freelancers & Small Businesses",
    version="1.0.0"
)

# CORS configuration for React Native / Expo and Web
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(health.router, prefix="/api")
app.include_router(business.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(customers.router, prefix="/api")
app.include_router(leads.router, prefix="/api")
app.include_router(invoices.router, prefix="/api")
app.include_router(proposals.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")

@app.get("/")
async def root():
    return {
        "app": "SoloCEO Backend API",
        "status": "operational",
        "docs": "/docs",
        "environment": settings.ENVIRONMENT
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
