#!/usr/bin/env bash
set -e

# If Laravel isn't installed yet, just start Apache
if [ ! -f artisan ]; then
  echo "artisan not found - starting Apache without Laravel bootstrap."
  exec "$@"
fi

echo "Starting Smoodify container..."

# Ensure writable dirs exist
mkdir -p storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache || true

# Clear caches (safe)
php artisan config:clear || true
php artisan route:clear || true
php artisan view:clear || true

# ---- Wait for MySQL (docker-compose local) ----
if [ -n "${DB_HOST:-}" ]; then
  echo "Waiting for MySQL at ${DB_HOST}:${DB_PORT:-3306}..."
  ATTEMPTS=60
  until php -r "
    \$host=getenv('DB_HOST');
    \$port=getenv('DB_PORT') ?: 3306;
    \$db=getenv('DB_DATABASE');
    \$user=getenv('DB_USERNAME');
    \$pass=getenv('DB_PASSWORD');
    try {
      new PDO(\"mysql:host=\$host;port=\$port;dbname=\$db\", \$user, \$pass);
      echo \"OK\";
    } catch (Exception \$e) { exit(1); }
  " >/dev/null 2>&1; do
    ATTEMPTS=$((ATTEMPTS-1))
    if [ $ATTEMPTS -le 0 ]; then
      echo "MySQL not ready after waiting. Starting anyway."
      break
    fi
    sleep 2
  done
  echo "MySQL check done."
fi

# Run migrations AFTER DB is reachable
php artisan migrate --force || true

exec "$@"
