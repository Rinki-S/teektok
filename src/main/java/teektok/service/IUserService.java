package teektok.service;

import teektok.dto.user.UserLoginDTO;
import teektok.dto.user.UserLoginVO;
import teektok.dto.user.UserMeVO;
import teektok.dto.user.UserRegisterDTO;
import teektok.entity.User;

public interface IUserService {

    /*
    * 用户注册
    * */
    void register(UserRegisterDTO userRegisterDTO);

    /*
     * 用户登录
     */
    UserLoginVO login(UserLoginDTO userLoginDTO);


    /**
     * 获取当前登录用户的主页详情信息
     */
    UserMeVO getMyInfo(Long userId);

    /**
     * 获取用户信息（优先查 Redis 缓存）
     */
    User getUserCached(Long userId);
}
