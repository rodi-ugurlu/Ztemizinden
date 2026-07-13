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
VITE_KEYCLOAK_URL=http://localhost:8081
VITE_KEYCLOAK_REALM=ztemizinden
VITE_KEYCLOAK_CLIENT_ID=ztemizinden-web
```

`cp .env.example .env.local` ile local frontend env dosyasi olusturabilirsiniz. Vite dev server `/api` ve `/uploads` isteklerini `http://localhost:8080` backendine proxy'ler.

## Backend

Backend proje klasoru: `Ztemizinden-Backend`.

```bash
cd Ztemizinden-Backend
docker compose up -d
cd ..
KEYCLOAK_IMPORT_DEMO_USERS=true npm run keycloak:reconcile
cd Ztemizinden-Backend
./mvnw spring-boot:run
```

Local Keycloak kullanicilari:

- `customer@demo.com / Demo123!`
- `service@demo.com / Demo123!`
- `admin@demo.com / Demo123!`

## V1 Notlari

- API security varsayilan olarak acik: `APP_SECURITY_ENABLED=true`.
- Tek kimlik ve parola kaynagi Keycloak'tir; backend token uretmez veya parola saklamaz.
- Frontend Authorization Code + PKCE kullanir ve tokenlari local/session storage'a yazmaz.
- Backend RS256/JWK token imzasini, issuer'i ve `ztemizinden-api` audience'ini dogrular.
- Kayit endpoint'leri domain kaydini olusturur ve Keycloak Admin API ile kimligi provision eder.
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
npm run keycloak:verify
npm run build:jar
cd Ztemizinden-Backend && ./mvnw test
```
