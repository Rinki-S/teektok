package teektok.interceptor;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import teektok.utils.BaseContext;
import teektok.utils.JwtUtils;

@Slf4j
@Component
public class TokenInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {

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
        //3.获取请求头中的token
        String token = request.getHeader("token");
        //4.判断token是否存在，不存在则响应401
        if(token==null||token.isEmpty()){
            log.info("令牌不存在，响应401");
            response.setStatus(401);
            return false;
        }
        //5.验证token合法性，非法则响应401
        try {
            Claims claims = JwtUtils.parseToken(token);
            Long userId = Long.valueOf(claims.get("userId").toString());
            BaseContext.setCurrentId(userId);
        } catch (Exception e) {
            log.info("令牌非法，响应401");
            response.setStatus(401);
            return false;
        }
        //放行
        log.info("令牌合法，放行");
        return true;
    }
}
