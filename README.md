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

Frontend env:

```bash
VITE_API_URL=/api
```

`cp .env.example .env.local` ile local frontend env dosyasi olusturabilirsiniz. Vite dev server `/api` ve `/uploads` isteklerini `http://localhost:8080` backendine proxy'ler.

## Backend

Backend proje klasoru: `Ztemizinden-Backend`.

```bash
cd Ztemizinden-Backend
docker compose up -d postgres
./mvnw spring-boot:run
```

Local internal JWT kullanicilari:

- `customer@demo.com / demo123`
- `service@demo.com / demo123`
- `admin@demo.com / demo123`

## V1 Notlari

- API security varsayilan olarak acik: `APP_SECURITY_ENABLED=true`.
- Auth varsayilan olarak backend internal JWT kullanir; Keycloak gecici olarak devre disidir.
- Backend artik Keycloak'a bagli degil; ngrok testlerinde PostgreSQL + backend yeterlidir.
- JWT icin backend env: `APP_JWT_SECRET`, `APP_JWT_ISSUER`, `APP_JWT_EXPIRATION_MINUTES`.
- Demo ticket/asset/provider sunum verisi V7 migration ile temizlenir; ekranlar kullanicinin ekledigi gercek backend verisiyle baslar.
- Upload dosyalari backend local diskte `APP_UPLOAD_DIR` altinda tutulur, varsayilan `uploads`.
- Tek jar deploy icin frontend varsayilan olarak ayni domaindeki `/api` adresini kullanir.
- Ayrik frontend kullanilacaksa `VITE_API_URL` backend adresine set edilir.
- CORS icin backend env: `APP_CORS_ALLOWED_ORIGIN_PATTERNS=http://localhost:*,http://127.0.0.1:*,https://*.vercel.app,https://*.ngrok-free.app,https://*.ngrok.app,https://*.ngrok.io`

## Tek Jar Build

```bash
npm run build:jar
```

Bu komut React uygulamasini build eder, Spring Boot static kaynaklarina kopyalar ve `Ztemizinden-Backend/target/ztemizinden.jar` uretir. Sunucu notlari icin `DEPLOYMENT.md` dosyasina bakin.

## Dogrulama

```bash
npm run lint
npm run build
npm run build:jar
cd Ztemizinden-Backend && ./mvnw test
```
