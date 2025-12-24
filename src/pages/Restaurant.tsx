import { useState, useEffect, useCallback } from 'react'
import { Building2 } from 'lucide-react'
import { PageContainer } from '../components/layout'
import { Card, CardHeader, Button, Input, Textarea, ImageUpload } from '../components/ui'
import { useRestaurantStore } from '../stores/restaurantStore'
import { toast } from '../stores/toastStore'
import { validateRestaurant, type ValidationErrors } from '../utils/validation'
import { handleError } from '../utils/logger'
import type { RestaurantFormData } from '../types'

export function RestaurantPage() {
  const { restaurant, createRestaurant, updateRestaurant } = useRestaurantStore()

  const [formData, setFormData] = useState<RestaurantFormData>({
    name: '',
    slug: '',
    description: '',
    logo: '',
    banner: '',
    theme_color: '#f97316',
    address: '',
    phone: '',
    email: '',
  })

  const [errors, setErrors] = useState<ValidationErrors<RestaurantFormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name,
        slug: restaurant.slug,
        description: restaurant.description,
        logo: restaurant.logo || '',
        banner: restaurant.banner || '',
        theme_color: restaurant.theme_color,
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        email: restaurant.email || '',
      })
    }
  }, [restaurant])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      const validation = validateRestaurant(formData)
      if (!validation.isValid) {
        setErrors(validation.errors)
        return
      }

      setIsSubmitting(true)

      try {
        if (restaurant) {
          updateRestaurant(formData)
          toast.success('Restaurante actualizado correctamente')
        } else {
          createRestaurant(formData)
          toast.success('Restaurante creado correctamente')
        }
      } catch (error) {
        const message = handleError(error, 'RestaurantPage.handleSubmit')
        toast.error(`Error al guardar el restaurante: ${message}`)
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, restaurant, updateRestaurant, createRestaurant]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target
      setFormData((prev) => ({ ...prev, [name]: value }))
      if (errors[name as keyof RestaurantFormData]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }))
      }
    },
    [errors]
  )

  const generateSlug = useCallback(() => {
    const slug = formData.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
    setFormData((prev) => ({ ...prev, slug }))
  }, [formData.name])

  return (
    <PageContainer
      title="Restaurante"
      description="Configura la informacion de tu restaurante"
    >
      <form onSubmit={handleSubmit} className="max-w-4xl">
        <Card className="mb-6">
          <CardHeader
            title="Informacion General"
            description="Datos basicos del restaurante"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Nombre del Restaurante"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={() => !formData.slug && generateSlug()}
              placeholder="Mi Restaurante"
              error={errors.name}
            />

            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  label="Slug (URL)"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="mi-restaurante"
                  error={errors.slug}
                  helperText="Se usara en la URL del menu"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="mt-7"
                onClick={generateSlug}
              >
                Generar
              </Button>
            </div>

            <div className="md:col-span-2">
              <Textarea
                label="Descripcion"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Descripcion del restaurante..."
                error={errors.description}
                rows={3}
              />
            </div>

            <Input
              label="Color Principal"
              name="theme_color"
              type="color"
              value={formData.theme_color}
              onChange={handleChange}
              className="h-10 p-1"
            />
          </div>
        </Card>

        <Card className="mb-6">
          <CardHeader
            title="Imagenes"
            description="Logo y banner del restaurante"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImageUpload
              label="Logo"
              value={formData.logo}
              onChange={(url) => setFormData((prev) => ({ ...prev, logo: url }))}
            />

            <ImageUpload
              label="Banner"
              value={formData.banner}
              onChange={(url) => setFormData((prev) => ({ ...prev, banner: url }))}
            />
          </div>
        </Card>

        <Card className="mb-6">
          <CardHeader
            title="Contacto"
            description="Informacion de contacto del restaurante"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Direccion"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Calle 123, Ciudad"
            />

            <Input
              label="Telefono"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+54 11 1234-5678"
            />

            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="contacto@restaurante.com"
              error={errors.email}
            />
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="submit" isLoading={isSubmitting} leftIcon={<Building2 className="w-4 h-4" />}>
            {restaurant ? 'Guardar Cambios' : 'Crear Restaurante'}
          </Button>
        </div>
      </form>
    </PageContainer>
  )
}
