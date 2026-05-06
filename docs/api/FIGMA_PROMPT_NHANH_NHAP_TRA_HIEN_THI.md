# Prompt Figma (ngắn) — Nhập liệu · Tra cứu · Hiển thị nhanh

## Mục tiêu UX
Ứng dụng tra cứu năng lực / điện trở: **ít thao tác**, **phản hồi tức thì**, **đọc kết quả trong vài giây**.

## Yêu cầu thiết kế

1. **Nhập liệu**
   - Tra cứu đơn: **một ô tìm kiếm** rõ ràng, gợi ý ngay khi gõ (autocomplete), chọn một dòng là xong — không bắt nhập nhiều bước.
   - Tra cứu theo file: **một nút chọn file** + **một nút chạy** — hiển thị rõ số dòng đã đọc / số mã sau khi gom.

2. **Truy xuất / hiển thị**
   - Sau khi chọn material: **banner tóm tắt** (tốc độ, sản lượng, NM có/thiếu) **ngay phía dưới**, không ẩn sau nhiều click.
   - Chi tiết theo nhà máy: **lưới card** dễ quét; trạng thái “có data / chưa có” phân biệt **màu + icon** một nhìn.
   - Xoắn: khối **điện trở** tách biệt (màu khác banner năng lực), bảng có **header cố định** khi cuộn dài.

3. **Hiển thị nhanh (cảm nhận tốc độ)**
   - **Skeleton / shimmer** khi đang tải — không để trang trống không lời giải thích.
   - Tránh modal không cần thiết cho luồng chính; ưu tiên **cùng một trang**, cuộn mượt.
   - Số liệu quan trọng: **font đậm + đơn vị** rõ (tránh số trơn).

4. **Layout**
   - Tận dụng **chiều ngang** (full width hoặc container rộng) để **4 nhà máy** (nếu có) **cùng một hàng** trên desktop — giảm cuộn dọc lặp lại.

## Giao cho Figma
- Wireframe **1 màn** tra cứu đơn (happy path: gõ → chọn → thấy kết quả < 5s).
- Wireframe **1 màn** file Excel (chọn file → thấy bảng kết quả + lọc + xuất CSV).
- Annotation: *“Ưu tiên tốc độ nhận diện: nhãn đầy đủ, đơn vị, ít cấp độ.”*

---

*Tham chiếu chi tiết UI: `FIGMA_PROMPT_TRA_CUU_DON_UI.md`, `FIGMA_PROMPT_TRA_CUU_FILE_EXCEL_UI.md`, `FIGMA_PROMPT_CAPACITY_LOOKUP_LAYOUT_UNITS.md`.*
