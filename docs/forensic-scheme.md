# Esquema de Protección Forense e Identificación

## Capas de Seguridad Implementadas

### 1. Capa Primaria: Metadatos Inyectados
- **Ubicación:** `Producer`, `Keywords` y `Subject` en la estructura de objetos del PDF.
- **Codificación:** Base64 del string de datos (`WM-R2-{Base64}`).
- **Payload:** `purchaseId`, Hash SHA-256 del `buyerEmail` y Marca de tiempo (`ts`).

### 2. Capa Secundaria: Micro-variación Vectorial Determinística
- **Algoritmo:** Generación de un HASH SHA-256 a partir del `purchaseId`.
- **Operación:**
  - Toma los primeros 4 bytes del hash para derivar la coordenada X (porcentaje del ancho de página).
  - Toma los siguientes 4 bytes para derivar la coordenada Y (porcentaje del alto de página).
  - Inserta un elemento vectorial imperceptible (`drawCircle` de radio 0.2px y opacidad 0.01) en las coordenadas `(X, Y)`.
- **Propósito:** Sobrevivir a herramientas automatizadas de stripping/limpieza de metadatos mediante modificaciones a nivel del Stream de Objetos del PDF.