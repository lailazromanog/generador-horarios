package com.horarios.generador.dto;

import com.horarios.generador.model.DiaSemana;

/** Un bloque de tiempo dentro del horario generado, listo para mostrar en la grilla. */
public class EntradaHorario {

    private Long materiaId;
    private String materiaNombre;
    private Long profesorId;
    private String profesorNombre;
    private DiaSemana dia;
    private String horaInicio;
    private String horaFin;
    /** Color CSS asignado a la materia para distinguirla visualmente. */
    private String color;

    public EntradaHorario() {}

    public Long getMateriaId() { return materiaId; }
    public void setMateriaId(Long materiaId) { this.materiaId = materiaId; }

    public String getMateriaNombre() { return materiaNombre; }
    public void setMateriaNombre(String materiaNombre) { this.materiaNombre = materiaNombre; }

    public Long getProfesorId() { return profesorId; }
    public void setProfesorId(Long profesorId) { this.profesorId = profesorId; }

    public String getProfesorNombre() { return profesorNombre; }
    public void setProfesorNombre(String profesorNombre) { this.profesorNombre = profesorNombre; }

    public DiaSemana getDia() { return dia; }
    public void setDia(DiaSemana dia) { this.dia = dia; }

    public String getHoraInicio() { return horaInicio; }
    public void setHoraInicio(String horaInicio) { this.horaInicio = horaInicio; }

    public String getHoraFin() { return horaFin; }
    public void setHoraFin(String horaFin) { this.horaFin = horaFin; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
}
