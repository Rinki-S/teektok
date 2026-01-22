package teektok.service;

import teektok.VO.PageResult;
import teektok.dto.audit.AdminLoginDTO;
import teektok.dto.audit.AdminLoginVO;
import teektok.dto.audit.AdminVideoVO;
import teektok.dto.audit.VideoAuditDTO;
import teektok.entity.User;

public interface IAdminService {
    /**
     * 管理员登录
     */
    AdminLoginVO login(AdminLoginDTO dto);

    /**
     * 冻结 / 解封用户
     */
    void ChangeUserStatus(Long userId, Integer status);

    /**
     * 审核视频
     */
    void auditVideo(VideoAuditDTO dto);

    /**
     * 设置 / 取消热门视频
     */
    void setHotVideo(Long videoId, Boolean hot);

    /**
     * 删除视频（逻辑删除）
     */
    void deleteVideo(Long videoId);


    /**
     * 分页查询用户列表
     * @param page 页码
     * @param pageSize 每页大小
     * @return 分页结果
     */
    PageResult<User> getUserList(Integer page, Integer pageSize);

    PageResult<AdminVideoVO> getVideoList(Integer page, Integer pageSize, Integer status, Integer isHot);

    AdminVideoVO getVideoDetail(Long videoId);
}
