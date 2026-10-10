# Projeyi Ayaga Kaldirma Notu

Butun komutlar proje kok dizininden (`x uygulaması deneme/`) calistirilir.
Uc ayri terminal ac: backend, admin panel, mobil.

## 0. Ilk kurulum (bir kere)

```bash
make -C backend venv          # backend/venv olusturur, requirements.txt kurar
(cd admin-panel && npm install)
(cd frontend && npm install)
```

Onemli: proje klasorunu tasirsan/yeniden adlandirirsan `backend/venv` bozulur
(script'ler mutlak yolu icerir). `rm -rf backend/venv && make -C backend venv` ile yenile.

## 1. Backend

```bash
make -C backend run
# veya: cd backend && venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend kontrol: http://127.0.0.1:8000/health → `{"status":"ok", ...}`

Lokalde SQLite (`backend/dev.db`) kullanir, Redis olmadan da calisir
(`redis: unavailable (fallback to local)` normaldir).

Telefondan kontrol icin Mac'in Wi-Fi IP'sini ogren:

```bash
ipconfig getifaddr en0
```

Telefonda Safari'den `http://<WIFI_IP>:8000/health` acilmali.

## 2. Admin panel

```bash
cd admin-panel && npm run dev -- --hostname 127.0.0.1 --port 3000
```

Admin panel: http://127.0.0.1:3000

3000 portu baska bir projede doluysa `--port 3001` ver; admin panel backend'e
`http://127.0.0.1:8000/api` uzerinden gider, portu onemli degil.

## 3. Mobil Expo Go

```bash
cd frontend && npm run start -- --host lan
```

Expo terminalinde cikan QR kodu Expo Go ile tara.

Uygulama API adresini Expo'nun LAN host'undan otomatik cikarir. Uygulama logunda
sunu gormelisin (IP, `ipconfig getifaddr en0` ile ayni olmali):

```text
LOG  [API BASE] http://<WIFI_IP>:8000
```

Eger eski IP veya 127.0.0.1 gorunurse cache temiz baslat:

```bash
npm run start -- --host lan --clear
```

Wi-Fi IP'si modem/ag degisince degisir; hicbir yerde elle IP yazmaya gerek yok,
Expo'nun gosterdigi `exp://<IP>:8081` adresindeki IP her zaman gecerli olandir.

## Durdurma

```bash
pkill -f "uvicorn app.main"; pkill -f "next dev"; pkill -f "expo start"
```
