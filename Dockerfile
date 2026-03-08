FROM python:3.11-slim

WORKDIR /app

# Install PyTorch CPU-only first (much smaller than default CUDA build)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Copy and install remaining dependencies
COPY webapp/backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy trained models
COPY models/ ./models/

# Copy backend source
COPY webapp/backend/ ./webapp/backend/

EXPOSE 8000

WORKDIR /app/webapp/backend
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
