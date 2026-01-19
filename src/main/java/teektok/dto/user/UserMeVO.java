package teektok.dto.user;

import lombok.Data;
import java.util.List;

@Data
public class UserMeVO {
    private Long id;
    private String username;
    private String avatar;
    private Long followingCount; // 关注数量
    private Long followerCount;  // 粉丝数量
    private List<String> videoUrls; // 用户作品URL列表
    private List<String> videoCoverUrls; // 用户作品封面URL列表
}