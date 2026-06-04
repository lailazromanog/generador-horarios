package com.horarios.generador.model;

import java.util.ArrayList;
import java.util.List;

/** Grupo/sección de una materia, con el profesor que la dicta y sus bloques horarios. */
public class Profesor {

    private Long id;
    private String nombre;
    /** Nota personal del estudiante sobre este profesor (puede ser numérica o texto). */
    private String nota;
    /** Identificador del grupo en el sistema universitario (ej: "IAMG_M-1"). */
    private String idGrupo;
    /** Código numérico del grupo (ej: "1562"). */
    private String codigoGrupo;
    /** Tipo de sesión: "lec" para cátedra, "lab" para laboratorio. */
    private String tipo;
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

    public String getIdGrupo() { return idGrupo; }
    public void setIdGrupo(String idGrupo) { this.idGrupo = idGrupo; }

    public String getCodigoGrupo() { return codigoGrupo; }
    public void setCodigoGrupo(String codigoGrupo) { this.codigoGrupo = codigoGrupo; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public List<BloqueHorario> getBloques() { return bloques; }
    public void setBloques(List<BloqueHorario> bloques) { this.bloques = bloques; }
}
