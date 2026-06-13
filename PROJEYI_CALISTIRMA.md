# Projeyi Ayaga Kaldirma Notu

## 1. Backend

```bash
cd "/Users/mustafacil/x uygulaması deneme/backend"
venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Backend kontrol:

http://192.168.1.230:8000/health

Telefonda Safari'den acinca sunu gormelisin:

```json
{"status":"ok"}
```

## 2. Admin panel

```bash
cd "/Users/mustafacil/x uygulaması deneme/admin-panel"
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Admin panel:

http://127.0.0.1:3000

## 3. Mobil Expo Go

```bash
cd "/Users/mustafacil/x uygulaması deneme/frontend"
npm run start -- --host lan
```

Expo terminalinde cikan QR kodu Expo Go ile tara.

Uygulama logunda sunu gormelisin:

```text
LOG  [API BASE] http://192.168.1.230:8000
```

Eger eski IP veya 127.0.0.1 gorunurse cache temiz baslat:

```bash
npm run start -- --host lan --clear
```

Onemli not: `192.168.1.230` Wi-Fi IP adresin. Modem/Wi-Fi degisirse bu IP degisebilir. O zaman Expo'nun gosterdigi yeni `exp://...:8081` adresindeki IP'yi kullan; backend health adresi de ayni IP ile soyle olur:

```text
http://YENI_IP:8000/health
```
