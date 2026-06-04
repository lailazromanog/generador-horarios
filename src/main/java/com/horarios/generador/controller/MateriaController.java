package com.horarios.generador.controller;

import com.horarios.generador.dto.RespuestaCombinaciones;
import com.horarios.generador.dto.SeleccionMultiple;
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
 * Controlador REST con los endpoints de consulta de materias,
 * gestión de bloques horarios y generación de combinaciones.
 *
 * Endpoints eliminados (los datos se cargan desde materias.json al iniciar):
 *   POST /api/materias
 *   POST /api/materias/{id}/profesores
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

    /** Devuelve todas las materias con sus grupos y bloques horarios. */
    @GetMapping("/materias")
    public List<Materia> listarMaterias() {
        return repositorio.listarMaterias();
    }

    // ── Bloques horarios ──────────────────────────────────────────────────────

    /**
     * Agrega un bloque horario a un profesor existente (uso interno/admin).
     * Cuerpo esperado: { "dia": "LUNES", "horaInicio": "08:00", "horaFin": "10:00" }
     */
    @PostMapping("/profesores/{id}/bloques")
    public ResponseEntity<BloqueHorario> agregarBloque(
            @PathVariable Long id,
            @RequestBody BloqueHorario bloque) {

        Optional<Profesor> optProfesor = repositorio.buscarProfesorPorId(id);
        if (optProfesor.isEmpty()) return ResponseEntity.notFound().build();

        if (bloque.getDia() == null || bloque.getHoraInicio() == null || bloque.getHoraFin() == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(repositorio.guardarBloque(bloque, optProfesor.get()));
    }

    // ── Generación de combinaciones ───────────────────────────────────────────

    /**
     * Recibe una lista de {materiaId, profesoresIds[]} y calcula todas las
     * combinaciones posibles. Devuelve las mejores ordenadas por puntaje.
     *
     * Cuerpo esperado:
     * [
     *   { "materiaId": 1, "profesoresIds": [3, 7, 12] },
     *   { "materiaId": 2, "profesoresIds": [15] }
     * ]
     */
    @PostMapping("/horario/generar")
    public ResponseEntity<RespuestaCombinaciones> generarCombinaciones(
            @RequestBody List<SeleccionMultiple> selecciones) {

        if (selecciones == null || selecciones.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(horarioService.generarTodasLasCombinaciones(selecciones));
    }
}
