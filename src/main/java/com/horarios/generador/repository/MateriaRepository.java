package com.horarios.generador.repository;

import com.horarios.generador.model.BloqueHorario;
import com.horarios.generador.model.Materia;
import com.horarios.generador.model.Profesor;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Almacenamiento en memoria para materias, profesores y bloques horarios.
 * No requiere base de datos; los datos se pierden al reiniciar la aplicación.
 */
@Repository
public class MateriaRepository {

    private final List<Materia> materias = new ArrayList<>();
    /** Lista plana de todos los profesores para búsqueda rápida por id. */
    private final List<Profesor> profesores = new ArrayList<>();

    private final AtomicLong contadorMaterias  = new AtomicLong(1);
    private final AtomicLong contadorProfesores = new AtomicLong(1);
    private final AtomicLong contadorBloques    = new AtomicLong(1);

    // ── Materias ──────────────────────────────────────────────────────────────

    /** Guarda una nueva materia asignándole un id auto-incremental. */
    public Materia guardarMateria(Materia materia) {
        materia.setId(contadorMaterias.getAndIncrement());
        materias.add(materia);
        return materia;
    }

    /** Devuelve todas las materias registradas. */
    public List<Materia> listarMaterias() {
        return new ArrayList<>(materias);
    }

    /** Busca una materia por su id; retorna Optional vacío si no existe. */
    public Optional<Materia> buscarMateriaPorId(Long id) {
        return materias.stream()
                .filter(m -> m.getId().equals(id))
                .findFirst();
    }

    // ── Profesores ────────────────────────────────────────────────────────────

    /**
     * Guarda un profesor asignándole un id, lo agrega a su materia
     * y también al índice global de profesores.
     */
    public Profesor guardarProfesor(Profesor profesor, Materia materia) {
        profesor.setId(contadorProfesores.getAndIncrement());
        materia.getProfesores().add(profesor);
        profesores.add(profesor);
        return profesor;
    }

    /** Busca un profesor en el índice global por su id. */
    public Optional<Profesor> buscarProfesorPorId(Long id) {
        return profesores.stream()
                .filter(p -> p.getId().equals(id))
                .findFirst();
    }

    // ── Bloques horarios ──────────────────────────────────────────────────────

    /** Agrega un bloque horario a un profesor existente. */
    public BloqueHorario guardarBloque(BloqueHorario bloque, Profesor profesor) {
        bloque.setId(contadorBloques.getAndIncrement());
        profesor.getBloques().add(bloque);
        return bloque;
    }
}
