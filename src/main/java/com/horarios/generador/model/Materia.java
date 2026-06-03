package com.horarios.generador.model;

import java.util.ArrayList;
import java.util.List;

/** Asignatura universitaria con sus profesores disponibles. */
public class Materia {

    private Long id;
    private String nombre;
    private List<Profesor> profesores = new ArrayList<>();

    public Materia() {}

    public Materia(Long id, String nombre) {
        this.id = id;
        this.nombre = nombre;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public List<Profesor> getProfesores() { return profesores; }
    public void setProfesores(List<Profesor> profesores) { this.profesores = profesores; }
}
