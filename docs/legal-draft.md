# Borrador de Términos de Servicio y Política de Privacidad

> **Nota:** Este documento es un borrador operativo para desarrollo y no sustituye la asesoría legal profesional.

---

## 1. Tratamiento de Datos y Privacidad

Nuestra plataforma implementa mecanismos avanzados de protección de contenido e identificación de fraudes. 

### a. Recolección de Datos
- **Compradores:** Se procesa el correo electrónico para la generación y entrega de los recursos digitales adquiridos.
- **Hashes Criptográficos:** Para la Red de Denuncias Comunitaria y listas de restricción, los correos electrónicos se transforman mediante algoritmos **SHA-256 unidireccionales**. Nunca almacenamos el correo electrónico original en texto plano dentro de la red global.

### b. Red Comunitaria Agregada (Opt-In)
- Las creadoras pueden optar por compartir de forma **anónima** los reportes de infracciones.
- La red comunitaria registra únicamente el conteo acumulado de reportes (`report_count`). Ninguna creadora puede acceder a la identidad de otra creadora ni saber quién emitió un reporte específico.

---

## 2. Mecanismo de Disputa y Apelación

Si un comprador considera que su acceso fue restringido por error o por un reporte injustificado, puede iniciar un proceso de revisión:

1. **Contacto de Soporte:** Enviar un correo electrónico a `soporte@tudominio.com` con el asunto **"Solicitud de Revisión / Disputa de Bloqueo"**.
2. **Información Requerida:** 
   - ID de la transacción u orden de compra.
   - Correo electrónico utilizado en la compra.
   - Exposición breve de los motivos o comprobante de pago.
3. **Proceso de Evaluación:**
   - El equipo técnico revisará el historial asociado al hash del correo.
   - Se evaluará si se trató de un falso positivo en la red comunitaria o un bloqueo manual por parte del vendedor.
   - En un plazo máximo de 5 días hábiles se emitirá una respuesta, pudiendo rehabilitar el acceso y corregir el conteo en la lista global si corresponde.