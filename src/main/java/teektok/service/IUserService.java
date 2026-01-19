package teektok.service;

import teektok.dto.user.UserLoginDTO;
import teektok.dto.user.UserLoginVO;
import teektok.dto.user.UserMeVO;
import teektok.dto.user.UserRegisterDTO;

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
}
