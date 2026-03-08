"""Z24 Bridge SHM — FastAPI Backend."""

import os
import numpy as np
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from scipy.io import loadmat
import io

from .ml.inference import BridgeHealthAnalyzer
from .ml.damage_info import DAMAGE_INFO, T_DESIGN, K_DEGRADE

# --- Configuration ---
# In Docker: /app/models/  |  Locally: fallback to env var or relative path
MODELS_DIR = os.environ.get(
    "MODELS_DIR",
    str(Path(__file__).parent.parent.parent.parent / "models")
)

# --- Initialize app ---
app = FastAPI(
    title="Z24 Bridge SHM API",
    description="AI-powered structural health monitoring for the Z24 bridge",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://z24-bridge-structural-health-monitoring.vercel.app",
        "*",  # Allow all for demo purposes
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ============ MODEL LOADING WITH ERROR HANDLING ============

import logging
from contextlib import asynccontextmanager

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Global state
analyzer = None
startup_error = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Async context manager for startup and shutdown events.
    This ensures proper model loading and error handling.
    """
    global analyzer, startup_error
    
    # ========== STARTUP ==========
    logger.info("=" * 70)
    logger.info("STARTUP: Z24 Bridge SHM Backend")
    logger.info("=" * 70)
    
    try:
        logger.info(f"MODELS_DIR: {MODELS_DIR}")
        logger.info("Initializing BridgeHealthAnalyzer...")
        
        # Load models
        analyzer = BridgeHealthAnalyzer(MODELS_DIR)
        
        logger.info("✓ WaveNet: LOADED")
        logger.info("✓ InceptionTime: LOADED")
        logger.info("✓ MiniRocket: LOADED")
        logger.info("=" * 70)
        logger.info("✓ ALL MODELS READY - ACCEPTING PREDICTIONS")
        logger.info("=" * 70)
        startup_error = None
        
    except Exception as e:
        startup_error = str(e)
        logger.error("=" * 70)
        logger.error(f"✗ MODEL LOADING FAILED: {e}")
        logger.error("=" * 70)
        logger.error("Stack trace:", exc_info=True)
        # Don't crash - let app continue so we can see error
    
    yield
    
    # ========== SHUTDOWN ==========
    logger.info("Shutting down application...")

# UPDATE FastAPI app initialization - ADD lifespan parameter:
app = FastAPI(
    title="Z24 Bridge SHM API",
    description="AI-powered structural health monitoring for the Z24 bridge",
    version="1.0.0",
    lifespan=lifespan,  # ← ADD THIS LINE!
)

# ============================================================
# API Endpoints
# ============================================================

@app.get("/api/health")
async def health_check():
    """
    System health check - frontend calls this to verify backend is ready.
    Returns whether models are loaded and ready for predictions.
    """
    if analyzer is None:
        # Models not loaded yet
        return {
            "status": "degraded",
            "models_ready": False,
            "error": startup_error or "Models not initialized",
            "server_time": str(datetime.now()),
        }
    
    try:
        model_status = analyzer.get_status()
        return {
            "status": "healthy",
            "models_ready": True,
            "model_status": model_status,
            "error": None,
            "server_time": str(datetime.now()),
        }
    except Exception as e:
        return {
            "status": "degraded",
            "models_ready": False,
            "error": str(e),
            "server_time": str(datetime.now()),
        }


@app.get("/api/experiment/overview")
async def experiment_overview():
    """Return Z24 experiment information."""
    return {
        "bridge_name": "Z24 Bridge",
        "location": "Koppigen-Utzenstorf, Switzerland",
        "type": "Post-tensioned concrete box-girder highway bridge",
        "span": "60m (3 spans: 14m + 30m + 14m)",
        "built": 1963,
        "demolished": 1998,
        "sensors": 291,
        "damage_scenarios": 17,
        "test_period": "August-November 1998",
        "description": (
            "The Z24 Bridge was a post-tensioned concrete highway bridge in Switzerland "
            "that was scheduled for demolition to make way for a new railway line. Before "
            "demolition, researchers conducted a comprehensive Progressive Damage Test (PDT), "
            "systematically introducing 15 different damage scenarios while continuously "
            "monitoring the bridge with 291 sensors. This created one of the most valuable "
            "real-world datasets for structural health monitoring research."
        ),
    }


@app.get("/api/experiment/damage-scenarios")
async def damage_scenarios():
    """Return all 17 damage scenario details."""
    return {
        "scenarios": [
            {
                "class": c,
                "name": info['name'],
                "type": info['type'],
                "dsi": info['dsi'],
                "severity": info['severity'],
                "rul_years": round(T_DESIGN * (1 - info['dsi']) ** K_DEGRADE, 1),
            }
            for c, info in DAMAGE_INFO.items()
        ]
    }


@app.get("/api/models/results")
async def model_results():
    """Return training results for all models."""
    return {
        "models": {
            "WaveNet v4": {
                "test_accuracy": 52.94,
                "parameters": 227000,
                "architecture": "Dilated causal convolutions, 2 stacks x 8 layers",
                "training_time": "~37 min (68 epochs x 33s)",
            },
            "MiniRocket": {
                "test_accuracy": 37.61,
                "parameters": "N/A (feature extraction)",
                "architecture": "10K random kernels + Ridge classifier",
                "training_time": "~77 seconds",
            },
            "InceptionTime": {
                "test_accuracy": 57.04,
                "parameters": 491857,
                "architecture": "Multi-scale Inception blocks with residual connections",
                "training_time": "~93 min (71 epochs x 78s)",
            },
        },
        "ensembles": {
            "WaveNet + MiniRocket (LogReg)": 57.40,
            "WaveNet + InceptionTime (avg)": 61.32,
            "All 3 Models (LogReg stack)": 63.10,
        },
        "hierarchical": {
            "group_accuracy": 83.42,
            "final_accuracy": 62.21,
        },
        "best_result": 63.10,
        "random_baseline": 5.88,
    }


@app.post("/api/predict/analyze")
async def analyze_signal(file: UploadFile = File(...)):
    """Upload a .mat or .csv file and get damage classification + RUL estimate."""
    if analyzer is None:
        raise HTTPException(status_code=503, detail="Models not loaded yet")

    filename = file.filename.lower()
    contents = await file.read()

    try:
        if filename.endswith('.mat'):
            mat_data = loadmat(io.BytesIO(contents))
            data_keys = [k for k in mat_data.keys() if not k.startswith('_')]
            if not data_keys:
                raise HTTPException(status_code=400, detail="No data found in .mat file")
            
            raw = mat_data[data_keys[0]]
            # Handle different .mat shapes: (samples, channels), (channels, samples), etc.
            if raw.ndim == 1:
                signal = raw.astype(np.float32)
            elif raw.ndim == 2:
                # Use first column/row — pick the longer dimension as samples
                if raw.shape[0] >= raw.shape[1]:
                    signal = raw[:, 0].astype(np.float32)
                else:
                    signal = raw[0, :].astype(np.float32)
            else:
                signal = raw.flatten().astype(np.float32)

        elif filename.endswith('.csv'):
            text = contents.decode('utf-8')
            signal = np.array([float(x.strip()) for x in text.strip().split('\n')
                              if x.strip()], dtype=np.float32)
        else:
            raise HTTPException(status_code=400,
                              detail="Unsupported file format. Use .mat or .csv")

        if len(signal) < 1000:
            raise HTTPException(status_code=400,
                              detail=f"Signal too short ({len(signal)} samples). Need at least 1000.")

        result = analyzer.predict(signal)
        result['signal_length'] = len(signal)
        result['filename'] = file.filename
        return result

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.get("/api/predict/demo")
async def demo_prediction():
    """Run prediction on a synthetic demo signal."""
    if analyzer is None:
        raise HTTPException(status_code=503, detail="Models not loaded yet")

    try:
        np.random.seed(42)
        t = np.linspace(0, 654, 65410)
        signal = (0.5 * np.sin(2 * np.pi * 4.5 * t) +
                  0.3 * np.sin(2 * np.pi * 9.2 * t) +
                  0.1 * np.random.randn(len(t))).astype(np.float32)

        result = analyzer.predict(signal)
        result['signal_length'] = len(signal)
        result['filename'] = 'demo_signal'
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Demo failed: {str(e)}")
