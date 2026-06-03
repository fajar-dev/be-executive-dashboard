# Panduan Standar Kode dan Arsitektur Aplikasi (Backend)

Dokumen ini berisi standar penulisan kode, arsitektur, dan struktur folder untuk proyek *backend* (menggunakan Hono, TypeScript, dan Clean Architecture). Harap ikuti pedoman ini saat membuat fitur atau modul baru.

## 1. Arsitektur dan Struktur Folder

Aplikasi menggunakan pendekatan **Feature-based Structure** yang digabungkan dengan **Fully Layered Architecture** di dalam setiap modulnya. 

Setiap fitur/modul baru (misalnya `general`, `user`, dsb.) harus ditempatkan di dalam `src/modules/<nama_fitur>/` dengan struktur folder baku sebagai berikut:

```text
src/modules/<nama_fitur>/
├── controllers/          # Layer pengatur HTTP request/response
│   └── <nama_fitur>.controller.ts
├── services/             # Layer berisi *business logic*
│   └── <nama_fitur>.service.ts
├── repositories/         # Layer komunikasi langsung dengan database
│   └── <nama_fitur>.repository.ts
├── interfaces/           # Layer abstraksi (interface) untuk service dan repository
│   ├── <nama_fitur>.service.interface.ts
│   └── <nama_fitur>.repository.interface.ts
├── serializers/          # Layer formating *output* respons ke *client* (opsional)
│   └── <nama_fitur>.serialize.ts
└── <nama_fitur>.module.ts # File pusat untuk Dependency Injection
```

## 2. Dependency Injection (DI)

Jangan melakukan inisialisasi class secara manual di dalam controller, service, maupun routing utama. Gunakan Dependency Injection (DI) melalui *constructor* dan kumpulkan *wiring*-nya di dalam file `.module.ts`.

### Aturan Injeksi
- **Controller** menerima interaksi abstraksi service (menggunakan Interface).
- **Service** menerima interaksi abstraksi repository (menggunakan Interface).
- **Repository** menerima pool database (seperti `nisPool`, `nusafiberPool`, dll).

### Contoh File `<nama_fitur>.module.ts`

```typescript
import { Pool } from 'mysql2/promise'
import { FeatureRepository } from './repositories/feature.repository'
import { FeatureService } from './services/feature.service'
import { FeatureController } from './controllers/feature.controller'

export class FeatureModule {
    public readonly controller: FeatureController
    public readonly service: FeatureService
    public readonly repository: FeatureRepository

    constructor(dbPool: Pool) {
        this.repository = new FeatureRepository(dbPool)
        this.service = new FeatureService(this.repository)
        this.controller = new FeatureController(this.service)
    }
}
```

## 3. Definisi Route
- File *routing* (seperti `direksi.routes.ts`) difokuskan hanya untuk mendaftarkan HTTP Endpoint.
- Hindari inisiasi (*new Object()*) *dependency* berat di dalam file routes. Sebaliknya, panggil dan bangun kelas modul (`new FeatureModule(db)`) di dalam fungsi factory route tersebut.
- Middleware (seperti `authMid`) dapat di-*passing* sebagai parameter ke fungsi setup routes dari router utama (`api.ts`).

## 4. Prinsip SOLID dan Clean Code
- **S (Single Responsibility):** Controller hanya mengurus HTTP Context (parameter, validasi, memanggil service, mengirim output). Service mengurus manipulasi data (*logic* bisnis). Repository murni berisi query SQL.
- **D (Dependency Inversion):** Implementasikan *interface* (seperti `IFeatureService`) agar antar-layer tidak *tightly-coupled*.
- **DRY (Don't Repeat Yourself):** Jika ada logika atau kalkulasi yang dipakai berulang di berbagai fungsi/modul (seperti perhitungan persentase tren atau manipulasi tanggal), pindahkan ke dalam direktori `src/core/helpers/` (misal: `TrendHelper`, `DateHelper`). Jangan biarkan ada kode kalkulasi yang di-_copy-paste_.
- **Sentralisasi Serializer:** Gunakan *method generic* di *Serializer* (seperti `metric(data: any)`) untuk memoles struktur *output* yang punya format berulang (seperti `{ value, trend, percentage, period }`). Hindari membuat *method* duplikat untuk setiap metrik jika isinya persis sama.

## 5. Aturan Penulisan Lanjutan
- **Relative Path:** Perhatikan level direktori saat melakukan import (`../` atau `../../`). Gunakan *compiler* TypeScript untuk memvalidasi path Anda.
- **Tipe Data (Typing):** Hindari penggunaan `any` secara implisit. Tentukan *type* setiap parameter dan *return value* untuk menjaga *safety* TypeScript (terutama saat *mapping* atau `reduce` data).
- **JSDoc Comments:** Setiap method di Controller, Service, dan Repository harus dilengkapi dengan blok komentar JSDoc (`/** ... */`) yang mendeskripsikan secara jelas kegunaan fungsi, daftar `@param`, dan `@returns`.
- **Format Respons:** Gunakan `ApiResponse.success` (atau formatter sejenis) yang disediakan di folder `core` untuk memastikan format JSON yang terkirim ke *client* selalu seragam.
- **Validasi Cerdas:** Hindari membuat validasi parameter yang redundan di level *Controller* jika nilai tersebut sudah memiliki *default value* yang aman atau sudah ditangani secara *fallback* (*graceful fail*) di dalam fungsi *Helper*/*Service*.
