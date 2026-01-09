# ---- 1) PHP dependencies stage (Composer) ----
FROM composer:2 AS backend
WORKDIR /app

# Copy composer files first for caching
COPY composer.json composer.lock ./
RUN composer install --no-dev --prefer-dist --no-interaction --no-scripts

# Copy the rest of Laravel app
COPY . .

# Optimize autoload
RUN composer dump-autoload --optimize


# ---- 2) Frontend build stage (Node + php-cli for wayfinder) ----
FROM node:20-alpine AS frontend
WORKDIR /app

# Install php-cli so Vite plugins that call `php artisan ...` work
RUN apk add --no-cache \
    php83 php83-cli php83-phar php83-openssl php83-mbstring php83-json php83-tokenizer php83-ctype \
    php83-xml php83-dom php83-simplexml \
    php83-session \
    php83-pdo php83-pdo_sqlite php83-sqlite3 \
 && ln -sf /usr/bin/php83 /usr/bin/php \
 && php -m | grep -E "PDO|pdo_sqlite|sqlite3|dom|xml|session" || true \
 && php -v



# Bring in the full Laravel app (including vendor/) so artisan works
COPY --from=backend /app /app

# Build-time env so artisan can boot without real secrets or mysql
RUN cp -n .env.example .env \
 && touch /tmp/database.sqlite \
 && APP_ENV=production DB_CONNECTION=sqlite DB_DATABASE=/tmp/database.sqlite php artisan key:generate --force \
 && APP_ENV=production DB_CONNECTION=sqlite DB_DATABASE=/tmp/database.sqlite php artisan wayfinder:generate --with-form -v

# Install node deps and build assets
RUN npm ci

RUN APP_ENV=production DB_CONNECTION=sqlite DB_DATABASE=/tmp/database.sqlite npm run build

# Remove temp .env so it never leaks into final image
RUN rm -f .env



# ---- 3) Runtime stage (Apache + PHP) ----
FROM php:8.3-apache

# Install system deps + PHP extensions needed for Laravel + MySQL + Redis
RUN apt-get update && apt-get install -y \
    git unzip libzip-dev libpng-dev libonig-dev libxml2-dev \
  && docker-php-ext-install pdo_mysql mbstring zip \
  && pecl install redis \
  && docker-php-ext-enable redis \
  && a2enmod rewrite headers \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html

# Configure Apache to serve Laravel /public
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
  /etc/apache2/sites-available/000-default.conf \
  /etc/apache2/apache2.conf \
  /etc/apache2/conf-available/*.conf

# Copy app code (with vendor) from backend stage
COPY --from=backend /app /var/www/html

# Copy built frontend assets into public/build
COPY --from=frontend /app/public/build /var/www/html/public/build

# Entrypoint for runtime tasks
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Permissions for Laravel storage/cache
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["apache2-foreground"]
