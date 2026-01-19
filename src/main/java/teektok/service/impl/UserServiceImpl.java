package teektok.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import teektok.dto.user.UserLoginDTO;
import teektok.dto.user.UserLoginVO;
import teektok.dto.user.UserRegisterDTO;
import teektok.entity.User;
import teektok.mapper.UserMapper;
import teektok.service.IUserService;
import teektok.utils.JwtUtils;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class UserServiceImpl implements IUserService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Override
    public void register(UserRegisterDTO userRegisterDTO) {
        if (userRegisterDTO.getUsername() == null || userRegisterDTO.getUsername().isBlank()) {
            throw new RuntimeException("用户名不能为空");
        }
        if (userRegisterDTO.getPassword() == null || userRegisterDTO.getPassword().isBlank()) {
            throw new RuntimeException("密码不能为空");
        }
        //TODO：完成注册功能
        LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(User::getUsername, userRegisterDTO.getUsername());
        Long count = userMapper.selectCount(queryWrapper);

        if(count > 0) {throw new RuntimeException("用户名已存在");}

        User user = new User();
        user.setUsername(userRegisterDTO.getUsername());
        user.setPassword(userRegisterDTO.getPassword());
        user.setStatus(1);

        int result = userMapper.insert(user);
        if(result<=0){
            throw new RuntimeException("注册失败，请稍后重试");
        }

    }

    @Override
    public UserLoginVO login(UserLoginDTO userLoginDTO) {
        if (userLoginDTO.getUsername() == null || userLoginDTO.getPassword() == null) {
            throw new RuntimeException("用户名或密码不能为空");
        }

        // TODO 1：根据用户名查询用户
        LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(User::getUsername, userLoginDTO.getUsername());
        User user = userMapper.selectOne(queryWrapper);
        // TODO 2：校验密码是否正确
        if (user == null || !user.getPassword().equals(userLoginDTO.getPassword())) {
            throw new RuntimeException("用户名或密码错误");
        }
        // TODO 3：生成 token
        Map<String, Object> claims =new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("username", user.getUsername());
        claims.put("password", user.getPassword());
        String token= JwtUtils.createToken(claims);
        // TODO 4：封装 VO 返回
        UserLoginVO userLoginVO = new UserLoginVO();
        userLoginVO.setUserId(user.getId());
        userLoginVO.setToken(token);
        return  userLoginVO;
    }

}
