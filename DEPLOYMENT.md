# Ztemizinden Deployment

Tek jar build:

```bash
npm run build:jar
```

Olusan jar:

```bash
Ztemizinden-Backend/target/ztemizinden.jar
```

## Sunucu Yerlesimi

Ubuntu/Debian varsayimi:

```bash
sudo useradd --system --home /opt/ztemizinden --shell /usr/sbin/nologin ztemizinden
sudo mkdir -p /opt/ztemizinden /etc/ztemizinden /var/lib/ztemizinden/uploads
sudo chown -R ztemizinden:ztemizinden /opt/ztemizinden /var/lib/ztemizinden
```

Jar dosyasini sunucuya kopyalayin:

```bash
sudo cp Ztemizinden-Backend/target/ztemizinden.jar /opt/ztemizinden/ztemizinden.jar
sudo chown ztemizinden:ztemizinden /opt/ztemizinden/ztemizinden.jar
```

Env dosyasi:

```bash
sudo cp deploy/ztemizinden.env.example /etc/ztemizinden/ztemizinden.env
sudo nano /etc/ztemizinden/ztemizinden.env
sudo chmod 640 /etc/ztemizinden/ztemizinden.env
sudo chown root:ztemizinden /etc/ztemizinden/ztemizinden.env
```

Systemd:

```bash
sudo cp deploy/ztemizinden.service /etc/systemd/system/ztemizinden.service
sudo systemctl daemon-reload
sudo systemctl enable --now ztemizinden
sudo journalctl -u ztemizinden -f
```

Nginx reverse proxy:

```bash
sudo cp deploy/nginx-ztemizinden.conf /etc/nginx/sites-available/ztemizinden
sudo ln -s /etc/nginx/sites-available/ztemizinden /etc/nginx/sites-enabled/ztemizinden
sudo nginx -t
sudo systemctl reload nginx
```

WebSocket kontrolu:

```bash
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  -H "Sec-WebSocket-Version: 13" \
  https://DOMAININIZ/ws
```

Beklenen cevap `101 Switching Protocols`. `200`, `301`, `404`, `502` veya timeout gelirse canlı mesajlasma icin `/ws` reverse proxy ayari duzeltilmelidir.

Prod env icinde mutlaka degistirilecek alanlar:

- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `KEYCLOAK_ISSUER_URI`, `KEYCLOAK_JWK_SET_URI`, `KEYCLOAK_ADMIN_BASE_URL`
- `KEYCLOAK_ADMIN_CLIENT_SECRET`, `KEYCLOAK_PASSWORD_RESET_REDIRECT_URI`
- `APP_CORS_ALLOWED_ORIGIN_PATTERNS`
- `deploy/nginx-ztemizinden.conf` icindeki `server_name`

Frontend build edilmeden once `VITE_KEYCLOAK_URL`, `VITE_KEYCLOAK_REALM` ve
`VITE_KEYCLOAK_CLIENT_ID` production degerlerine ayarlanmalidir. Keycloak realm
SMTP ayari olmadan parola kurulum/sifirlama e-postalari gonderilemez.

Mevcut production realm'i uzlastirirken `KEYCLOAK_WEB_URL=https://DOMAININIZ`
verilmelidir; bu deger Keycloak redirect URI, web origin ve logout redirect
ayarlarindaki localhost degerlerini production adresiyle degistirir.

Mevcut yerel-auth kullanicilarinin ilk gecisinde yalnizca bir instance icin
`KEYCLOAK_MIGRATE_LEGACY_USERS=true` kullanin. Kuyruktaki tum kayitlarin
`completed_at` degeri dolduktan sonra flag'i tekrar `false` yapin.

## Database

Uygulama PostgreSQL bekler. Bos veritabani yeterli; Flyway migration'lari uygulama acilisinda calisir.

Ornek:

```sql
CREATE DATABASE ztemizinden;
CREATE USER ztemizinden WITH ENCRYPTED PASSWORD 'change-me';
GRANT ALL PRIVILEGES ON DATABASE ztemizinden TO ztemizinden;
```

## Maintly Production Keycloak

Production kimlik servisi ayni sunucuda Docker Compose ile calisir, fakat
yalnizca loopback portlarina acilir:

- Keycloak uygulamasi: `127.0.0.1:8081`
- Keycloak yonetim/health: `127.0.0.1:9000`
- Dis adres: `https://maintly.net/auth`

Ilk kurulumda asagidaki dosyalar sunucuya yerlestirilir:

```text
/opt/ztemizinden/keycloak/docker-compose.yml
/opt/ztemizinden/keycloak/realm/realm-production.json
/opt/ztemizinden/keycloak/themes/maintly
/etc/ztemizinden/keycloak.env
/etc/nginx/snippets/maintly-keycloak.conf
```

`keycloak.env` sadece root tarafindan okunabilmeli (`0600`). Ayni
`KEYCLOAK_ADMIN_CLIENT_SECRET` degeri backend env dosyasinda da bulunmalidir.
Production realm dosyasi bilinen parolali demo kullanicilari icermez.

Health kontrolleri:

```bash
curl -fsS http://127.0.0.1:9000/health/ready
curl -fsS https://maintly.net/auth/realms/ztemizinden/.well-known/openid-configuration
```

Frontend JAR build'i production kimlik adresiyle alinmalidir:

```bash
VITE_API_URL=/api \
VITE_KEYCLOAK_URL=https://maintly.net/auth \
VITE_KEYCLOAK_REALM=ztemizinden \
VITE_KEYCLOAK_CLIENT_ID=ztemizinden-web \
npm run build:jar
```

Deploy workflow'u localhost Keycloak adresi iceren bir frontend bundle'ini
reddeder. Canli deploy oncesinde `/etc/ztemizinden/ztemizinden.env` ve
`/etc/ztemizinden/keycloak.env` dosyalari hazir olmalidir.

Workflow ayrica Maintly login temasini Keycloak container'ina baglar, realm'in
`loginTheme` ayarini `maintly` yapar ve aktif Nginx sitesini yedekleyerek HTTP/2,
gzip ve immutable asset cache ayarlariyla gunceller. Nginx yedegi
`/var/backups/maintly/nginx-ztemizinden.before-deploy.conf` altinda tutulur.
