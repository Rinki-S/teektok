package teektok.dto.dm;

import lombok.Data;

@Data
public class DmSendDTO {
    private Long targetId;
    private Integer msgType;
    private String content;
    private Long videoId;
}
