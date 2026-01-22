package teektok.dto.user;

import lombok.Data;

@Data
public class UserProfileVO {
    private Long id;
    private String username;
    private String avatar;
    private Long followingCount;
    private Long followerCount;
    private Long likeCount;
    private Boolean isFollowing;
}

