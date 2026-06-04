package com.horarios.generador.dto.json;

/** DTO de deserialización para una sesión horaria en el archivo materias.json. */
public class SesionJson {

    private String startTime;
    private String endTime;
    /** Día de la semana: 0=Lunes, 1=Martes, 2=Miércoles, 3=Jueves, 4=Viernes, 5=Sábado. */
    private int day;

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }

    public int getDay() { return day; }
    public void setDay(int day) { this.day = day; }
}
