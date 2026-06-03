package com.horarios.generador.model;

import java.util.ArrayList;
import java.util.List;

/** Profesor que dicta una materia, con sus bloques horarios disponibles. */
public class Profesor {

    private Long id;
    private String nombre;
    /** Nota personal del estudiante sobre este profesor (puede ser numérica o texto). */
    private String nota;
    private List<BloqueHorario> bloques = new ArrayList<>();

    public Profesor() {}

    public Profesor(Long id, String nombre, String nota) {
        this.id = id;
        this.nombre = nombre;
        this.nota = nota;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getNota() { return nota; }
    public void setNota(String nota) { this.nota = nota; }

    public List<BloqueHorario> getBloques() { return bloques; }
    public void setBloques(List<BloqueHorario> bloques) { this.bloques = bloques; }
}
