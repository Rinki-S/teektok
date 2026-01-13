package teektok.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Map;

public class JwtUtils {

    // 1. 生成安全的密钥 (HMAC-SHA 算法要求密钥长度至少为 256 位)
    // 在实际生产中，建议将此密钥配置在环境变量或配置文件中，而不是代码硬编码
    private static final String SECRET_STRING = "teektok_short_video_system_2026_secret_key_0123456789";
    private static final SecretKey KEY = Keys.hmacShaKeyFor(SECRET_STRING.getBytes());

    // 默认过期时间：24 小时
    private static final long DEFAULT_EXPIRATION = 24 * 60 * 60 * 1000;

    /**
     * 生成 JWT Token
     *
     * @param claims 自定义的数据（如用户ID、角色等）
     * @return 生成的 Token 字符串
     */
    public static String createToken(Map<String, Object> claims) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setClaims(claims)              // 设置自定义负载
                .setIssuedAt(new Date(now))     // 签发时间
                .setExpiration(new Date(now + DEFAULT_EXPIRATION)) // 过期时间
                .signWith(KEY, SignatureAlgorithm.HS256) // 签名算法
                .compact();
    }

    /**
     * 解析并验证 JWT Token
     *
     * @param token 传入的 Token
     * @return 解析后的 Claims 对象（包含所有载荷数据）
     * @throws JwtException 如果 Token 无效、过期或被篡改，会抛出异常
     */
    public static Claims parseToken(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(KEY)         // 设置验证密钥
                    .build()
                    .parseClaimsJws(token)      // 解析
                    .getBody();
        } catch (JwtException e) {
            // 在实际项目中，这里可以记录日志或抛出自定义业务异常
            System.err.println("Token 验证失败: " + e.getMessage());
            throw e;
        }
    }
}