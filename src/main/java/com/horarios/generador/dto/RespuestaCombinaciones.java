package com.horarios.generador.dto;

import java.util.List;

/**
 * Envuelve los resultados de la generación de combinaciones e incluye
 * metadatos para informar al usuario sobre el espacio de búsqueda.
 */
public class RespuestaCombinaciones {

    /** Las mejores combinaciones calculadas (máximo MAX_MOSTRAR). */
    private List<ResultadoHorario> combinaciones;
    /** Total matemático de combinaciones posibles (producto cartesiano). */
    private long totalPosibles;
    /** Cuántas combinaciones se evaluaron realmente (limitado por MAX_CALCULAR). */
    private int totalCalculadas;

    public List<ResultadoHorario> getCombinaciones() { return combinaciones; }
    public void setCombinaciones(List<ResultadoHorario> combinaciones) { this.combinaciones = combinaciones; }

    public long getTotalPosibles() { return totalPosibles; }
    public void setTotalPosibles(long totalPosibles) { this.totalPosibles = totalPosibles; }

    public int getTotalCalculadas() { return totalCalculadas; }
    public void setTotalCalculadas(int totalCalculadas) { this.totalCalculadas = totalCalculadas; }
}
