package booksys.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@TableName("user_info")
public class UserInfo {
    @TableId
    private Integer uid;
    private String username;
    private String password;
    private String phone;
    private Integer status;
    private String avator;
    //格式化日期输出格式
    @JsonFormat(pattern = "yyyy-MM-dd")
    private Date createDate;
}
