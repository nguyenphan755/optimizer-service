# Trao đổi: dữ liệu điện trở (Excel) ↔ material / tiết diện

**File nguồn (bản gửi kèm):** `cadivi_resistance_weight_data_v1_20260403.xlsx`  
**Mục tiêu:** Từ **order material** (hoặc tiết diện suy ra từ đó), truy xuất **điện trở** (và có thể kèm khối lượng, tỷ lệ %) từ bảng dữ liệu này.

---

## 0. Đã thống nhất (trao đổi — cập nhật)

1. **Phạm vi công đoạn**  
   Chỉ **công đoạn Xoắn** (`XOAN`) cần đọc nguồn điện trở này. Các công đoạn khác **không** dùng luồng điện trở từ file Excel này.

2. **Khóa chung giữa order material (Xoắn) và sheet `DATA`**  
   Khi nhập / tra material **Xoắn**, khớp với Excel theo **đủ ba chiều**, trong đó **kết cấu bắt buộc full chuỗi** (không chỉ prefix `7` / `19` / `37` / `61`):
   - **Loại SP:** **`Acc`**, **`Ccc`**
   - **Tiết diện:** khớp cột **Tiết Diện** trong `DATA`
   - **Kết cấu:** khớp **nguyên chuỗi** như `37/2,63` vs `37/2,99` — hai giá trị **khác nhau** là hai khóa khác nhau.

3. **Hướng triển khai**  
   Ưu tiên **Hướng 1**: từ material Xoắn suy ra **`(Loại SP, Tiết diện, Kết cấu đầy đủ)`** rồi tra `DATA` (+ nhà máy, thời gian).

4. **Liên hệ app hiện tại**  
   Tra cứu năng lực đã có `process_steps.code` (KEO / XOAN / GIAP / BOC). Chỉ khi `XOAN` mới hiển thị / gọi API điện trở (sau này).

5. **Điểm chung để truy xuất điện trở — suy từ `material_description`**  
   Người dùng **tìm kiếm / chọn order material** như hiện tại; hệ thống dùng **`material_description`** (chỉ khi `XOAN`) để suy ra bộ khóa khớp Excel:
   - **Tiết diện** — số (vd mm²) xuất hiện trong mô tả.
   - **Kết cấu (full)** — phần tương ứng trong mô tả được **chuẩn hóa** sang đúng dạng cột **Kết cấu** trong `DATA` (vd `37 × 2,63` / `37x2.63` → **`37/2,63`**, thống nhất dấu phẩy vs chấm).
   - **Loại SP** — thường suy từ **tiền tố / ký hiệu loại** trong mô tả; **ánh xạ cụ thể (vd `Cm` ↔ `Ccc`) tính sau** — chưa chốt trong giai đoạn trao đổi này. Khi implement có thể tạm: **master**, **mặc định**, hoặc **bỏ lọc Loại SP** cho tới khi có bảng map.

   **Ví dụ thảo luận — `53000261`:** `material_description` = **`Cm 185c37x2.63`** → **tiết diện `185`**, **kết cấu `37/2,63`** đã rõ hướng parse; **Loại SP** gắn với `Cm` ↔ `Ccc` **để sau**. Tra `DATA` khi đã có đủ ba chiều (hoặc hai chiều + quy ước tạm cho Loại SP).

6. **Master vs parse (bổ sung cho C)**  
   **Ưu tiên:** quy tắc parse **tiết diện + kết cấu**; **Loại SP** có thể lấy từ **master** hoặc **tạm thời** cho tới khi chốt map `Cm` ↔ `Ccc` (và các cặp khác). **Bảng master** `material_id → (loại_sp, tiết_diện, kết_cấu_full)` dùng khi parse không chắc hoặc ghi đè ngoại lệ.

**Đã trả lời (cập nhật trao đổi):**

| # | Quyết định |
|---|------------|
| **A** | **Bắt buộc full kết cấu** — vd `37/2,63` ≠ `37/2,99`. Join / filter theo chuỗi kết cấu đầy đủ (sau khi chuẩn hóa dấu phẩy/thập phân nếu cần). |
| **B** | Chuỗi kiểu **`37/Ccc`** trên sheet **Đà Nẵng** là **nhập sai**, **không** coi là quy ước nghiệp vụ. Khi import có thể **cảnh báo / loại / sửa tay**; không thiết kế logic đặc biệt để “hiểu” `…/Ccc` là kết cấu. |
| **D — Phase 1** | Excel đang tách **ngày / tháng / năm** (và có **Ca**) cho mỗi lần cập nhật điện trở. **Phase 1:** lưu và trả về **toàn bộ** các bản ghi theo thời gian đã có (lịch sử đầy đủ); **đồng thời** tính và hiển thị rõ **mốc ngày-tháng-năm mới nhất** (và có thể kèm “bản ghi mới nhất” theo từng nhà máy nếu cần). |

**Hoãn / tính sau:**

| # | Nội dung |
|---|----------|
| **`Cm` ↔ `Ccc`** | Ánh xạ tiền tố **`Cm`** sang **`Ccc`** (và các cặp Loại SP tương tự) — **chưa chốt**, làm sau khi nghiệp vụ sẵn sàng. |

**Còn mở (không gồm `Cm`/`Ccc`):**

| # | Nội dung |
|---|----------|
| **C — chi tiết** | **Mẫu regex / grammar** cho tiết diện + kết cấu (vd `…185…37…2,63…`); sau này bổ sung **bảng tiền tố → Loại SP** khi đã chốt. |
| **Parse** | Mô tả **không** khớp mẫu đã thống nhất → báo lỗi hay bắt buộc **master**? |

---

## 1. Những gì file Excel đang có (đã đọc nhanh)

### Sheet `DATA` (~4365 dòng dữ liệu, cột A–AP)

Cột trọng tâm cho “lọc nghiệp vụ”:

| Cột (tên gần đúng) | Ý nghĩa gợi ý |
|--------------------|----------------|
| **Loại SP** | Ví dụ: `Ccc`, `Acc` — nhóm sản phẩm / loại cáp |
| **Tiết Diện** | Số (vd: `185`, `25`, `240`) — có vẻ là **mm²** hoặc quy ước tiết diện |
| **Kết cấu** | Chuỗi (vd: `37/2,63`, `7/1,78`, hoặc `37/Ccc`, `7/Ccc` trên một số sheet nhà máy) — **cấu trúc dây dẫn** |
| **Nhà máy** | Mã / tên (vd: `BN`, sau đó sheet riêng có `BẮC NINH`, `ĐÀ NẴNG`, …) |
| **NSX / Ngày / Tháng / Năm / Ca** | Thời gian và ca — mỗi dòng là **một lần đo / một bản ghi theo thời gian** |
| **Điện trở (max)** / **Điện trở TT** | Giá trị điện trở (một số ô dạng text kiểu `15,65 ÷ 15,90`, một số dạng số) |
| **Tỷ lệ (%) Điện trở**, **Khối lượng**… | KPI phụ trợ |

Các sheet **BẮC NINH / ĐÀ NẴNG / TÂN Á / LONG THÀNH**: tập con theo nhà máy, cột gọn hơn (tiết diện đôi khi ghép chữ kiểu `185 Ccc`).

Các sheet **BIẾN ĐỘNG THÁNG**, **Top R …**, **R theo S**…: chủ yếu là **kết quả pivot / biểu đồ** (ô “NHẬP TIẾT DIỆN”, filter Tháng, Loại SP, Nhà máy…) — **không phải nguồn fact thuần** như `DATA`, nhưng cho thấy **bộ lọc nghiệp vụ** mà Excel đang dùng: *Tiết diện + Loại SP + Nhà máy + (Ca) + Tháng*.

Sheet **SO SÁNH RIÊNG**: khung so sánh theo nhà máy, nhiều ô trống — có vẻ template nhập tay.

---

## 2. Liên hệ với app hiện tại (tra cứu năng lực)

App đang có:

- `material_code`, `material_description` (vd: mã số + mô tả kiểu `BL CX 3x4n7-1kV`)
- `plants` (DN, LT, TA, BN…)
- **Chưa** có trong DB: bảng điện trở / tiết diện chuẩn hóa từ file này

**Điểm chung tiềm năng (để sau này “join” hoặc tra cứu):**

1. **Nhà máy:** Cần **bảng ánh xạ** chuỗi trong Excel (`BN`, `BẮC NINH`, …) ↔ `plants.code` / `plants.name` trong hệ thống (khả thi, làm một lần).
2. **Tiết diện + kết cấu + loại SP:** Đây là **khóa logic** của file điện trở. Để nối với **material**, cần một trong các hướng:
   - **Hướng A — Bảng master:** Bảng `material_cross_section` (material_id → tiết_diện, kết_cấu, loại_SP) do **nghiệp vụ / master data** duy trì (hoặc import từ ERP). *Ổn định nhất.*
   - **Hướng B — Parse mô tả:** Regex / quy tắc từ `material_description` suy ra tiết diện & kết cấu. *Khả thi một phần*, dễ sai với mã đặc biệt, cần **fallback** chỉnh tay.
   - **Hướng C — Chỉ tra theo tiết diện:** User chọn / nhập tiết diện (và lọc nhà máy, tháng) **không bắt buộc** gõ material code — trùng với cách Excel đang filter.

---

## 3. Đánh giá tính khả thi (2 hướng bạn đề xuất)

### Hướng 1 — “Truy vấn được” gắn với order material

**Khả thi có điều kiện (mức ~trung bình → cao nếu có master).**

- File có **đủ** chiều: tiết diện, kết cấu, loại SP, nhà máy, thời gian, điện trở.
- **Không đủ** để tự động 100% chỉ từ `material_code` nếu **chưa có** quy tắc hoặc bảng nối chính thức từ material → (tiết diện, kết cấu, loại SP).
- Một material có thể **khớp nhiều dòng** trong `DATA` (nhiều ngày, nhiều ca) → cần thống nhất **aggregation**: “mới nhất”, “trung bình tháng N”, “min/max”, v.v.

**Việc cần làm trước khi code (đã bổ sung ở mục 0; tóm tắt lại):**

1. Chuẩn hóa **khóa tra cứu** Xoắn: **`(Loại SP ∈ {Acc, Ccc}, Tiết diện, Kết cấu full)`** — xem mục 0.
2. **`37/Ccc` (ĐN):** coi là **lỗi nhập**; import / QA — không map đặc biệt.
3. **Nguồn suy key:** **parse tiết diện + kết cấu** từ `material_description` là trọng tâm; **Loại SP** tạm **master / mặc định** cho tới khi chốt **`Cm` ↔ `Ccc`** (mục **5–6** và bảng **Hoãn** trong §0).
4. **Định dạng điện trở:** một số ô là **khoảng** (`15,65 ÷ 15,90`) — lưu text hoặc tách min/max khi code.
5. **Phase 1 thời gian:** lưu **mọi** dòng theo Ngày/Tháng/Năm (+ Ca); API/UI: danh sách đầy đủ + block **“Cập nhật mới nhất: …”** (theo `max(observed_at)` hoặc ghép ngày từ 3 cột).

### Hướng 2 — Không gắn chặt material: trang độc lập, chỉ lọc như Excel

**Luôn khả thi, rủi ro thấp.**

- Import / đồng bộ sheet **`DATA`** (và tùy chọn sheet theo nhà máy) vào DB hoặc đọc file.
- UI: filter **Tiết diện, Loại SP, Nhà máy, khoảng thời gian** → bảng kết quả + biểu đồ sau (Figma).
- **Không cần** giải bài toán mapping material ngay.

Sau này nếu có master mapping, có thể **nối** nút “Từ material đang xem → mở tab điện trở với filter đã điền”.

---

## 4. Đề xuất bước tiếp (trao đổi, chưa code)

1. **Ưu tiên:** **Hướng 1** + **chỉ Xoắn** + key **`Loại SP / Tiết diện / Kết cấu full`** — **Hướng 2** giữ làm dự phòng / sau.
2. **Ví dụ 5–10 material Xoắn thật:** `material_code` + `material_description` + **Loại SP / Tiết diện / kết cấu đầy đủ** đúng nghiệp vụ — đối chiếu `DATA`.
3. **A, B, D:** đã ghi mục 0 — **`Cm`↔`Ccc` hoãn**; còn **mẫu parse tiết diện/kết cấu** và quy tắc khi parse fail.
4. **Sheet nguồn:** **`DATA`** làm fact chính; import giữ **Ngày, Tháng, Năm, Ca** để sort và “mới nhất”.

---

## 5. Kết luận ngắn

| Câu hỏi | Trả lời tóm tắt |
|--------|------------------|
| File có đủ để làm kho điện trở theo tiết diện / nhà máy / thời gian? | **Có** (sheet `DATA` + sheet theo NM). |
| Tự động từ **chỉ** material code, không có master? | **Chưa chắc** — cần quy tắc hoặc bảng nối; với Xoắn + key 3 thành phần, **khả thi tăng** nếu parse/master thống nhất. |
| Làm trang lọc độc lập giống filter Excel? | **Khả thi rõ ràng**; có thể song song hoặc sau Hướng 1. |

Khi chốt **câu C** và có **ví dụ material Xoắn (mục 4.2)**, có thể thiết kế pha 1: bảng fact lịch sử (mỗi dòng = một lần đo theo ngày/tháng/năm/ca) + API trả `rows[]` + `latest_observed_at` / `latest_row` (hoặc theo nhà máy), chỉ cho `XOAN`.

---

## 6. Thảo luận kỹ thuật — Phase 1 (lịch sử + mới nhất)

- **Nguồn thời gian:** Từ Excel có thể ghép `Ngày` + `Tháng` + `Năm` (và tùy `NSX` nếu là datetime đầy đủ) thành một cột **`observed_at`** (timestamptz) khi import để sort và tính `max()` ổn định.
- **API gợi ý (một endpoint):**  
  - `measurements`: toàn bộ bản ghi khớp key (+ optional `plant_id`), sort **mới → cũ** hoặc **cũ → mới** (thống nhất một kiểu).  
  - `summary`: `latest_observed_at`, có thể thêm `latest_by_plant: { plant_code, date, resistance_tt, … }` nếu UI cần so sánh nhà máy.
- **UI (sau Figma):** một dòng/badge **“Dữ liệu mới nhất: dd/mm/yyyy”** + bảng/timeline các lần đo trước đó — khớp mong muốn “lấy hết các ngày tháng đã cập nhật”.
- **Dữ liệu sai (`37/Ccc`):** báo cáo import (số dòng lỗi) hoặc không import dòng đó cho đến khi sửa file nguồn.
