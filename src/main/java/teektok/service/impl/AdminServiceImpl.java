package teektok.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import teektok.VO.PageResult;
import teektok.dto.audit.AdminLoginDTO;
import teektok.dto.audit.AdminLoginVO;
import teektok.dto.audit.VideoAuditDTO;
import teektok.dto.commen.ResultCode;
import teektok.entity.Admin;
import teektok.entity.User;
import teektok.entity.Video;
import teektok.mapper.AdminMapper;
import teektok.mapper.UserMapper;
import teektok.mapper.VideoMapper;
import teektok.mapper.VideoStatMapper;
import teektok.service.IAdminService;
import teektok.utils.JwtUtils;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class AdminServiceImpl extends ServiceImpl<AdminMapper, Admin> implements IAdminService {
    @Autowired
    private UserMapper userMapper; // 需要操作用户表

    @Autowired
    private VideoMapper videoMapper; // 需要操作视频表

    @Autowired
    private VideoStatMapper videoStatMapper; // 需要操作视频统计数据表

    @Override
    public AdminLoginVO login(AdminLoginDTO dto) {
        // 1. 查管理员用户
        Admin admin = this.getOne(new LambdaQueryWrapper<Admin>()
                .eq(Admin::getUsername, dto.getUsername()));

        if (admin == null) {
            throw new RuntimeException("管理员不存在"); // 管理员不存在
        }

        // 2. 校验密码 (明文比对，生产环境建议用 BCrypt)
        if (!admin.getPassword().equals(dto.getPassword())) {
            throw new RuntimeException("密码错误"); // 密码错误
        }

        // 3. 生成 Token
        Map<String, Object> claims = new HashMap<>();
        claims.put("id", admin.getId());
        claims.put("role", "admin");
        String token = JwtUtils.createToken(claims);

        // 4. 返回
        AdminLoginVO vo = new AdminLoginVO();
        vo.setToken(token);
        return vo;
    }

    @Override
    public void ChangeUserStatus(Long userId, Integer status) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }

        user.setStatus(status);
        userMapper.updateById(user);
    }

    @Override
    public void auditVideo(VideoAuditDTO dto) {
        Video video = videoMapper.selectById(dto.getVideoId());
        if (video == null) {
            throw new RuntimeException("视频不存在");
        }

        video.setStatus(dto.getStatus());

        videoMapper.updateById(video);
    }

    @Override
    public void setHotVideo(Long videoId, Boolean hot) {
        Video video = videoMapper.selectById(videoId);
        if (video == null) {
            throw new RuntimeException("视频不存在");
        }

        // 使用 UpdateWrapper 只更新 is_hot 字段，效率更高
        LambdaUpdateWrapper<Video> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(Video::getId, videoId)
                .set(Video::getIsHot, hot ? 1 : 0);

        videoMapper.update(null, updateWrapper);
    }

    @Override
    public void deleteVideo(Long videoId) {
        // 1. 检查视频是否存在
        Video video = videoMapper.selectById(videoId);
        if (video == null) {
            throw new RuntimeException("视频不存在");
        }

        // 2. 删除视频主表数据
        videoMapper.deleteById(videoId);

        // 3. 删除视频统计表数据 (VideoStat)
        videoStatMapper.deleteById(videoId);

        // TODO: 后续可以继续在这里删除 user_behavior 表中关于该视频的记录
        // userBehaviorMapper.delete(new LambdaQueryWrapper<UserBehavior>().eq(UserBehavior::getVideoId, videoId));
    }

    @Override
    public PageResult<User> getUserList(Integer page, Integer pageSize) {
        // 1. 创建 MyBatis-Plus 分页对象
        Page<User> pageInfo = new Page<>(page, pageSize);

        // 2. 执行查询
        userMapper.selectPage(pageInfo, null);

        // 3. 封装为项目通用的 PageResult 并返回
        return new PageResult<>(pageInfo.getRecords(), pageInfo.getTotal());
    }
}

