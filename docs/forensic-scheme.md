# Esquema de Protección Forense, Resiliencia y Control de Distribución

## Capas de Seguridad Forense (Protección en PDF)

### 1. Capa Primaria: Metadatos Inyectados
- **Ubicación:** `Producer`, `Keywords` y `Subject` en la estructura interna del PDF.
- **Codificación:** Base64 del string de datos (`WM-R2-{Base64}`).
- **Payload:** `purchaseId`, Hash SHA-256 del `buyerEmail` y Marca de tiempo (`ts`).

### 2. Capa Secundaria: Micro-variación Vectorial Determinística
- **Algoritmo:** Generación de un HASH SHA-256 a partir del `purchaseId`.
- **Operación:**
  - Toma los primeros 4 bytes del hash para derivar la coordenada X (porcentaje del ancho de página).
  - Toma los siguientes 4 bytes para derivar la coordenada Y (porcentaje del alto de página).
  - Inserta un elemento vectorial imperceptible (`drawCircle` de radio 0.2px y opacidad 0.01) en las coordenadas `(X, Y)`.
- **Propósito:** Sobrevivir a herramientas automatizadas de stripping/limpieza de metadatos mediante modificaciones a nivel del Stream de Objetos del PDF.

---

## Control de Acceso y Límites de Distribución

### 1. Control de Descargas por Token
- **Límite Estricto:** Máximo de 5 descargas por cada token de acceso único.
- **Expiración de Enlaces:** Los tokens expiran automáticamente a los 30 días de emitida la compra.
- **Manejo de Rejections:** Al alcanzar el límite o sobrepasar la fecha de expiración, el usuario es redirigido a una pantalla con un mensaje amigable para contactar al soporte/creadora.

### 2. Privacidad y Auditoría
- **Historial de Compras por Producto:** Registro en el panel con visualización de correos parcialmente enmascarados (ej. `j***z@gmail.com`) para protección de datos personales.
- **Trazabilidad de Marcas (`forensic_marks`):** Registro interno de cada descarga generada con su estampa única.

---

## Resiliencia y Tolerancia a Fallos (Edge-Cases)

### 1. Mitigación en Webhooks
- **Respuesta 200 OK Garantizada:** El endpoint de webhooks atrapa errores internos (falta de archivo máster en Cloudflare R2 o fallos en el servicio de correos Resend) enviando un código `200` a las tiendas externas (Shopify / Tiendanube) para prevenir bucles infinitos de reintentos.

### 2. Tabla `delivery_failures` y Gestión de Fallos
- **Auditoría de Incidentes:** Registro automático de errores de entrega con motivos categorizados (`MISSING_MASTER_FILE`, `EMAIL_SEND_FAILED`, etc.).
- **Panel de Administración (`/dashboard/failures`):** Interfaz amigable para la creadora que traduce códigos técnicos a estados comprensibles (ej. "Falta archivo PDF máster") para su resolución manual.