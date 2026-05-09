# Ztemizinden V1

Kapali beta hedefli bakim ve servis pazaryeri uygulamasi.

## Local Frontend

```bash
npm install
npm run dev
```

Varsayilan adresler:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080/api`
- Keycloak: `http://localhost:8081`

Frontend env:

```bash
VITE_API_URL=http://localhost:8080/api
VITE_KEYCLOAK_URL=http://localhost:8081
VITE_KEYCLOAK_REALM=ztemizinden
VITE_KEYCLOAK_CLIENT_ID=ztemizinden-frontend
```

## Backend

Backend proje klasoru: `Ztemizinden-Backend`.

```bash
cd Ztemizinden-Backend
docker compose up -d
./mvnw spring-boot:run
```

Local Keycloak kullanicilari:

- `customer@demo.com / demo123`
- `service@demo.com / demo123`
- `admin@demo.com / demo123`

## V1 Notlari

- API security varsayilan olarak acik: `APP_SECURITY_ENABLED=true`.
- Demo ticket/asset/provider sunum verisi V7 migration ile temizlenir; ekranlar kullanicinin ekledigi gercek backend verisiyle baslar.
- Upload dosyalari backend local diskte `APP_UPLOAD_DIR` altinda tutulur, varsayilan `uploads`.
- Vercel frontend kullanilacaksa `VITE_API_URL` ngrok backend adresine set edilir.
- CORS icin backend env: `APP_CORS_ALLOWED_ORIGIN_PATTERNS=http://localhost:*,http://127.0.0.1:*,https://your-vercel-domain.vercel.app,https://*.ngrok-free.app`

## Dogrulama

```bash
npm run lint
npm run build
cd Ztemizinden-Backend && ./mvnw test
```
