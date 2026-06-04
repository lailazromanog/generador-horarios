package com.horarios.generador.dto.json;

import java.util.List;

/** DTO de deserialización para un grupo/sección en el archivo materias.json. */
public class GrupoJson {

    private String id;
    private String code;
    private String type;
    private String professor;
    private List<SesionJson> sessions;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getProfessor() { return professor; }
    public void setProfessor(String professor) { this.professor = professor; }

    public List<SesionJson> getSessions() { return sessions; }
    public void setSessions(List<SesionJson> sessions) { this.sessions = sessions; }
}
