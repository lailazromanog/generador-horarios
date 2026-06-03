package com.horarios.generador.model;

/** Representa un bloque de tiempo en el horario de un profesor. */
public class BloqueHorario {

    private Long id;
    private DiaSemana dia;
    private String horaInicio; // formato "HH:mm"
    private String horaFin;    // formato "HH:mm"

    public BloqueHorario() {}

    public BloqueHorario(Long id, DiaSemana dia, String horaInicio, String horaFin) {
        this.id = id;
        this.dia = dia;
        this.horaInicio = horaInicio;
        this.horaFin = horaFin;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public DiaSemana getDia() { return dia; }
    public void setDia(DiaSemana dia) { this.dia = dia; }

    public String getHoraInicio() { return horaInicio; }
    public void setHoraInicio(String horaInicio) { this.horaInicio = horaInicio; }

    public String getHoraFin() { return horaFin; }
    public void setHoraFin(String horaFin) { this.horaFin = horaFin; }
}
