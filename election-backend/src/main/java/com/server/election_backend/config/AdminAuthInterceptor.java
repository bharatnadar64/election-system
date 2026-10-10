package com.server.election_backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class AdminAuthInterceptor implements HandlerInterceptor {

    @Value("${admin.secret-key}")
    private String adminSecret;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // Handle CORS preflight requests
        if (request.getMethod().equals("OPTIONS")) return true;

        String providedKey = request.getHeader("X-Admin-Secret");

        if (adminSecret.equals(providedKey)) {
            return true;
        }

        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.getWriter().write("Unauthorized: Invalid Admin Key");
        return false;
    }
}