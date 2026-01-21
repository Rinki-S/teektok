package teektok.utils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import teektok.config.MediaProperties;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Component
public class LocalMediaOperator {

    @Autowired
    private MediaProperties mediaProperties;

    public String upload(byte[] content, String originalFilename) throws Exception {
        String baseUrl = mediaProperties.getBaseUrl();
        String localDir = mediaProperties.getLocalDir();

        String dir = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
        String ext = "";
        if (originalFilename != null) {
            int idx = originalFilename.lastIndexOf(".");
            if (idx >= 0 && idx < originalFilename.length() - 1) {
                ext = originalFilename.substring(idx);
            }
        }
        String newFileName = UUID.randomUUID() + ext;
        String objectName = dir + "/" + newFileName;

        Path target = Paths.get(localDir).resolve(objectName).normalize().toAbsolutePath();
        Files.createDirectories(target.getParent());
        Files.write(target, content);

        String normalizedBaseUrl = baseUrl == null ? "" : baseUrl.replaceAll("/+$", "");
        return normalizedBaseUrl + "/uploads/" + objectName;
    }
}

