package teektok.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import teektok.dto.audit.AdminLoginDTO;
import teektok.dto.audit.AdminLoginVO;
import teektok.dto.audit.VideoAuditDTO;
import teektok.entity.Admin;
import teektok.entity.User;
import teektok.mapper.AdminMapper;
import teektok.mapper.UserMapper;
import teektok.mapper.VideoMapper;
import teektok.service.IAdminService;

@Slf4j
@Service
public class AdminServiceImpl extends ServiceImpl<AdminMapper, Admin> implements IAdminService {
    @Autowired
    private UserMapper userMapper; // 需要操作用户表

    @Autowired
    private VideoMapper videoMapper; // 需要操作视频表
    
    @Override
    public AdminLoginVO login(AdminLoginDTO dto) {
        // 1. 查用户
        Admin admin = this.getOne(new LambdaQueryWrapper<Admin>()
                .eq(Admin::getUsername, dto.getUsername()));

        // 2. 校验是否存在
        if (admin == null) {
            throw new RuntimeException("管理员不存在");
        }

        // 3. 校验密码 (TODO: 后续接入 BCryptPasswordEncoder)
        if (!admin.getPassword().equals(dto.getPassword())) {
            throw new RuntimeException("密码错误");
        }

        // 4. 生成 Token (模拟)
        String token = "admin-token-" + admin.getId();

        // 5. 封装返回
        AdminLoginVO vo = new AdminLoginVO();
        vo.setToken(token);
        // 如果 VO 里有 username 或 avatar 也可以在这里 set
        return vo;
    }

    @Override
    public void ChangeUserStatus(Long userId, Integer status) {
        // 逻辑：直接更新 User 表的 status 字段
        User user = new User();
        user.setId(userId);
        user.setStatus(status);

        int rows = userMapper.updateById(user);
        if (rows == 0) {
            throw new RuntimeException("用户不存在或更新失败");
        }
    }

    @Override
    public void auditVideo(VideoAuditDTO dto) {

    }

    @Override
    public void setHotVideo(Long videoId, Boolean hot) {

    }

    @Override
    public void deleteVideo(Long videoId) {

    }
}
