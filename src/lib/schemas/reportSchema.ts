import { z } from 'zod'

export const reportFormSchema = z.object({
  contentUrl: z
    .string()
    .min(1, 'El enlace o ubicación del contenido pirata es obligatorio')
    .url('Debe ser un enlace URL válido (ej: https://mega.nz/...)'),
  productName: z
    .string()
    .min(2, 'Ingresa el nombre del producto o creadora afectad@'),
  description: z
    .string()
    .min(10, 'La descripción debe tener al menos 10 caracteres explicativos'),
  reporterEmail: z
    .string()
    .email('Ingresa un correo electrónico válido')
    .optional()
    .or(z.literal('')),
})

export type ReportFormData = z.infer<typeof reportFormSchema>