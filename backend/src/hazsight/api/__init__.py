"""FastAPI endpoints and web dashboard module.

Import and include the routers in your FastAPI app:

    from fastapi import FastAPI
    from hazsight.api.reports import router as reports_router

    app = FastAPI(title="Hazsight API")
    app.include_router(reports_router)
"""

from .reports import router

__all__ = ["router"]
