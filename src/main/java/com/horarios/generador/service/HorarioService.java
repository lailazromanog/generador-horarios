package com.horarios.generador.service;

import com.horarios.generador.dto.EntradaHorario;
import com.horarios.generador.dto.ResultadoHorario;
import com.horarios.generador.dto.SeleccionHorario;
import com.horarios.generador.model.BloqueHorario;
import com.horarios.generador.model.Materia;
import com.horarios.generador.model.Profesor;
import com.horarios.generador.repository.MateriaRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Lógica de negocio para generar horarios, detectar choques y calcular puntuaciones.
 */
@Service
public class HorarioService {

    /** Paleta de colores CSS para distinguir visualmente cada materia en la grilla. */
    private static final String[] COLORES = {
        "#1565C0", "#2E7D32", "#E65100", "#6A1B9A",
        "#00695C", "#AD1457", "#4527A0", "#558B2F",
        "#D84315", "#00838F"
    };

    private final MateriaRepository repositorio;

    public HorarioService(MateriaRepository repositorio) {
        this.repositorio = repositorio;
    }

    /**
     * Genera el horario a partir de las selecciones del estudiante.
     * Calcula la puntuación y detecta choques entre bloques.
     *
     * @param selecciones lista de pares (materiaId, profesorId) elegidos
     * @return resultado con entradas, puntuación y lista de choques
     */
    public ResultadoHorario generarHorario(List<SeleccionHorario> selecciones) {
        List<EntradaHorario> entradas = new ArrayList<>();
        List<String> choques = new ArrayList<>();
        double puntuacionTotal = 0.0;

        int indiceColor = 0;

        for (SeleccionHorario seleccion : selecciones) {
            Optional<Materia>  optMateria  = repositorio.buscarMateriaPorId(seleccion.getMateriaId());
            Optional<Profesor> optProfesor = repositorio.buscarProfesorPorId(seleccion.getProfesorId());

            if (optMateria.isEmpty() || optProfesor.isEmpty()) continue;

            Materia  materia  = optMateria.get();
            Profesor profesor = optProfesor.get();
            String   color    = COLORES[indiceColor % COLORES.length];
            indiceColor++;

            // Acumular puntuación: se intenta parsear la nota como número
            puntuacionTotal += parsearNota(profesor.getNota());

            // Crear una entrada por cada bloque del profesor seleccionado
            for (BloqueHorario bloque : profesor.getBloques()) {
                EntradaHorario entrada = new EntradaHorario();
                entrada.setMateriaId(materia.getId());
                entrada.setMateriaNombre(materia.getNombre());
                entrada.setProfesorId(profesor.getId());
                entrada.setProfesorNombre(profesor.getNombre());
                entrada.setDia(bloque.getDia());
                entrada.setHoraInicio(bloque.getHoraInicio());
                entrada.setHoraFin(bloque.getHoraFin());
                entrada.setColor(color);
                entradas.add(entrada);
            }
        }

        // Detectar todos los pares de entradas que se solapan en el tiempo
        for (int i = 0; i < entradas.size(); i++) {
            for (int j = i + 1; j < entradas.size(); j++) {
                EntradaHorario a = entradas.get(i);
                EntradaHorario b = entradas.get(j);
                if (hayChoque(a, b)) {
                    String mensaje = String.format(
                        "Choque: %s (%s) y %s (%s) — %s %s-%s",
                        a.getMateriaNombre(), a.getProfesorNombre(),
                        b.getMateriaNombre(), b.getProfesorNombre(),
                        a.getDia().name(),
                        a.getHoraInicio(), a.getHoraFin()
                    );
                    choques.add(mensaje);
                }
            }
        }

        ResultadoHorario resultado = new ResultadoHorario();
        resultado.setEntradas(entradas);
        resultado.setPuntuacion(puntuacionTotal);
        resultado.setChoques(choques);
        resultado.setTieneChoques(!choques.isEmpty());
        return resultado;
    }

    /**
     * Determina si dos entradas horarias tienen un solapamiento en el tiempo.
     * Dos bloques chocan si están en el mismo día y sus rangos se superponen.
     */
    private boolean hayChoque(EntradaHorario a, EntradaHorario b) {
        if (a.getDia() != b.getDia()) return false;

        int inicioA = horaEnMinutos(a.getHoraInicio());
        int finA    = horaEnMinutos(a.getHoraFin());
        int inicioB = horaEnMinutos(b.getHoraInicio());
        int finB    = horaEnMinutos(b.getHoraFin());

        // Solapan si uno empieza antes de que el otro termine, y viceversa
        return inicioA < finB && inicioB < finA;
    }

    /**
     * Convierte una hora en formato "HH:mm" a minutos desde medianoche
     * para facilitar comparaciones numéricas.
     */
    private int horaEnMinutos(String hora) {
        if (hora == null || !hora.contains(":")) return 0;
        String[] partes = hora.split(":");
        int horas   = Integer.parseInt(partes[0]);
        int minutos = Integer.parseInt(partes[1]);
        return horas * 60 + minutos;
    }

    /**
     * Intenta convertir la nota textual del profesor a un valor numérico.
     * Si no es un número válido, retorna 0 para no penalizar la puntuación.
     */
    private double parsearNota(String nota) {
        if (nota == null || nota.isBlank()) return 0.0;
        try {
            return Double.parseDouble(nota.trim().replace(",", "."));
        } catch (NumberFormatException e) {
            // La nota es texto libre; se asigna un punto fijo por tenerla
            return 1.0;
        }
    }
}
