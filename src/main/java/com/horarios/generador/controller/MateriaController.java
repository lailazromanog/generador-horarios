package com.horarios.generador.controller;

import com.horarios.generador.dto.ResultadoHorario;
import com.horarios.generador.dto.SeleccionHorario;
import com.horarios.generador.model.BloqueHorario;
import com.horarios.generador.model.Materia;
import com.horarios.generador.model.Profesor;
import com.horarios.generador.repository.MateriaRepository;
import com.horarios.generador.service.HorarioService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * Controlador REST que expone los endpoints para gestionar materias,
 * profesores, bloques horarios y la generación del horario.
 */
@RestController
@RequestMapping("/api")
public class MateriaController {

    private final MateriaRepository repositorio;
    private final HorarioService    horarioService;

    public MateriaController(MateriaRepository repositorio, HorarioService horarioService) {
        this.repositorio    = repositorio;
        this.horarioService = horarioService;
    }

    // ── Materias ──────────────────────────────────────────────────────────────

    /** Retorna la lista completa de materias con sus profesores y bloques. */
    @GetMapping("/materias")
    public List<Materia> listarMaterias() {
        return repositorio.listarMaterias();
    }

    /**
     * Crea una nueva materia.
     * Cuerpo esperado: { "nombre": "Cálculo I" }
     */
    @PostMapping("/materias")
    public ResponseEntity<Materia> crearMateria(@RequestBody Materia materia) {
        if (materia.getNombre() == null || materia.getNombre().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        Materia guardada = repositorio.guardarMateria(materia);
        return ResponseEntity.ok(guardada);
    }

    // ── Profesores ────────────────────────────────────────────────────────────

    /**
     * Agrega un profesor a una materia existente.
     * Cuerpo esperado: { "nombre": "Dr. García", "nota": "8.5" }
     */
    @PostMapping("/materias/{id}/profesores")
    public ResponseEntity<Profesor> agregarProfesor(
            @PathVariable Long id,
            @RequestBody Profesor profesor) {

        Optional<Materia> optMateria = repositorio.buscarMateriaPorId(id);
        if (optMateria.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (profesor.getNombre() == null || profesor.getNombre().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        Profesor guardado = repositorio.guardarProfesor(profesor, optMateria.get());
        return ResponseEntity.ok(guardado);
    }

    // ── Bloques horarios ──────────────────────────────────────────────────────

    /**
     * Agrega un bloque horario a un profesor existente.
     * Cuerpo esperado: { "dia": "LUNES", "horaInicio": "08:00", "horaFin": "10:00" }
     */
    @PostMapping("/profesores/{id}/bloques")
    public ResponseEntity<BloqueHorario> agregarBloque(
            @PathVariable Long id,
            @RequestBody BloqueHorario bloque) {

        Optional<Profesor> optProfesor = repositorio.buscarProfesorPorId(id);
        if (optProfesor.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (bloque.getDia() == null
                || bloque.getHoraInicio() == null
                || bloque.getHoraFin() == null) {
            return ResponseEntity.badRequest().build();
        }
        BloqueHorario guardado = repositorio.guardarBloque(bloque, optProfesor.get());
        return ResponseEntity.ok(guardado);
    }

    // ── Generación de horario ─────────────────────────────────────────────────

    /**
     * Genera el horario a partir de las selecciones del estudiante.
     * Cuerpo esperado: [ { "materiaId": 1, "profesorId": 2 }, ... ]
     */
    @PostMapping("/horario/generar")
    public ResponseEntity<ResultadoHorario> generarHorario(
            @RequestBody List<SeleccionHorario> selecciones) {

        if (selecciones == null || selecciones.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        ResultadoHorario resultado = horarioService.generarHorario(selecciones);
        return ResponseEntity.ok(resultado);
    }
}
