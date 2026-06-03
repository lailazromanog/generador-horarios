package com.horarios.generador.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/** Controlador MVC que sirve la página principal de la aplicación. */
@Controller
public class VistaController {

    /** Muestra la página principal del generador de horarios. */
    @GetMapping("/")
    public String index() {
        return "index";
    }
}
