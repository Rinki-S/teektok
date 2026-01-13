package teektok.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import teektok.dto.audit.AdminLoginDTO;
import teektok.dto.audit.AdminLoginVO;
import teektok.dto.audit.VideoAuditDTO;
import teektok.service.IAdminService;

@Slf4j
@Service
public class AdminServiceImpl implements IAdminService {
    @Override
    public AdminLoginVO login(AdminLoginDTO dto) {
        return null;
    }

    @Override
    public void ChangeUserStatus(Long userId, Integer status) {

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
