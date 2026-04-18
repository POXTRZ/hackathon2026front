import { useState } from 'react';

export interface BoundingBox {
  clase: string;
  confianza: number;
  bbox: [number, number, number, number];
}

export interface VisionResponse {
  estado_operacion?: string;
  detecciones: BoundingBox[];
  conteo_total: number;
}

export const useVisionAI = () => {
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [datosIA, setDatosIA] = useState<VisionResponse | null>(null);
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const analizarFoto = async (archivo: File) => {
    setImagenPreview(URL.createObjectURL(archivo));
    setCargando(true);
    setDatosIA(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', archivo);

    try {
      const respuesta = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        body: formData,
      });

      if (!respuesta.ok) throw new Error("Error en el servidor de IA");

      const datos: VisionResponse = await respuesta.json();
      setDatosIA(datos);
    } catch (err: any) {
      console.error(err);
      setError("No se pudo analizar la imagen. Verifica que la IA esté corriendo.");
    } finally {
      setCargando(false);
    }
  };

  const limpiar = () => {
    setImagenPreview(null);
    setDatosIA(null);
    setError(null);
  };

  return { imagenPreview, datosIA, cargando, error, analizarFoto, limpiar };
};
