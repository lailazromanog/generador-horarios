package com.horarios.generador;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.horarios.generador.model.BloqueHorario;
import com.horarios.generador.model.DiaSemana;
import com.horarios.generador.model.Materia;
import com.horarios.generador.model.Profesor;
import com.horarios.generador.repository.MateriaRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.HashSet;
import java.util.Set;

@Component
public class DataLoader implements CommandLineRunner {

    private static final DiaSemana[] DIA_MAP = {
        DiaSemana.LUNES,
        DiaSemana.MARTES,
        DiaSemana.MIERCOLES,
        DiaSemana.JUEVES,
        DiaSemana.VIERNES,
        DiaSemana.SABADO
    };

    private final MateriaRepository repositorio;
    private final ObjectMapper mapper = new ObjectMapper();

    public DataLoader(MateriaRepository repositorio) {
        this.repositorio = repositorio;
    }

    @Override
    public void run(String... args) throws Exception {
        InputStream is = new ClassPathResource("data/materias.json").getInputStream();
        JsonNode cursos = mapper.readTree(is);

        for (JsonNode curso : cursos) {
            Materia materia = new Materia();
            materia.setNombre(curso.get("name").asText());
            materia.setCodigoExterno(curso.get("id").asText());
            materia.setCreditos(curso.get("credits").asInt());
            repositorio.guardarMateria(materia);

            for (JsonNode grupo : curso.get("groups")) {
                String nombreProfesor = grupo.get("professor").asText().trim();
                String codigo = grupo.get("code").asText();
                String tipo   = grupo.get("type").asText();

                if (nombreProfesor.isEmpty()) nombreProfesor = "Por asignar";

                String etiqueta = nombreProfesor + " [" + codigo
                        + (tipo.equals("lab") ? " - Lab" : "") + "]";

                Profesor profesor = new Profesor();
                profesor.setNombre(etiqueta);
                profesor.setNota("");
                // Guardar código y tipo por separado para el botón "Ver Códigos"
                profesor.setCodigoGrupo(codigo);
                profesor.setTipo(tipo);
                repositorio.guardarProfesor(profesor, materia);

                // Deduplica sesiones con la misma clave dia+inicio+fin
                Set<String> vistas = new HashSet<>();
                for (JsonNode session : grupo.get("sessions")) {
                    int day = session.get("day").asInt();
                    if (day < 0 || day >= DIA_MAP.length) continue;

                    String horaInicio = session.get("startTime").asText();
                    String horaFin    = session.get("endTime").asText();
                    String clave = day + "_" + horaInicio + "_" + horaFin;
                    if (!vistas.add(clave)) continue;

                    BloqueHorario bloque = new BloqueHorario();
                    bloque.setDia(DIA_MAP[day]);
                    bloque.setHoraInicio(horaInicio);
                    bloque.setHoraFin(horaFin);
                    repositorio.guardarBloque(bloque, profesor);
                }
            }
        }
    }
}
