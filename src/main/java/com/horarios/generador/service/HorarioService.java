package com.horarios.generador.service;

import com.horarios.generador.dto.EntradaHorario;
import com.horarios.generador.dto.RespuestaCombinaciones;
import com.horarios.generador.dto.ResultadoHorario;
import com.horarios.generador.dto.SeleccionHorario;
import com.horarios.generador.dto.SeleccionMultiple;
import com.horarios.generador.model.BloqueHorario;
import com.horarios.generador.model.Materia;
import com.horarios.generador.model.Profesor;
import com.horarios.generador.repository.MateriaRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Lógica de negocio: generación de horarios individuales, producto cartesiano
 * de combinaciones posibles, detección de choques y cálculo de puntuaciones.
 */
@Service
public class HorarioService {

    /** Máximo de combinaciones que se evalúan antes de cortar el producto cartesiano. */
    private static final int MAX_CALCULAR = 1000;
    /** Máximo de combinaciones que se devuelven al cliente (las de mayor puntaje). */
    private static final int MAX_MOSTRAR  = 20;

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

    // ── API pública ───────────────────────────────────────────────────────────

    /**
     * Calcula todas las combinaciones posibles a partir de las listas de profesores
     * elegidos por materia, las evalúa y devuelve las mejores ordenadas.
     *
     * Orden de prioridad:
     *   1. Sin choques de horario primero.
     *   2. Mayor puntuación acumulada de los profesores.
     *
     * @param selecciones una entrada por materia, cada una con N profesoresIds elegidos
     * @return envoltorio con las mejores combinaciones y metadatos de búsqueda
     */
    public RespuestaCombinaciones generarTodasLasCombinaciones(List<SeleccionMultiple> selecciones) {

        // Construir la lista de opciones por materia (List<List<SeleccionHorario>>)
        List<List<SeleccionHorario>> opcionesPorMateria = new ArrayList<>();
        for (SeleccionMultiple sm : selecciones) {
            if (sm.getProfesoresIds() == null || sm.getProfesoresIds().isEmpty()) continue;
            List<SeleccionHorario> opciones = new ArrayList<>();
            for (Long profId : sm.getProfesoresIds()) {
                SeleccionHorario sh = new SeleccionHorario();
                sh.setMateriaId(sm.getMateriaId());
                sh.setProfesorId(profId);
                opciones.add(sh);
            }
            opcionesPorMateria.add(opciones);
        }

        if (opcionesPorMateria.isEmpty()) {
            RespuestaCombinaciones vacia = new RespuestaCombinaciones();
            vacia.setCombinaciones(Collections.emptyList());
            vacia.setTotalPosibles(0);
            vacia.setTotalCalculadas(0);
            return vacia;
        }

        // Calcular el total teórico (puede ser muy grande)
        long totalPosibles = calcularTotalPosibles(opcionesPorMateria);

        // Generar el producto cartesiano (limitado a MAX_CALCULAR)
        List<List<SeleccionHorario>> combinaciones = productoCartesiano(opcionesPorMateria);
        int totalCalculadas = combinaciones.size();

        // Evaluar cada combinación
        List<ResultadoHorario> resultados = combinaciones.stream()
            .map(this::generarHorario)
            .collect(Collectors.toList());

        // Ordenar: sin choques primero, luego por puntuación descendente
        resultados.sort((a, b) -> {
            int sinChoques = Boolean.compare(a.isTieneChoques(), b.isTieneChoques());
            if (sinChoques != 0) return sinChoques;
            return Double.compare(b.getPuntuacion(), a.getPuntuacion());
        });

        // Tomar las mejores MAX_MOSTRAR y asignarles metadatos
        List<ResultadoHorario> mejores = resultados.subList(0, Math.min(MAX_MOSTRAR, resultados.size()));
        for (int i = 0; i < mejores.size(); i++) {
            ResultadoHorario r = mejores.get(i);
            r.setIndiceCombinacion(i + 1);
            r.setDescripcionProfesores(construirDescripcion(r.getEntradas()));
        }

        RespuestaCombinaciones respuesta = new RespuestaCombinaciones();
        respuesta.setCombinaciones(mejores);
        respuesta.setTotalPosibles(totalPosibles);
        respuesta.setTotalCalculadas(totalCalculadas);
        return respuesta;
    }

    // ── Métodos privados ──────────────────────────────────────────────────────

    /**
     * Genera el horario y detecta los choques para UNA combinación de
     * (materia → profesor). Asigna colores a cada materia de forma estable.
     */
    private ResultadoHorario generarHorario(List<SeleccionHorario> selecciones) {
        List<EntradaHorario> entradas = new ArrayList<>();
        List<String>         choques  = new ArrayList<>();
        double puntuacion = 0.0;
        int    indiceColor = 0;

        for (SeleccionHorario sel : selecciones) {
            Optional<Materia>  optMateria  = repositorio.buscarMateriaPorId(sel.getMateriaId());
            Optional<Profesor> optProfesor = repositorio.buscarProfesorPorId(sel.getProfesorId());
            if (optMateria.isEmpty() || optProfesor.isEmpty()) continue;

            Materia  materia  = optMateria.get();
            Profesor profesor = optProfesor.get();
            String   color    = COLORES[indiceColor % COLORES.length];
            indiceColor++;

            puntuacion += parsearNota(profesor.getNota());

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
                entrada.setCodigoGrupo(profesor.getCodigoGrupo()); // Para el panel "Ver Códigos"
                entradas.add(entrada);
            }
        }

        // Detectar solapamientos entre pares de entradas
        for (int i = 0; i < entradas.size(); i++) {
            for (int j = i + 1; j < entradas.size(); j++) {
                if (hayChoque(entradas.get(i), entradas.get(j))) {
                    EntradaHorario a = entradas.get(i);
                    EntradaHorario b = entradas.get(j);
                    choques.add(String.format(
                        "Choque: %s (%s) y %s (%s) — %s %s–%s",
                        a.getMateriaNombre(), a.getProfesorNombre(),
                        b.getMateriaNombre(), b.getProfesorNombre(),
                        a.getDia().name(), a.getHoraInicio(), a.getHoraFin()
                    ));
                }
            }
        }

        ResultadoHorario resultado = new ResultadoHorario();
        resultado.setEntradas(entradas);
        resultado.setPuntuacion(puntuacion);
        resultado.setChoques(choques);
        resultado.setTieneChoques(!choques.isEmpty());
        return resultado;
    }

    /**
     * Genera el producto cartesiano de las listas de opciones, limitando
     * el resultado a MAX_CALCULAR combinaciones para evitar explosión combinatoria.
     *
     * Ejemplo: [[A,B],[C],[D,E]] → [[A,C,D],[A,C,E],[B,C,D],[B,C,E]]
     */
    private List<List<SeleccionHorario>> productoCartesiano(List<List<SeleccionHorario>> listas) {
        List<List<SeleccionHorario>> resultado = new ArrayList<>();
        resultado.add(new ArrayList<>());

        for (List<SeleccionHorario> lista : listas) {
            List<List<SeleccionHorario>> siguiente = new ArrayList<>();
            for (List<SeleccionHorario> combinacionActual : resultado) {
                for (SeleccionHorario opcion : lista) {
                    List<SeleccionHorario> nueva = new ArrayList<>(combinacionActual);
                    nueva.add(opcion);
                    siguiente.add(nueva);
                    if (siguiente.size() >= MAX_CALCULAR) return siguiente; // Límite alcanzado
                }
            }
            resultado = siguiente;
        }
        return resultado;
    }

    /**
     * Construye un texto descriptivo con los profesores elegidos en una combinación.
     * Formato: "Materia A: Profesor X | Materia B: Profesor Y"
     */
    private String construirDescripcion(List<EntradaHorario> entradas) {
        // LinkedHashMap para preservar el orden de inserción
        Map<Long, String> descripcionPorMateria = new LinkedHashMap<>();
        for (EntradaHorario e : entradas) {
            descripcionPorMateria.putIfAbsent(
                e.getMateriaId(),
                e.getMateriaNombre() + ": " + e.getProfesorNombre()
            );
        }
        return String.join(" | ", descripcionPorMateria.values());
    }

    /**
     * Calcula el total teórico de combinaciones posibles (producto de los tamaños
     * de cada lista de profesores). Se satura en Long.MAX_VALUE para evitar overflow.
     */
    private long calcularTotalPosibles(List<List<SeleccionHorario>> opcionesPorMateria) {
        long total = 1;
        for (List<SeleccionHorario> opciones : opcionesPorMateria) {
            // Verificar overflow antes de multiplicar
            if (total > Long.MAX_VALUE / Math.max(opciones.size(), 1)) return Long.MAX_VALUE;
            total *= opciones.size();
        }
        return total;
    }

    /** Devuelve true si dos entradas se solapan en el mismo día. */
    private boolean hayChoque(EntradaHorario a, EntradaHorario b) {
        if (a.getDia() != b.getDia()) return false;
        int iA = horaEnMinutos(a.getHoraInicio()), fA = horaEnMinutos(a.getHoraFin());
        int iB = horaEnMinutos(b.getHoraInicio()), fB = horaEnMinutos(b.getHoraFin());
        return iA < fB && iB < fA;
    }

    /** Convierte "HH:mm" a minutos desde medianoche para comparaciones numéricas. */
    private int horaEnMinutos(String hora) {
        if (hora == null || !hora.contains(":")) return 0;
        String[] p = hora.split(":");
        return Integer.parseInt(p[0]) * 60 + Integer.parseInt(p[1]);
    }

    /**
     * Intenta parsear la nota del profesor como número.
     * Si es texto libre, asigna 1.0 por el hecho de tener una nota escrita.
     */
    private double parsearNota(String nota) {
        if (nota == null || nota.isBlank()) return 0.0;
        try {
            return Double.parseDouble(nota.trim().replace(",", "."));
        } catch (NumberFormatException e) {
            return 1.0;
        }
    }
}
