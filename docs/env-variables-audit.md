# Auditoría de Variables de Entorno y Manejo de Secretos

Este documento detalla la clasificación de variables de entorno para evitar filtraciones de credenciales privadas al cliente.

---

## 🔒 Clasificación de Variables

### 1. Variables Públicas (Seguras para el Cliente / Navegador)
Tienen el prefijo `NEXT_PUBLIC_` y Next.js las empaqueta para el cliente.

| Variable | Descripción |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima pública de Supabase |
| `NEXT_PUBLIC_APP_URL` | URL base del proyecto |

---

### 2. Variables Privadas (Exclusivas del Servidor — ¡NUNCA USAR NEXT_PUBLIC_!)
Solo accesibles en Server Components, Server Actions y API Routes.

| Variable | Descripción | Riesgo si se filtra |
| :--- | :--- | :--- |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave admin de Supabase | Bypass total de RLS y acceso a DB |
| `RESEND_API_KEY` | Key de envío de correos | Envío masivo no autorizado de email |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Credenciales de Cloudflare R2 | Modificación/borrado de archivos |
| `SHOPIFY_WEBHOOK_SECRET` | Secreto de firmas de Webhook | Falsificación de ventas/compras |

---

## 📋 Checklist de Verificación en Vercel

- [ ] Todas las variables del archivo `.env.local` están cargadas en el panel de Vercel.
- [ ] El archivo `.env.local` está incluido en `.gitignore` para no subirlo al repositorio.
- [ ] Ningún secret tiene el prefijo `NEXT_PUBLIC_`.