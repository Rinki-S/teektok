package teektok.dto.relation;

import lombok.Data;

@Data
public class RelationActionDTO {
    private Long targetId;
    /**
     * 1: 关注, 2: 取消关注
     */
    private Integer actionType;
}
