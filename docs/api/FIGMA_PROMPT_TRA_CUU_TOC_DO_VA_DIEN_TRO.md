# Prompt Figma — Tra cứu năng lực (tốc độ) & tích hợp điện trở

Tài liệu này mô tả **đúng hành vi và cấu trúc nội dung** đang có trên app dev (`localhost:5100`), kèm **yêu cầu dữ liệu / import** và **hướng mở rộng** (báo thiếu, import/export). Designer **không thay đổi quy tắc nghiệp vụ** (chỉ bố cục, visual, component states).

---

## 1. Nguyên tắc cố định (giữ nguyên khi thiết kế)

1. **Một luồng tra cứu**: người dùng nhập **mã material** (order/material code), **chọn một dòng gợi ý** — không tra cứu trực tiếp bằng tiết diện/kết cấu trên UI.
2. **Tốc độ / năng lực** lấy từ **file master sản xuất** (Excel năng lực — khác file điện trở).
3. **Điện trở** chỉ có ý nghĩa cho công đoạn **XOAN**; tra cứu điện trở **không dùng mã material trong file Excel điện trở**, mà **suy ra khóa** từ `material_description` (tiết diện + kết cấu full, dạng giống cột Excel) + tùy chọn lọc **Loại SP** (Ccc / Acc).
4. **Loại SP trong tên vật liệu** (Cm, Acz, Cm/WC, …) và **Loại SP trong sheet điện trở** có thể khác nhau; mặc định UI hiển thị **mọi Loại SP** khớp tiết diện + kết cấu, có dropdown lọc **Ccc / Acc**.
5. **Nhà máy** trên bảng điện trở: ưu tiên mã đã chuẩn hóa; nếu Excel dùng mã chưa map được thì vẫn hiện **text nhà máy gốc** (không được ẩn dòng).

---

## 2. Cấu trúc trang hiện tại (tham chiếu UI dev)

**Thứ tự dọc trang** sau khi đã chọn material:

1. **Thanh tìm kiếm** (sticky): ô nhập + gợi ý autocomplete (mã + mô tả + công đoạn).
2. **Filter chips**: lọc danh sách gợi ý theo công đoạn (Kéo / Xoắn / …) — không thay đổi logic, chỉ presentation.
3. **Banner tóm tắt năng lực** (gradient xanh): mã material, mô tả, chip công đoạn; các chỉ số:
   - Tốc độ tốt nhất (m/min; với Kéo có thể hiện thêm m/s).
   - Sản lượng tốt nhất (km/ca, kg/ca nếu có).
   - Máy đề xuất + nhà máy tương ứng.
   - Số nhà máy có dữ liệu / chưa có dữ liệu.
4. **Khối điện trở** — **chỉ render khi `process_step_code === 'XOAN'`**; các công đoạn khác **không** có khối này (đừng để chỗ trống gây hiểu nhầm “lỗi”).
5. **Lưới card nhà máy** (3 cột desktop): mỗi card = một nhà máy; trong card có các dòng máy (tốc độ thiết kế, tốc độ thực tế, sản lượng, …). Nhà máy **không có dữ liệu năng lực**: card dashed + CTA **báo thiếu dữ liệu** (đã có API).

---

## 3. Module điện trở — nội dung & cột bắt buộc trên UI

### 3.1. Header khối điện trở

- **Tiêu đề**: ví dụ “Điện trở đo (sheet DATA)” — gợi ý nguồn dữ liệu là sheet DATA của file Excel điện trở.
- **Dòng phụ (khóa tra cứu đã suy ra)** — luôn hiển thị khi parse thành công:
  - `Tiết diện` (số),
  - `Kết cấu` (chuỗi dạng `37/2,63` — dấu phẩy thập phân theo chuẩn VN/Excel),
  - `Loại SP`: hoặc “mọi Loại SP”, hoặc một giá trị cụ thể khi API/ filter quy định.
- **Control**: dropdown **Lọc Loại SP** — các option: `Tất cả` | `Ccc` | `Acc`.

### 3.2. Thanh trạng thái (dưới header)

- Khi có dữ liệu: **Cập nhật mới nhất** = thời điểm quan sát mới nhất trong tập kết quả + **số bản ghi** (`row_count`).
- Khi `row_count === 0` nhưng đã có khóa lookup: nhắn **0 bản ghi khớp** (gợi ý: chưa import / chưa có dòng Excel cho khóa đó).

### 3.3. Bảng chi tiết (scroll ngang + chiều cao giới hạn trên dev ~420px)

| Cột UI (nhãn hiển thị) | Ý nghĩa / nguồn API |
|------------------------|---------------------|
| **Thời điểm** | `observed_at` — ngày/giờ đo (định dạng locale VN). |
| **NM** | Nhà máy: ưu tiên `plant_code`; nếu null thì `plant_code_excel`; không có thì “—”. |
| **SP** | `loai_sp` từ file điện trở (có thể `Ccc`, `Acc`, `Ccc/WC`, …). |
| **Ca** | `ca` (số ca) hoặc “—”. |
| **R max** | Điện trở max: nếu có dạng phân số / text trong nguồn thì hiện raw; không thì số `dien_tro_max`. |
| **R TT** | Điện trở thực tế (`dien_tro_tt`) — số, font mono nhỏ. |
| **Tỷ lệ %R** | `ty_le_dien_tro_pct`. |

**Sắp xếp**: mới nhất lên trên (theo thời điểm, rồi `id`).

### 3.4. Trạng thái lỗi / không parse được

- **Lỗi mạng / API**: thông báo không tải được dữ liệu điện trở (banner cảnh báo).
- **Parse thất bại** (không suy được tiết diện/kết cấu từ mô tả): API trả `message` — hiển thị trong banner “Điện trở (Xoắn)” + nội dung hướng dẫn (không bảng).
- **Loading**: vùng skeleton / placeholder chiều cao cố định.

Designer: chuẩn bị **variant** cho empty / error / loading / có dữ liệu.

---

## 4. File Excel điện trở — cột import (để Figma ghi chú “mapping” hoặc màn admin sau này)

Sheet **`DATA`** (tên sheet cố định trong pipeline hiện tại).

**Bắt buộc** (thiếu thì bỏ qua dòng):

- Cột gồm chữ **Loại** + **SP** (hoặc `loai` + `sp`).
- Cột **Tiết diện** (có thể kèm text như `400 Acc` — hệ thống vẫn lấy được số).
- Cột **Kết cấu** (dạng `61/2,89`).
- Cột **Nhà máy**.

**Tùy chọn nhưng nên có**:

- **NSX** (ngày sản xuất) **hoặc** bộ **Ngày / Tháng / Năm**.
- **Ca**.
- Cột **Điện trở** gồm **max**; cột **Điện trở** gồm **tt** (không chứa “max”).
- Cột **Tỷ lệ** + **điện trở** (không chứa “khối” trong tên — theo rule tìm cột hiện tại).

**Lưu ý thiết kế tương lai**: tên cột tiếng Việt có dấu; hệ thống chuẩn hóa không dấu khi tìm cột — màn “template import” nên nhắc người dùng **giữ đúng keyword** trong header.

---

## 5. File tốc độ / năng lực (tách biệt file điện trở)

- **Nguồn**: Excel master năng lực sản xuất (pipeline `import:excel` / orchestrator — **không** trộn chung sheet với điện trở trong code hiện tại).
- **UI**: banner + card nhà máy + máy (tốc độ thiết kế, tốc độ thực tế, sản lượng, cờ đề xuất).

Figma có thể **visual** phân biệt hai “nguồn dữ liệu” (badge “Năng lực” vs “Điện trở”) dù cùng một trang.

---

## 6. Báo thiếu dữ liệu & định hướng import / export (thiết kế mở)

**Đã có (năng lực)**: nút báo thiếu trên card nhà máy không có data — gửi API, có thể báo trùng (tăng counter).

**Gợi ý cho Figma (chưa bắt buộc dev ngay)**:

1. **Điện trở — đánh dấu thiếu**: ví dụ dòng có thời điểm/NM nhưng `R TT` null → style row (icon / màu nhạt) hoặc badge “Thiếu TT”; export CSV/Excel sau này **giữ nguyên cột** để đối soát.
2. **Export**: nút “Xuất kết quả tra cứu” (bảng điện trở hiện tại + metadata: mã material, mô tả, khóa suy ra).
3. **Import**: không nhét vào màn tra cứu end-user nếu gây rối; có thể **tab “Quản trị dữ liệu”** hoặc trang riêng: upload file điện trở / file năng lực, log lần import, cảnh báo truncate.

Designer: để **slot** hoặc secondary actions (icon download / upload) không làm lệch layout chính.

---

## 7. Thông tin kiến trúc trang: một trang vs hai trang

| Phương án | Ưu điểm | Ghi chú |
|-----------|---------|---------|
| **Một trang** (khuyến nghị giữ đúng dev) | Cùng một material: vừa thấy tốc độ vừa thấy điện trở (XOAN); giảm nhảy context. | Tách rõ **vùng** (banner xanh = năng lực; card tím/violet = điện trở). |
| **Hai trang** | Tách “Tra cứu năng lực” / “Tra cứu điện trở” cho user chỉ cần một việc. | Cần **đồng bộ** ô tìm kiếm + material đã chọn (query param hoặc state) để không nhập lại mã. |

**Không** thiết kế màn điện trở **độc lập** mà bắt nhập tay tiết diện/kết cấu — trái quy tắc đã thống nhất (luôn từ material master).

---

## 8. Checklist giao cho Figma

- [ ] Sticky search + autocomplete + filter công đoạn.
- [ ] Banner năng lực: đủ các field tóm tắt + chip công đoạn.
- [ ] Khối điện trở: chỉ cho XOAN; header khóa + filter Loại SP + thanh “cập nhật mới nhất”.
- [ ] Bảng 7 cột như trên; sticky header cột; scroll; empty/error/loading.
- [ ] Card nhà máy: có data / không có data (dashed + CTA báo thiếu).
- [ ] Annotation: hai nguồn file (năng lực vs điện trở); optional future: export / highlight thiếu / admin import.

---

*Tài liệu phản ánh implementation tại thời điểm tạo; khi API thêm field, cập nhật bảng cột và mục 4 cho khớp backend.*
