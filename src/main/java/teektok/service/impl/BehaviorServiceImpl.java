package teektok.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import teektok.dto.comment.CommentCreateDTO;
import teektok.entity.UserBehavior;
import teektok.mapper.UserBehaviorMapper;
import teektok.mapper.VideoStatMapper;
import teektok.service.IBehaviorService;

@Slf4j
@Service
public class BehaviorServiceImpl extends ServiceImpl<UserBehaviorMapper, UserBehavior> implements IBehaviorService {

    @Override
    public void play(Long videoId, Long userId) {

    }

    @Override
    public void like(Long videoId, Long userId) {

    }

    @Override
    public void unlike(Long videoId, Long userId) {

    }

    @Override
    public void comment(CommentCreateDTO commentCreateDTO, Long userId) {

    }

    @Override
    public void share(Long videoId, Long userId) {

    }
}
