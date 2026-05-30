from django.urls import path
from .views import (
    ArbitragePipelineView,
    CategoryListView,
    ItemDetailView, home_view, InitialFeedView
)
 
app_name = "arbitrage"
 
urlpatterns = [
    
    #Entry point

    path("", home_view, name="Entry"),
    path("arbitrage/feed/",            InitialFeedView.as_view(),       name="feed"), 
    
    # ── Main pipeline ─────────────────────────────────────────────────────────
    # POST: runs discovery → scrape → parse → summarise
    # GET:  returns service health + endpoint map
    
    path(
        "arbitrage/pipeline/",
        ArbitragePipelineView.as_view(),
        name="pipeline",
    ),
 
    # ── Category list ─────────────────────────────────────────────────────────
    # GET: returns the canonical category array for frontend filter chips
    path(
        "arbitrage/categories/",
        CategoryListView.as_view(),
        name="categories",
    ),
 
    # ── Item detail (static catalogue pre-load) ───────────────────────────────
    # GET: returns rich pricing + cost data for a known item ID
    #      e.g. GET /api/arbitrage/deals/fw-1/
    path(
        "arbitrage/deals/<str:item_id>/",
        ItemDetailView.as_view(),
        name="item_detail",
    ),
]