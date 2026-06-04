package com.horarios.generador.model;

import java.util.ArrayList;
import java.util.List;

/** Asignatura universitaria con sus grupos/profesores disponibles. */
public class Materia {

    private Long id;
    /** Código original de la materia en el sistema universitario (ej: "IAMG_M"). */
    private String codigoExterno;
    private String nombre;
    private int creditos;
    private List<Profesor> profesores = new ArrayList<>();

    public Materia() {}

    public Materia(Long id, String nombre) {
        this.id = id;
        this.nombre = nombre;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCodigoExterno() { return codigoExterno; }
    public void setCodigoExterno(String codigoExterno) { this.codigoExterno = codigoExterno; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public int getCreditos() { return creditos; }
    public void setCreditos(int creditos) { this.creditos = creditos; }

    public List<Profesor> getProfesores() { return profesores; }
    public void setProfesores(List<Profesor> profesores) { this.profesores = profesores; }
}
