package teektok.service;

import teektok.VO.PageResult;
import teektok.entity.DmMessage;

public interface IDmService {
    void sendText(Long senderId, Long targetId, String content);

    void sendVideo(Long senderId, Long targetId, Long videoId);

    PageResult<DmMessage> listSessionMessages(Long userId, Long targetId, int page, int size);
}
