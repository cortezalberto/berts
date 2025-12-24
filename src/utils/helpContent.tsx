import type { ReactNode } from 'react'

export const helpContent: Record<string, ReactNode> = {
  dashboard: (
    <div className="space-y-4 text-zinc-300">
      <p className="text-lg font-medium text-white">Bienvenido al Panel de Control</p>
      <p>
        Este es el punto central de administracion de tu restaurante. Desde aqui puedes:
      </p>
      <ul className="list-disc list-inside space-y-2 ml-4">
        <li><strong>Ver estadisticas generales:</strong> Resumen rapido de sucursales, categorias, productos y promociones activas.</li>
        <li><strong>Seleccionar una sucursal:</strong> Haz clic en el boton "Ver Menu" de cualquier sucursal para activarla y poder gestionar sus categorias, subcategorias y productos.</li>
        <li><strong>Navegar rapidamente:</strong> Accede a cualquier seccion del sistema desde el menu lateral izquierdo.</li>
      </ul>
      <div className="bg-zinc-800 p-4 rounded-lg mt-4">
        <p className="text-orange-400 font-medium">Importante:</p>
        <p className="text-sm mt-1">
          Para gestionar categorias, subcategorias, productos o precios, primero debes seleccionar una sucursal haciendo clic en "Ver Menu".
          La sucursal activa aparecera indicada en el menu lateral.
        </p>
      </div>
    </div>
  ),

  restaurant: (
    <div className="space-y-4 text-zinc-300">
      <p className="text-lg font-medium text-white">Configuracion del Restaurante</p>
      <p>
        En esta seccion puedes configurar la informacion general de tu restaurante:
      </p>
      <ul className="list-disc list-inside space-y-2 ml-4">
        <li><strong>Nombre del restaurante:</strong> El nombre que aparecera en todo el sistema y menu publico.</li>
        <li><strong>Slug:</strong> Identificador unico para la URL de tu menu (solo letras minusculas, numeros y guiones).</li>
        <li><strong>Descripcion:</strong> Breve descripcion de tu restaurante para los clientes.</li>
        <li><strong>Logo:</strong> Imagen representativa de tu marca.</li>
        <li><strong>Color principal:</strong> El color que se usara como acento en tu menu publico.</li>
        <li><strong>Datos de contacto:</strong> Telefono, email y direccion principal.</li>
      </ul>
      <div className="bg-zinc-800 p-4 rounded-lg mt-4">
        <p className="text-orange-400 font-medium">Consejo:</p>
        <p className="text-sm mt-1">
          Asegurate de completar toda la informacion antes de crear sucursales.
          Esta informacion es compartida por todas las sucursales.
        </p>
      </div>
    </div>
  ),

  branches: (
    <div className="space-y-4 text-zinc-300">
      <p className="text-lg font-medium text-white">Gestion de Sucursales</p>
      <p>
        Administra todas las sucursales de tu restaurante. Cada sucursal tiene su propio menu con categorias, subcategorias y productos independientes.
      </p>
      <ul className="list-disc list-inside space-y-2 ml-4">
        <li><strong>Crear sucursal:</strong> Haz clic en "Nueva Sucursal" para agregar una nueva ubicacion.</li>
        <li><strong>Editar sucursal:</strong> Modifica nombre, direccion, telefono, email e imagen.</li>
        <li><strong>Ver menu:</strong> Haz clic en el icono de enlace externo para activar la sucursal y gestionar su menu.</li>
        <li><strong>Activar/Desactivar:</strong> Controla si la sucursal esta visible para los clientes.</li>
        <li><strong>Ordenar:</strong> Define el orden de aparicion de las sucursales.</li>
      </ul>
      <div className="bg-red-900/50 p-4 rounded-lg mt-4 border border-red-700">
        <p className="text-red-400 font-medium">Advertencia:</p>
        <p className="text-sm mt-1">
          Al eliminar una sucursal se eliminaran TODAS las categorias, subcategorias y productos asociados a ella.
          Esta accion no se puede deshacer.
        </p>
      </div>
    </div>
  ),

  categories: (
    <div className="space-y-4 text-zinc-300">
      <p className="text-lg font-medium text-white">Gestion de Categorias</p>
      <p>
        Las categorias son las secciones principales del menu de una sucursal (ej: Comidas, Bebidas, Postres).
      </p>
      <ul className="list-disc list-inside space-y-2 ml-4">
        <li><strong>Crear categoria:</strong> Haz clic en "Nueva Categoria" para agregar una seccion al menu.</li>
        <li><strong>Editar categoria:</strong> Modifica nombre, icono, imagen y estado.</li>
        <li><strong>Ordenar:</strong> Define el orden de aparicion en el menu.</li>
        <li><strong>Subcategorias:</strong> Visualiza cuantas subcategorias tiene cada categoria.</li>
      </ul>
      <div className="bg-zinc-800 p-4 rounded-lg mt-4">
        <p className="text-orange-400 font-medium">Nota:</p>
        <p className="text-sm mt-1">
          Cada sucursal tiene su propio conjunto de categorias. Primero selecciona una sucursal desde el Dashboard
          para ver y gestionar sus categorias.
        </p>
      </div>
      <div className="bg-red-900/50 p-4 rounded-lg mt-2 border border-red-700">
        <p className="text-red-400 font-medium">Advertencia:</p>
        <p className="text-sm mt-1">
          Al eliminar una categoria se eliminaran todas sus subcategorias y productos.
        </p>
      </div>
    </div>
  ),

  subcategories: (
    <div className="space-y-4 text-zinc-300">
      <p className="text-lg font-medium text-white">Gestion de Subcategorias</p>
      <p>
        Las subcategorias permiten organizar los productos dentro de cada categoria (ej: dentro de "Comidas" puedes tener "Hamburguesas", "Pastas", "Ensaladas").
      </p>
      <ul className="list-disc list-inside space-y-2 ml-4">
        <li><strong>Crear subcategoria:</strong> Selecciona la categoria padre y agrega una nueva subcategoria.</li>
        <li><strong>Filtrar:</strong> Usa el filtro para ver subcategorias de una categoria especifica.</li>
        <li><strong>Editar:</strong> Modifica nombre, imagen y estado de la subcategoria.</li>
        <li><strong>Productos:</strong> Visualiza cuantos productos tiene cada subcategoria.</li>
      </ul>
      <div className="bg-zinc-800 p-4 rounded-lg mt-4">
        <p className="text-orange-400 font-medium">Consejo:</p>
        <p className="text-sm mt-1">
          Organiza tus productos en subcategorias para que los clientes encuentren facilmente lo que buscan.
          Por ejemplo: Bebidas &gt; Cervezas, Bebidas &gt; Jugos, Bebidas &gt; Gaseosas.
        </p>
      </div>
    </div>
  ),

  products: (
    <div className="space-y-4 text-zinc-300">
      <p className="text-lg font-medium text-white">Gestion de Productos</p>
      <p>
        Administra todos los productos del menu de la sucursal seleccionada.
      </p>
      <ul className="list-disc list-inside space-y-2 ml-4">
        <li><strong>Crear producto:</strong> Agrega nuevos items al menu con nombre, descripcion, precio e imagen.</li>
        <li><strong>Categoria y Subcategoria:</strong> Asigna cada producto a su ubicacion en el menu.</li>
        <li><strong>Precio:</strong> Define un precio unico o precios diferentes por sucursal.</li>
        <li><strong>Alergenos:</strong> Indica que alergenos contiene el producto para informar a los clientes.</li>
        <li><strong>Destacado/Popular:</strong> Marca productos especiales que apareceran resaltados.</li>
        <li><strong>Badge:</strong> Agrega etiquetas como "NUEVO", "VEGANO", "PROMO".</li>
        <li><strong>Filtros:</strong> Filtra productos por categoria y subcategoria.</li>
      </ul>
      <div className="bg-zinc-800 p-4 rounded-lg mt-4">
        <p className="text-orange-400 font-medium">Precios por sucursal:</p>
        <p className="text-sm mt-1">
          Activa "Precios diferentes por sucursal" para definir precios especificos en cada ubicacion.
          Puedes desmarcar sucursales donde el producto no se vende.
        </p>
      </div>
    </div>
  ),

  prices: (
    <div className="space-y-4 text-zinc-300">
      <p className="text-lg font-medium text-white">Gestion de Precios</p>
      <p>
        Vista especializada para gestionar y actualizar precios de productos de forma eficiente.
      </p>
      <ul className="list-disc list-inside space-y-2 ml-4">
        <li><strong>Vista rapida:</strong> Ve todos los precios de productos en una tabla.</li>
        <li><strong>Filtrar:</strong> Filtra por categoria y subcategoria para encontrar productos rapidamente.</li>
        <li><strong>Editar precio:</strong> Haz clic en "Editar" para modificar el precio de un producto.</li>
        <li><strong>Modo precio unico:</strong> Un solo precio para todas las sucursales.</li>
        <li><strong>Modo por sucursal:</strong> Precios diferentes segun la ubicacion.</li>
        <li><strong>Actualizacion masiva:</strong> Usa "Actualizar Precios" para aplicar cambios a multiples productos.</li>
      </ul>
      <div className="bg-zinc-800 p-4 rounded-lg mt-4">
        <p className="text-orange-400 font-medium">Actualizacion masiva:</p>
        <p className="text-sm mt-1">
          Puedes aumentar o disminuir precios por porcentaje (ej: +10%) o por monto fijo (ej: +$500).
          Los cambios se aplican a todos los productos filtrados actualmente.
        </p>
      </div>
    </div>
  ),

  allergens: (
    <div className="space-y-4 text-zinc-300">
      <p className="text-lg font-medium text-white">Gestion de Alergenos</p>
      <p>
        Administra la lista de alergenos que pueden contener tus productos. Esta informacion es importante para la seguridad alimentaria de tus clientes.
      </p>
      <ul className="list-disc list-inside space-y-2 ml-4">
        <li><strong>Alergenos predefinidos:</strong> El sistema incluye los 12 alergenos principales (Gluten, Lacteos, Huevos, etc.).</li>
        <li><strong>Crear alergeno:</strong> Agrega nuevos alergenos con nombre, icono (emoji) y descripcion.</li>
        <li><strong>Editar/Eliminar:</strong> Modifica o elimina alergenos existentes.</li>
        <li><strong>Uso en productos:</strong> Ve cuantos productos tienen asignado cada alergeno.</li>
      </ul>
      <div className="bg-zinc-800 p-4 rounded-lg mt-4">
        <p className="text-orange-400 font-medium">Consejo:</p>
        <p className="text-sm mt-1">
          Usa emojis representativos para cada alergeno. Apareceran junto a los productos en el menu
          para informar rapidamente a los clientes.
        </p>
      </div>
    </div>
  ),

  promotionTypes: (
    <div className="space-y-4 text-zinc-300">
      <p className="text-lg font-medium text-white">Tipos de Promocion</p>
      <p>
        Define los tipos de promociones que ofrece tu restaurante. Estos tipos te ayudan a categorizar y filtrar tus promociones.
      </p>
      <ul className="list-disc list-inside space-y-2 ml-4">
        <li><strong>Tipos predefinidos:</strong> Happy Hour, Combo Familiar, 2x1, Descuento.</li>
        <li><strong>Crear tipo:</strong> Agrega nuevos tipos de promocion con nombre, icono y descripcion.</li>
        <li><strong>Color:</strong> Asigna un color distintivo para identificar facilmente cada tipo.</li>
        <li><strong>Uso:</strong> Ve cuantas promociones activas usan cada tipo.</li>
      </ul>
      <div className="bg-red-900/50 p-4 rounded-lg mt-4 border border-red-700">
        <p className="text-red-400 font-medium">Advertencia:</p>
        <p className="text-sm mt-1">
          Al eliminar un tipo de promocion se eliminaran TODAS las promociones que lo usen.
          Considera desactivar el tipo en lugar de eliminarlo.
        </p>
      </div>
    </div>
  ),

  promotions: (
    <div className="space-y-4 text-zinc-300">
      <p className="text-lg font-medium text-white">Gestion de Promociones</p>
      <p>
        Crea y administra promociones y combos para atraer mas clientes. Las promociones pueden aplicarse a multiples sucursales.
      </p>
      <ul className="list-disc list-inside space-y-2 ml-4">
        <li><strong>Crear promocion:</strong> Define nombre, precio del combo y selecciona los productos incluidos.</li>
        <li><strong>Tipo de promocion:</strong> Categoriza la promocion (Happy Hour, 2x1, Combo, etc.).</li>
        <li><strong>Programacion:</strong> Establece fechas y horarios de vigencia.</li>
        <li><strong>Sucursales:</strong> Selecciona en que sucursales estara disponible.</li>
        <li><strong>Productos:</strong> Elige que productos forman parte del combo y en que cantidad.</li>
        <li><strong>Activar/Desactivar:</strong> Controla la visibilidad de cada promocion.</li>
      </ul>
      <div className="bg-zinc-800 p-4 rounded-lg mt-4">
        <p className="text-orange-400 font-medium">Horarios:</p>
        <p className="text-sm mt-1">
          Puedes definir horarios especificos para promociones como Happy Hour (17:00 - 20:00).
          La promocion solo sera visible durante el horario configurado.
        </p>
      </div>
    </div>
  ),

  settings: (
    <div className="space-y-4 text-zinc-300">
      <p className="text-lg font-medium text-white">Configuracion</p>
      <p>
        Ajusta las preferencias generales del sistema y tu cuenta de usuario.
      </p>
      <ul className="list-disc list-inside space-y-2 ml-4">
        <li><strong>Perfil:</strong> Modifica tu informacion de usuario.</li>
        <li><strong>Notificaciones:</strong> Configura que alertas deseas recibir.</li>
        <li><strong>Apariencia:</strong> Personaliza el tema visual del panel.</li>
        <li><strong>Idioma:</strong> Cambia el idioma de la interfaz.</li>
        <li><strong>Datos:</strong> Exporta o importa datos del sistema.</li>
      </ul>
      <div className="bg-zinc-800 p-4 rounded-lg mt-4">
        <p className="text-orange-400 font-medium">Nota:</p>
        <p className="text-sm mt-1">
          Los cambios de configuracion se guardan automaticamente.
          Algunas opciones pueden requerir recargar la pagina para aplicarse.
        </p>
      </div>
    </div>
  ),
}
