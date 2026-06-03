package com.horarios.generador.dto;

/** Par (materia, profesor) elegido por el estudiante para generar el horario. */
public class SeleccionHorario {

    private Long materiaId;
    private Long profesorId;

    public SeleccionHorario() {}

    public Long getMateriaId() { return materiaId; }
    public void setMateriaId(Long materiaId) { this.materiaId = materiaId; }

    public Long getProfesorId() { return profesorId; }
    public void setProfesorId(Long profesorId) { this.profesorId = profesorId; }
}
