package com.horarios.generador.dto;

import java.util.List;

/** Resultado completo del horario generado: entradas, puntuación y advertencias de choque. */
public class ResultadoHorario {

    private List<EntradaHorario> entradas;
    private double puntuacion;
    private List<String> choques;
    private boolean tieneChoques;

    public ResultadoHorario() {}

    public List<EntradaHorario> getEntradas() { return entradas; }
    public void setEntradas(List<EntradaHorario> entradas) { this.entradas = entradas; }

    public double getPuntuacion() { return puntuacion; }
    public void setPuntuacion(double puntuacion) { this.puntuacion = puntuacion; }

    public List<String> getChoques() { return choques; }
    public void setChoques(List<String> choques) { this.choques = choques; }

    public boolean isTieneChoques() { return tieneChoques; }
    public void setTieneChoques(boolean tieneChoques) { this.tieneChoques = tieneChoques; }
}
