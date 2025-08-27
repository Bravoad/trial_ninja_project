FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends build-essential curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel \
 && pip install --no-cache-dir -r requirements.txt

# Шим для устаревшего PyCharm pip helper: подставляем distutils через setuptools._distutils
RUN python -c "import site, pathlib; p=pathlib.Path(site.getsitepackages()[0])/'sitecustomize.py'; \
    p.write_text('import sys\\ntry:\\n    import setuptools._distutils as _du\\n    sys.modules[\\'distutils\\'] = _du\\nexcept Exception:\\n    pass\\n')"

COPY . .
EXPOSE 8000
# свой CMD/command оставь как было (uvicorn/runserver)
