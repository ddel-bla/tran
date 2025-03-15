FROM python:3.11

ENV PYTHONUNBUFFERED=1

RUN apt-get update && \
    apt-get install -y --no-install-recommends postgresql-client && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . ./

CMD ["gunicorn", "--certfile=/etc/ssl/certs/cert.crt", "--keyfile=/etc/ssl/certs/cert.key", "--bind", "0.0.0.0:443", "api.wsgi:application"]



