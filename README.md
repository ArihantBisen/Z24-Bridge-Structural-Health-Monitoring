# AI-Assisted Structural Health Monitoring of the Z24 Bridge

**Deep Learning-Based Damage Classification, Remaining Useful Life Estimation, and Real-Time Web-Based Analysis Platform**

Final Year Capstone Project

---

## Project Overview

This project applies deep learning to the Z24 Bridge dataset for structural health monitoring (SHM). It covers the full pipeline from raw sensor data processing to a real-time web dashboard.

## Notebooks — Open in Colab

| Notebook | Description | Link |
|----------|-------------|------|
| 01 — Data Pipeline | Data loading, preprocessing, feature extraction | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/ArihantBisen/Z24-Bridge-Structural-Health-Monitoring/blob/main/notebooks/01_DataPipeline.ipynb) |
| 02 — WaveNet Training | 1D-WaveNet model training & evaluation | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/ArihantBisen/Z24-Bridge-Structural-Health-Monitoring/blob/main/notebooks/02_WaveNet_Training.ipynb) |
| 03 — MiniRocket Training | MiniRocket classifier training & evaluation | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/ArihantBisen/Z24-Bridge-Structural-Health-Monitoring/blob/main/notebooks/03_MiniRocket_Training.ipynb) |
| 04 — InceptionTime Training | InceptionTime model training & evaluation | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/ArihantBisen/Z24-Bridge-Structural-Health-Monitoring/blob/main/notebooks/04_InceptionTime_Training.ipynb) |
| 05 — Lifespan Estimation | Remaining Useful Life (RUL) estimation | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/ArihantBisen/Z24-Bridge-Structural-Health-Monitoring/blob/main/notebooks/05_Lifespan_Estimation.ipynb) |

## Repository Structure

```
├── notebooks/          # Jupyter notebooks (ML pipeline, training, evaluation)
├── figures/            # Generated plots and visualizations
├── models/             # Trained model weights (.pth, .pkl)
└── webapp/             # Real-time web-based analysis platform
    ├── backend/        # FastAPI backend with ML inference
    └── frontend/       # React + Vite frontend dashboard
```

## Models

| Model | Task | Accuracy |
|-------|------|----------|
| WaveNet (v4) | Damage Classification | - |
| MiniRocket | Damage Classification | - |
| InceptionTime | Damage Classification | - |
| Lifespan Estimator | Remaining Useful Life | - |

## Dataset

The project uses the **Z24 Bridge dataset** (KU Leuven), containing vibration measurements across 17 damage states.

> Raw data files are not included in this repository due to size constraints.

## Web App

The web app provides real-time inference via a FastAPI backend and a React dashboard.

### Run Backend
```bash
cd webapp/backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Run Frontend
```bash
cd webapp/frontend
npm install
npm run dev
```
