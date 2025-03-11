FROM debian:bullseye-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends  apache2 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN a2enmod ssl

RUN mkdir -p /var/log/apache2 && touch /var/log/apache2/error.log

COPY public_html /var/www/html/
COPY certs /etc/ssl/certs/
COPY pong-ssl.conf /etc/apache2/sites-available/pong-ssl.conf

RUN a2ensite pong-ssl

EXPOSE 80 443

CMD ["apache2ctl", "-D", "FOREGROUND"]