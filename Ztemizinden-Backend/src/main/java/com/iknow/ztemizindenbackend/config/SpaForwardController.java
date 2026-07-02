package com.iknow.ztemizindenbackend.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
class SpaForwardController {
    @GetMapping({
            "/",
            "/customer",
            "/customer/**",
            "/service",
            "/service/**",
            "/admin",
            "/admin/**",
            "/reset-password"
    })
    String forwardToSpa() {
        return "forward:/index.html";
    }
}
