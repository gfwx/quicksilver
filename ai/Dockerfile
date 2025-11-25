# Multi-stage build for FastAPI - optimized for size and multi-platform
FROM python:3.11-slim as builder

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Create requirements without torch to prevent reinstallation
RUN grep -v "^torch==" requirements.txt > requirements-no-torch.txt

# Install PyTorch using extra-index-url to prioritize CPU builds
# This works for both amd64 and arm64 platforms
RUN pip install --no-cache-dir \
    torch==2.8.0 \
    --extra-index-url https://download.pytorch.org/whl/cpu

# Install other dependencies (torch already excluded)
RUN pip install --no-cache-dir -r requirements-no-torch.txt

# Verify torch installation and print info
RUN python -c "import torch; print(f'PyTorch {torch.__version__}'); print(f'CUDA available: {torch.cuda.is_available()}'); import sys; print(f'Platform: {sys.platform}')" && \
    du -sh /usr/local/lib/python3.11/site-packages/torch 2>/dev/null || true

# Set HuggingFace cache to a specific location
ENV HF_HOME=/app/.cache/huggingface

# Download sentence transformer model at build time to HF_HOME
RUN mkdir -p /app/.cache/huggingface && \
    python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"

# Clean up pip cache and other unnecessary files in builder
RUN rm -rf /root/.cache/pip && \
    find /usr/local/lib/python3.11/site-packages -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true

# Final stage - minimal runtime image
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    HF_HOME=/app/.cache/huggingface

WORKDIR /app

# Copy Python packages from builder (no cache!)
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin/uvicorn /usr/local/bin/uvicorn

# Copy only the HuggingFace model cache (not pip cache or other junk)
COPY --from=builder /app/.cache/huggingface /app/.cache/huggingface

# Copy application code
COPY . .

# Create data directory for LanceDB
RUN mkdir -p /app/data

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/api')"

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
