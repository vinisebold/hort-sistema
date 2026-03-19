package dev.vinisebold.hort.dto.response;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CursorResponse<T> {
  private List<T> data;
  private Long totalCount;
  private Integer nextCursor;
  private boolean hasNext;
}
