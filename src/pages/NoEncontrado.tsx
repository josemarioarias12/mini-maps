import { Link } from 'react-router-dom';
import { BotonVolver } from '../components/ui/BotonVolver';
import { claseEnlaceBoton } from '../components/ui/Boton';

export default function NoEncontrado() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center dark:bg-slate-950 dark:text-slate-100">
      <div>
        <p className="text-6xl font-black text-blue-600">404</p>
        <h1 tabIndex={-1} className="mt-2 text-2xl font-bold">Esta página no existe</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Puede que el enlace esté mal escrito o que la página se haya movido.</p>
        <div className="mt-6 flex justify-center gap-3">
          <BotonVolver />
          <Link to="/" className={claseEnlaceBoton('primario')}>Ir al inicio</Link>
          <Link to="/mapa" className={claseEnlaceBoton('secundario')}>Abrir el mapa</Link>
        </div>
      </div>
    </main>
  );
}
