package teektok.interceptor;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import teektok.utils.BaseContext;
import teektok.utils.JwtUtils;

import java.io.PrintWriter;

@Slf4j
@Component
public class TokenInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        log.info("TokenInterceptor 拦截到请求: {} {}", request.getMethod(), request.getRequestURI()); // 新增日志

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        //1.获取请求路径
        String requestURI = request.getRequestURI();
        //2.排除登录接口
        if(requestURI.contains("/login")){
            log.info("登录请求，放行");
            return true;
        }
        //3.判断是否为可选鉴权接口 (游客可访问，但带Token需解析)
        boolean isOptionalAuth = false;
        // 视频列表、视频详情(ID为数字)、评论列表
        if (requestURI.contains("/api/video/list") || 
            (requestURI.matches(".*/api/video/\\d+$") && "GET".equalsIgnoreCase(request.getMethod())) ||
            requestURI.contains("/api/comment/list")) {
            isOptionalAuth = true;
        }

        //4.获取请求头中的token
        String token = request.getHeader("token");

        //5.Token为空的处理
        if(token==null||token.isEmpty()){
            if (isOptionalAuth) {
                log.info("可选鉴权接口且无Token，游客放行");
                return true;
            }
            log.info("令牌不存在，响应401");
            response.setStatus(401);
            response.setContentType("application/json;charset=UTF-8");
            PrintWriter writer = response.getWriter();
            writer.write("{\"code\":401,\"msg\":\"未登录\",\"data\":null}");
            writer.flush();
            return false;
        }

        //6.验证token合法性
        try {
            Claims claims = JwtUtils.parseToken(token);
            Long userId = Long.valueOf(claims.get("userId").toString());
            BaseContext.setCurrentId(userId);
        } catch (Exception e) {
            log.info("令牌非法，响应401");
            response.setStatus(401);
            response.setContentType("application/json;charset=UTF-8");
            PrintWriter writer = response.getWriter();
            writer.write("{\"code\":401,\"msg\":\"令牌非法\",\"data\":null}");
            writer.flush();
            return false;
        }
        //放行
        log.info("令牌合法，放行");
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        BaseContext.removeCurrentId();
    }
}
