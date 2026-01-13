package teektok.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import teektok.dto.user.UserLoginDTO;
import teektok.dto.user.UserLoginVO;
import teektok.dto.user.UserRegisterDTO;
import teektok.service.IUserService;

@Slf4j
@Service
public class UserServiceImpl implements IUserService {
    @Override
    public void register(UserRegisterDTO userRegisterDTO) {
        if (userRegisterDTO.getUsername() == null || userRegisterDTO.getUsername().isBlank()) {
            throw new RuntimeException("用户名不能为空");
        }
        if (userRegisterDTO.getPassword() == null || userRegisterDTO.getPassword().isBlank()) {
            throw new RuntimeException("密码不能为空");
        }
        //TODO：完成注册功能
    }

    @Override
    public UserLoginVO login(UserLoginDTO userLoginDTO) {
        if (userLoginDTO.getUsername() == null || userLoginDTO.getPassword() == null) {
            throw new RuntimeException("用户名或密码不能为空");
        }

        // TODO 1：根据用户名查询用户
        // TODO 2：校验密码是否正确
        // TODO 3：生成 token
        // TODO 4：封装 VO 返回

        return null;
    }
}
