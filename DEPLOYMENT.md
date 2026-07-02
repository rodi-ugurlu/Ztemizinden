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
- `APP_JWT_SECRET`
- `APP_CORS_ALLOWED_ORIGIN_PATTERNS`
- `deploy/nginx-ztemizinden.conf` icindeki `server_name`

## Database

Uygulama PostgreSQL bekler. Bos veritabani yeterli; Flyway migration'lari uygulama acilisinda calisir.

Ornek:

```sql
CREATE DATABASE ztemizinden;
CREATE USER ztemizinden WITH ENCRYPTED PASSWORD 'change-me';
GRANT ALL PRIVILEGES ON DATABASE ztemizinden TO ztemizinden;
```
