package com.horarios.generador.dto;

import java.util.List;

/**
 * Selección del estudiante para una materia: puede incluir
 * varios profesores simultáneamente para generar todas las combinaciones posibles.
 */
public class SeleccionMultiple {

    private Long        materiaId;
    private List<Long>  profesoresIds;

    public Long getMateriaId() { return materiaId; }
    public void setMateriaId(Long materiaId) { this.materiaId = materiaId; }

    public List<Long> getProfesoresIds() { return profesoresIds; }
    public void setProfesoresIds(List<Long> profesoresIds) { this.profesoresIds = profesoresIds; }
}
