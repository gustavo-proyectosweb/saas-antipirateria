import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans">
      {/* Navbar / Encabezado */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg text-white">
            <span className="text-xl">🛡️</span> StampPDF
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-gray-300 hover:text-white transition"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg transition"
            >
              Probar Gratis
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 space-y-24">
        {/* Seccion Principal / Hero */}
        <section className="text-center space-y-6 pt-8">
          <span className="inline-block bg-indigo-950/80 border border-indigo-800/60 text-indigo-400 text-xs font-semibold px-3 py-1 rounded-full">
            🔒 Protección Forense para Creadoras Digitales
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Evita la piratería de tus <br />
            <span className="text-indigo-400">Kits Imprimibles</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Protege tus archivos PDF agregando una marca de agua forense e invisible vinculada a cada comprador. Identifica quién filtra tu contenido sin arruinar la experiencia del cliente.
          </p>
          <div className="pt-4 flex justify-center gap-4">
            <Link
              href="/signup"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 transition"
            >
              Comenzar a Proteger mis PDFs →
            </Link>
          </div>
        </section>

        {/* Cómo Funciona en 3 Pasos */}
        <section className="space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">
              ¿Cómo funciona? En solo 3 pasos
            </h2>
            <p className="text-sm text-gray-400">
              Sin configuraciones complejas ni instalaciones pesadas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-950 text-indigo-400 flex items-center justify-center font-bold text-lg border border-indigo-800/50">
                1
              </div>
              <h3 className="font-bold text-white text-lg">Sube tu PDF Original</h3>
              <p className="text-sm text-gray-400">
                Carga tus guías, libros o kits en nuestra plataforma una sola vez de forma segura.
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-950 text-indigo-400 flex items-center justify-center font-bold text-lg border border-indigo-800/50">
                2
              </div>
              <h3 className="font-bold text-white text-lg">Conecta tu Tienda</h3>
              <p className="text-sm text-gray-400">
                Integra Shopify o Tiendanube. Cada vez que alguien compra, generamos un enlace de descarga único.
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-950 text-indigo-400 flex items-center justify-center font-bold text-lg border border-indigo-800/50">
                3
              </div>
              <h3 className="font-bold text-white text-lg">Estampado Forense</h3>
              <p className="text-sm text-gray-400">
                El comprador recibe un archivo con datos rastreables. Si el PDF se resube en grupos de reventa, sabrás quién fue.
              </p>
            </div>
          </div>
        </section>

        {/* Testimonios de Beta Testers */}
        <section className="bg-gray-900/60 border border-gray-800 rounded-3xl p-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">
              Lo que opinan creadoras que ya lo probaron
            </h2>
            <p className="text-sm text-gray-400">
              Validado con emprendedoras de productos digitales en la versión Beta.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-950 border border-gray-800/80 p-6 rounded-xl space-y-4">
              <p className="text-sm text-gray-300 italic">
                "Subir mis archivos y conectarlo con las ventas fue sumamente rápido. Saber que cada entrega tiene una marca personalizada me da muchísima tranquilidad."
              </p>
              <div>
                <p className="text-sm font-bold text-white">Creadora Beta</p>
                <p className="text-xs text-indigo-400">Tienda de Kits Imprimibles</p>
              </div>
            </div>

            <div className="bg-gray-950 border border-gray-800/80 p-6 rounded-xl space-y-4">
              <p className="text-sm text-gray-300 italic">
                "La entrega automática por correo funciona perfecto y el cliente recibe su PDF de inmediato sin tener que crear claves ni cuentas extra."
              </p>
              <div>
                <p className="text-sm font-bold text-white">Diseñadora Digital</p>
                <p className="text-xs text-indigo-400">Venta de Guías & eBooks</p>
              </div>
            </div>
          </div>
        </section>

        {/* Llamado a la Acción Final (CTA) */}
        <section className="text-center space-y-6 py-8">
          <h2 className="text-3xl font-bold text-white">
            ¿Lista para proteger tus creaciones digitales?
          </h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Crea tu cuenta gratuita hoy y comienza a stamping tus archivos en menos de 5 minutos.
          </p>
          <div>
            <Link
              href="/signup"
              className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 transition"
            >
              Crear Cuenta Gratis →
            </Link>
          </div>
        </section>
      </main>

      {/* Footer / Pie de página */}
      <footer className="border-t border-gray-900 bg-gray-950 py-8 text-center text-xs text-gray-600">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} StampPDF. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-gray-400 transition">Ingresar</Link>
            <Link href="/signup" className="hover:text-gray-400 transition">Registro</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}