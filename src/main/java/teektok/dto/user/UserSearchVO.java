package teektok.dto.user;

import lombok.Data;

@Data
public class UserSearchVO {
    private Long id;
    private String username;
    private String avatar;
    private Boolean isFollowing;
}

