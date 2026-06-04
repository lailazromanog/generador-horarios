package com.horarios.generador.dto.json;

import java.util.List;

/** DTO de deserialización para una materia en el archivo materias.json. */
public class MateriaJson {

    private String id;
    private String name;
    private int credits;
    private List<GrupoJson> groups;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getCredits() { return credits; }
    public void setCredits(int credits) { this.credits = credits; }

    public List<GrupoJson> getGroups() { return groups; }
    public void setGroups(List<GrupoJson> groups) { this.groups = groups; }
}
