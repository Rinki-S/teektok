package teektok.dto.video;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
@Schema(description = "视频上传请求")
public class VideoUploadDTO {

    @Schema(description = "视频文件")
    private MultipartFile file;

    @Schema(description = "视频标题")
    private String title;

    @Schema(description = "视频简介")
    private String description;
}
