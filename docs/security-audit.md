# Auditoría de Seguridad y Row Level Security (RLS) — Supabase

Este documento registra los intentos de acceso cruzado y prueba de penetración con el cliente anónimo (`anon_key`) para verificar las políticas RLS.

---

## 🛡️ Matriz de Pruebas de Seguridad

| Tabla | Operación | Rol Probado | Resultado Esperado | Resultado Real | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `purchases` | SELECT | Anónimo | 0 registros retornados / Bloqueado | 0 registros retornados | ✅ Aprobado |
| `purchases` | UPDATE | Anónimo | Modificación no permitida | No se modificaron registros | ✅ Aprobado |
| `community_reports` | SELECT | Anónimo | 0 registros retornados / Bloqueado | 0 registros retornados | ✅ Aprobado |
| `creators` | SELECT | Anónimo / Creadora A | Solo ver tienda propia / pública | Accesos aislados correctamente | ✅ Aprobado |
| `community_reports` | UPDATE | Creadora A | No editar denuncias de Creadora B | Operación denegada por RLS | ✅ Aprobado |

---

## 🧪 Registro de Ejecución de Scripts de Penetración

### Test 1: Lectura anónima de compras (`purchases`)
- **Fecha:** 2026-09-26
- **Comando:** `npx tsx scripts/test-security.ts`
- **Resultado:** ✅ BLOQUEADO POR RLS (Se retornaron 0 registros).

### Test 2: Modificación anónima de compras (`purchases`)
- **Fecha:** 2026-09-26
- **Comando:** `npx tsx scripts/test-security.ts`
- **Resultado:** ✅ BLOQUEADO POR RLS (No se permitió modificar la columna `is_blocked`).

### Test 3: Lectura anónima de reportes de comunidad (`community_reports`)
- **Fecha:** 2026-09-26
- **Comando:** `npx tsx scripts/test-security.ts`
- **Resultado:** ✅ BLOQUEADO POR RLS (Se retornaron 0 registros).