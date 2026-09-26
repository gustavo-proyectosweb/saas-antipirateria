# Runbook Operativo de Emergencia — SaaS Anti-Piratería

Este documento detalla los procedimientos concretos de mitigación ante fallas críticas de infraestructura y proveedores de servicios externos.

---

## 🚨 Canal de Alertas de Incidencias

En caso de errores 500 no capturados o fallas críticas del sistema:
- **Alertas de servidor:** Configurado en Vercel -> Project Settings -> Integrations / Notifications para enviar email inmediato a la cuenta de administración.
- **Logs de Supabase:** Visibles desde Dashboard -> Logs -> Postgres Logs / API Logs.

---

## 🛠️ Escenarios de Recuperación (Playbooks)

### Escenario 1: Caída de Cloudflare R2 (Almacenamiento de archivos PDF)
**Síntoma:** Los compradores reciben errores al intentar descargar el PDF o las creadoras no pueden subir archivos.

**Pasos de Mitigación:**
1. **Verificar estado:** Consultar [Cloudflare Status](https://www.cloudflarestatus.com/).
2. **Habilitar Storage de Respaldo (Supabase Storage):**
   - Si R2 está caído por más de 15 minutos, cambiar temporalmente el proveedor de almacenamiento secundario.
   - Ir a Vercel -> Environment Variables y cambiar el flag de almacenamiento o apuntar las URLs firmadas hacia el bucket de reserva en Supabase Storage.
3. **Notificación:** Si es un mantenimiento prolongado, pausar temporalmente las ventas desde las tiendas conectadas (Shopify/Tiendanube) o mostrar aviso en el dashboard de la creadora.

---

### Escenario 2: Caída de Resend (Servicio de Envío de Correos)
**Síntoma:** Los compradores completan el pago pero no reciben el email con su enlace de descarga.

**Pasos de Mitigación:**
1. **Verificar estado:** Consultar [Resend Status](https://status.resend.com/).
2. **Identificar compras afectadas:**
   - Ir al SQL Editor de Supabase y ejecutar:
     ```sql
     SELECT * FROM public.purchases 
     WHERE created_at > NOW() - INTERVAL '2 hours' 
     ORDER BY created_at DESC;
     ```
3. **Reintento / Entrega manual:**
   - Copiar el `token` de descarga de las compras afectadas.
   - Enviar manualmente el enlace (`https://tudominio.com/download?token=UUID_AQUÍ`) directamente al comprador por canal de soporte alternativo o reenviar vía cliente de email corporativo secundario (SMTP).

---

### Escenario 3: Fallo Masivo en Procesamiento de Webhooks (Shopify / Tiendanube)
**Síntoma:** Se realizan compras en la tienda pero no se registran filas en la tabla `purchases`.

**Pasos de Mitigación:**
1. **Revisar Logs de Errores:**
   - Ir a Vercel -> Logs -> Filtrar por `/api/webhooks/`.
   - Verificar si el error es de autenticación (`401/403` por secreto mal configurado) o de código (`500`).
2. **Revisar Firma / Secretos:**
   - Confirmar en Vercel que `SHOPIFY_WEBHOOK_SECRET` o la clave de webhook coincida exactamente con la enviada por la plataforma de e-commerce.
3. **Re-sincronización de Compras Perdidas (Webhook Re-delivery):**
   - Entrar al panel de Shopify / Tiendanube -> Configuración -> Webhooks.
   - Seleccionar el webhook del evento `orders/paid` que falló y hacer clic en **"Reenviar webhook"** (Re-deliver).
   - Verificar en la tabla `purchases` que la compra se haya insertado correctamente.

---

## 💾 Copias de Seguridad (Backups)

- **Frecuencia:** Copia de seguridad diaria automática gestionada por Supabase (Postgres).
- **Restauración:** En caso de corrupción de datos crítica, ir al panel de Supabase -> Project Settings -> Database -> Restore / Point-in-time Recovery.