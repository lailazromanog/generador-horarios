package com.horarios.generador.dto;

import java.util.List;

/**
 * Resultado de una combinación concreta de (materia → profesor).
 * Incluye la grilla de bloques, la puntuación y los choques detectados.
 */
public class ResultadoHorario {

    private List<EntradaHorario> entradas;
    private double               puntuacion;
    private List<String>         choques;
    private boolean              tieneChoques;
    /** Posición de esta combinación en el ranking (1 = mejor). */
    private int                  indiceCombinacion;
    /** Resumen de qué profesor se seleccionó por cada materia. */
    private String               descripcionProfesores;

    public List<EntradaHorario> getEntradas() { return entradas; }
    public void setEntradas(List<EntradaHorario> entradas) { this.entradas = entradas; }

    public double getPuntuacion() { return puntuacion; }
    public void setPuntuacion(double puntuacion) { this.puntuacion = puntuacion; }

    public List<String> getChoques() { return choques; }
    public void setChoques(List<String> choques) { this.choques = choques; }

    public boolean isTieneChoques() { return tieneChoques; }
    public void setTieneChoques(boolean tieneChoques) { this.tieneChoques = tieneChoques; }

    public int getIndiceCombinacion() { return indiceCombinacion; }
    public void setIndiceCombinacion(int indiceCombinacion) { this.indiceCombinacion = indiceCombinacion; }

    public String getDescripcionProfesores() { return descripcionProfesores; }
    public void setDescripcionProfesores(String descripcionProfesores) { this.descripcionProfesores = descripcionProfesores; }
}
